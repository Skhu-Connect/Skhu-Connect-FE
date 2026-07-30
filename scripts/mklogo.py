"""브랜드 로고 에셋을 원본 한 장(assets/brand-logo.png)에서 만든다.

원본에는 24KB C2PA 프로비넌스 매니페스트(caBX 청크)가 박혀 있었다. 레포에 넣을 때
픽셀은 그대로 두고 그 청크만 벗겼다 — 브랜드 마크가 공개 URL 에서 자기 생성 이력을
광고할 이유가 없고, 7KB 결과물에 25KB 사족이 붙는 것도 곤란하다. 아래 build() 는
Pillow 가 아는 청크만 다시 쓰므로 새 에셋에도 그런 게 섞여 들어가지 않는다.

원본은 라운드 사각형 + 흰 코너 + alpha 없음이다. 그래서 쓰는 자리마다 코너 처리가 다르다.

  투명 코너 (--alpha)   웹 로고·파비콘. CSS border-radius 가 없는 자리(파비콘)에서도
                        흰 코너가 안 보여야 한다. 원본 그대로 쓰면 다크 탭바에서
                        흰 사각 테두리가 보인다
  남색 코너 (--flatten) iOS 앱 아이콘. **알파를 넣으면 안 된다** — App Store 심사가
                        투명도 있는 아이콘을 거부하고, Expo 는 알파를 흰색으로 합성한다
                        (`.expo/web/cache/.../iconsuniversal-icon-<sha>-cover-#ffffff`).
                        투명 코너를 주면 앱 아이콘 코너가 흰색이 된다. iOS 가 자체
                        마스크를 씌우므로 코너를 바탕색으로 채워 full-bleed 로 둔다

코너 마스크는 이미지에서 직접 읽는다. 원본이 원형 호가 아니라 스퀘어클이라
(실측: row 0 에서 변 대비 16.3%, row 10 에서 157px — 원 r=205 예측치 141.8 보다 깊다)
고정 radius 마스크로는 대각선 쪽에 흰 조각이 남는다. 코너 흰 영역은 각 행에서 변부터
시작하는 연속 구간 하나라, 변에서 안쪽으로 걸어들어가다 처음 non-white 에서 멈추면
그게 정확한 경계다.

에셋 네 개를 한 번에 다시 만들려면:

  python3 scripts/mklogo.py assets/brand-logo.png 256  public/logo.png
  python3 scripts/mklogo.py assets/brand-logo.png 1024 ios/assets/icon.png '#1D1F52'
  python3 scripts/mklogo.py assets/brand-logo.png 1024 ios/assets/splash-icon.png
  python3 scripts/mklogo.py assets/brand-logo.png 48   ios/assets/favicon.png
  python3 scripts/test_mklogo.py
"""

import sys
from PIL import Image

WHITE_REF = 253  # 원본 코너의 흰색
STOP_MARGIN = 25  # 바탕색 + 이만큼까지 내려오면 램프가 끝난 것으로 본다 (원본 노이즈 여유)


def corner_alpha(im, field):
    """코너의 안티에일리어싱 램프에서 알파를 역산한 L 마스크.

    이진 임계값으로 자르면 안 된다 — 원본의 코너 경계는 흰색→바탕색 램프이고, 그
    중간 밝기 픽셀들이 "흰색 아님"으로 분류돼 밝은 회색 띠로 살아남는다(1024px 에서 보인다).
    코너는 흰 배경 위에 바탕색을 올린 합성이므로 알파를 되돌릴 수 있다:
    V = a*field + (1-a)*white  ->  a = (WHITE_REF - V) / (WHITE_REF - field).
    빨강 채널을 쓴다 — 253 vs 29 로 대비가 가장 크다(파랑은 253 vs 82 라 둔하다).
    """
    w, h = im.size
    px = im.load()
    mask = Image.new("L", (w, h), 255)
    mp = mask.load()

    stop = field[0] + STOP_MARGIN
    span = WHITE_REF - stop  # 이 구간에서 알파가 0 -> 255 로 간다 (경계에 이음선이 안 생긴다)

    for y in range(h):
        for xs in (range(w), range(w - 1, -1, -1)):  # 왼쪽 변에서, 그리고 오른쪽 변에서 안쪽으로
            for x in xs:
                r = px[x, y][0]
                if r <= stop:
                    break  # 바탕색에 닿았다 — 여기서부터 안쪽은 마크다
                a = round(255 * (WHITE_REF - r) / span)
                mp[x, y] = min(mp[x, y], max(0, min(255, a)))
    return mask


def build(src, size, out, flatten=None):
    """flatten=(r,g,b) 면 코너를 그 색으로 채운 불투명 PNG(앱 아이콘용),
    아니면 코너가 투명한 RGBA PNG(웹·파비콘용)."""
    im = Image.open(src).convert("RGB")
    field = im.getpixel((im.size[0] // 2, im.size[1] // 20))
    mask = corner_alpha(im, field)

    # 램프가 닿은 픽셀은 RGB 를 바탕색으로 **완전히** 덮는다. 부분 알파를 스텐실로 쓰면
    # 원본의 밝은 회색이 절반 남아 다운스케일 때 흰색으로 번진다 — 모양은 알파가 지고,
    # RGB 는 균일해야 한다.
    fill = flatten if flatten else field
    ramp = Image.eval(mask, lambda v: 255 if v < 255 else 0)
    im.paste(Image.new("RGB", im.size, fill), (0, 0), ramp)

    if not flatten:
        im.putalpha(mask)
    small = im.resize((size, size), Image.LANCZOS)

    # 평면 4색 마크라 팔레트로 줄여도 눈에 안 보인다 — 256px 에서 54KB → 7KB.
    # 128 색이 최적점이다(64 색은 maxdiff 51, 128 색부터 27 로 떨어지고 256 색도 27 이다).
    if flatten:
        small.save(out, optimize=True)  # 앱 아이콘은 alpha·팔레트 없이 그대로 둔다
    else:
        small.quantize(colors=128, method=Image.FASTOCTREE).save(out, optimize=True)
    print(f"{out}  {size}x{size}  field={field}  {'opaque RGB' if flatten else 'palette+alpha'}")


if __name__ == "__main__":
    src, size, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
    flat = sys.argv[4] if len(sys.argv) > 4 else None
    build(src, size, out, tuple(int(flat[i:i + 2], 16) for i in (1, 3, 5)) if flat else None)
