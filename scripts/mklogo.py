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
고정 radius 마스크로는 대각선 쪽에 흰 조각이 남는다. 그래서 각 행에서 변부터 안쪽으로
걸어들어가며 **바탕색에 닿을 때까지** 코너로 본다. 마스터가 경계에 어두운 윤곽선을
구워 넣어서(좌측 변 y=186 에서 휘도 251→253→167→16.5→35.4, 16.5 는 바탕 34.3 보다 어둡다)
"흰색이 끝나는 곳"으로 끊으면 그 윤곽선이 남아 검은 후광이 된다.

에셋 네 개를 한 번에 다시 만들려면:

  python3 scripts/mklogo.py assets/brand-logo.png 256  public/logo.png
  python3 scripts/mklogo.py assets/brand-logo.png 1024 ios/assets/icon.png '#1D1F52'
  python3 scripts/mklogo.py assets/brand-logo.png 1024 ios/assets/splash-icon.png '#1D1F52'
  python3 scripts/mklogo.py assets/brand-logo.png 256  ios/assets/logo-mark.png
  python3 scripts/mklogo.py assets/brand-logo.png 48   ios/assets/favicon.png
  python3 scripts/test_mklogo.py
"""

import sys
from PIL import Image

WHITE_REF = 253  # 원본 코너의 흰색
STOP_MARGIN = 25  # 바탕색 + 이만큼까지 내려오면 램프가 끝난 것으로 본다 (원본 노이즈 여유)
FIELD_EPS = 3  # 휘도가 바탕색과 이 안쪽이면 바탕에 닿은 것으로 본다 (실측 바탕 노이즈 ±0.9)
RIM_EXTEND = 14  # 바탕에 닿은 뒤 더 덮는 픽셀 수. 마스터 윤곽선의 이중 딥을 흡수한다.
# 실측: 딥이 첫 접촉 뒤 최대 10px(상단우 y=1)까지 간다 — 네 변 모두 8~10px 다.
# 여유를 넉넉히 잡아 14 로 뒀다 — 1:1(다운스케일 없음)에서도 네 코너 dark residual 0px.


def corner_alpha(im, field):
    """코너의 안티에일리어싱 램프에서 알파를 역산한 L 마스크.

    이진 임계값으로 자르면 안 된다 — 원본의 코너 경계는 흰색→바탕색 램프이고, 그
    중간 밝기 픽셀들이 "흰색 아님"으로 분류돼 밝은 회색 띠로 살아남는다(1024px 에서 보인다).
    코너는 흰 배경 위에 바탕색을 올린 합성이므로 알파를 되돌릴 수 있다:
    V = a*field + (1-a)*white  ->  a = (WHITE_REF - V) / (WHITE_REF - field).
    빨강 채널을 쓴다 — 253 vs 29 로 대비가 가장 크다(파랑은 253 vs 82 라 둔하다).

    다만 분모는 `WHITE_REF - field` 가 아니라 `WHITE_REF - (field + STOP_MARGIN)` 이다.
    STOP_MARGIN 이 두 역할을 겸한다 — 램프를 끊는 지점이면서 알파 분모다. 그래서 알파가
    break 지점에서 정확히 255 에 닿아 접합부에 이음선이 안 생긴다. 참 분모를 쓰면 거기서
    227 로 끝나 1px 밝은 선이 남는다. 대신 알파가 약간(현 원본에서 ×1.125) 과대평가되는데,
    남색이 조금 더 나가는 안전한 방향이고 이 크기에선 sub-pixel 이다.
    **어두운 바탕 전제다** — 밝은 원본(field R=200 같은)으로 재생성하면 과대평가가 ×1.9 로
    커져 엣지가 두꺼워진다. 그때는 두 역할을 상수 둘로 쪼개야 한다.
    """
    w, h = im.size
    px = im.load()
    mask = Image.new("L", (w, h), 255)
    mp = mask.load()

    stop = field[0] + STOP_MARGIN
    span = WHITE_REF - stop  # 이 구간에서 알파가 0 -> 255 로 간다 (경계에 이음선이 안 생긴다)
    lum = lambda p: 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]
    field_lum = lum(field)
    limit = int(w * 0.25)  # walk 가 코너를 넘어 마크까지 파고들지 못하게 하는 안전선

    touched = Image.new("L", (w, h), 0)  # walk 가 지나간 자리 — RGB 를 바탕색으로 덮을 범위
    tp = touched.load()

    for y in range(h):
        for xs in (range(w), range(w - 1, -1, -1)):  # 왼쪽 변에서, 그리고 오른쪽 변에서 안쪽으로
            extend = 0
            for i, x in enumerate(xs):
                if i >= limit:
                    break
                p = px[x, y]
                # 멈추는 기준은 "바탕색에 닿았는가" 다. R 채널만 보고 끊으면 마스터가 경계에
                # 구워 넣은 어두운 윤곽선의 전이 구간(R 이 바탕과 비슷한데 휘도는 낮은 픽셀)을
                # 바탕으로 오판해 그 자리에서 멈추고, 그 윤곽선이 그대로 남는다.
                if abs(lum(p) - field_lum) <= FIELD_EPS:
                    # 바탕에 닿았지만 몇 픽셀 더 덮는다. 윤곽선이 바탕색과 비슷한 값을 한 번
                    # 지나갔다가 다시 어두워지는 이중 딥이라, 여기서 바로 끊으면 그 딥이 남는다.
                    # 덮는 자리는 어차피 바탕이다 — 마크는 변에서 130px 넘게 떨어져 있다.
                    if extend >= RIM_EXTEND:
                        break
                    extend += 1
                elif p[0] > stop:  # 흰 배경 ~ 램프 → 알파를 역산한다
                    a = round(255 * (WHITE_REF - p[0]) / span)
                    mp[x, y] = min(mp[x, y], max(0, min(255, a)))
                # 그 밖(어두운 윤곽선)은 도형 안쪽이라 알파 255 로 두고 색만 덮는다.
                tp[x, y] = 255
    return mask, touched


def build(src, size, out, flatten=None):
    """flatten=(r,g,b) 면 코너를 그 색으로 채운 불투명 PNG(앱 아이콘용),
    아니면 코너가 투명한 RGBA PNG(웹·파비콘용)."""
    im = Image.open(src).convert("RGB")
    field = im.getpixel((im.size[0] // 2, im.size[1] // 20))
    mask, touched = corner_alpha(im, field)

    # walk 가 지나간 픽셀은 RGB 를 바탕색으로 **완전히** 덮는다. 부분 알파를 스텐실로 쓰면
    # 원본의 밝은 회색이 절반 남아 다운스케일 때 흰색으로 번진다 — 모양은 알파가 지고,
    # RGB 는 균일해야 한다. 마스터의 어두운 윤곽선도 이 범위에 들어와 같이 덮인다.
    fill = flatten if flatten else field
    im.paste(Image.new("RGB", im.size, fill), (0, 0), touched)

    # RGB 와 마스크를 **따로** 줄여서 합친다. RGBA 를 한 번에 resize 하면 Pillow 가
    # 완전 투명 픽셀의 RGB 를 (0,0,0) 으로 만들어(LANCZOS·BICUBIC·BILINEAR 전부 그렇다)
    # 위에서 칠한 남색이 지워지고, 램프에 검정이 섞여 코너에 검은 후광이 남는다.
    # 클립하는 자리에서는 안 보이지만 스플래시는 램프를 그대로 그려서 눈에 띈다.
    small = im.resize((size, size), Image.LANCZOS)  # im 은 아직 RGB 다 — alpha 를 안 붙였다
    if not flatten:
        small.putalpha(mask.resize((size, size), Image.LANCZOS))

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
