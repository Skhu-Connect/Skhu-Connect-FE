"""mklogo.py 가 만든 에셋의 코너 규칙을 검사한다.  python3 scripts/test_mklogo.py

깨지면 안 되는 것 네 가지다.
  - 앱 아이콘에 알파가 있으면 Expo 가 흰색으로 합성해 코너가 흰색이 된다 (App Store 도 거부한다)
  - 스플래시도 불투명이다. expo-splash-screen 이 이 에셋을 imageWidth 기준으로 다시 리샘플하는데,
    그 리샘플이 투명 픽셀 RGB 를 (0,0,0) 으로 만들어 코너에 검은 후광을 남긴다. 스플래시 배경색과
    같은 색으로 코너를 채우면 시각적으로 같으면서 그 버그에 걸리지 않는다
  - 그 밖의 자리는 코너가 투명해야 한다. 파비콘·스플래시에는 CSS/뷰 라운딩이 없어서
    원본의 흰 코너가 그대로 보인다
  - **투명 영역의 RGB 도 바탕색이어야 한다.** 알파만 맞으면 되는 게 아니다 — RGBA 를 한 번에
    resize 하면 Pillow 가 투명 픽셀 RGB 를 (0,0,0) 으로 만들고, 램프에 검정이 섞여
    스플래시 코너에 검은 후광이 남는다. 알파 0 이라 합성에서는 안 보이지만 리샘플링에서 번진다
  - 웹 로고와 모바일 로그인 마크는 같은 파일이어야 한다. 번들이 달라 복사해 두는데,
    한쪽만 다시 만들면 브랜드 마크가 조용히 갈라진다
"""

import sys
from PIL import Image

lum = lambda p: 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]

# (경로, 알파 있어야 하나)
ASSETS = [
    ("public/logo.png", True),
    ("ios/assets/icon.png", False),  # 스플래시도 이 파일을 쓴다 (app.json) — 별도 splash-icon.png 없음
    ("ios/assets/favicon.png", True),
    ("ios/assets/logo-mark.png", True),
]

# 같은 마크를 두 번들에 복사해 둔 쌍 — 바이트까지 같아야 한다.
MIRRORED = ("public/logo.png", "ios/assets/logo-mark.png")

# 원본 자체 라운딩이 변 대비 16.3% 다. 그보다 넉넉히 잡아 호가 직선 변에 닿는
# 가장 바깥 조각까지 검사 안에 들어오게 한다.
CORNER_BOX = 0.20

ALPHA_EPS = 8  # 코너 끝에서 허용하는 알파. 눈에 보이는 하한(약 3%)보다 아래다.

# 코너가 바탕색보다 이만큼 넘게 어두우면 실패. 지금은 잔여가 0 이라 바탕 노이즈(±0.9)
# 바로 위로 조여 둔다 — 기기 실측 -13 이 둥근 윤곽선으로 보였던 회귀를 잡는 게 목적이다.
DARK_EPS = 3


def corners_of(px, w, h, box):
    """네 코너의 (박스 픽셀들, 코너 끝 픽셀) 을 준다. 원본이 상하 비대칭이라 한 곳만 보면 안 된다."""
    quads = {
        "TL": [(x, y) for y in range(box) for x in range(box)],
        "TR": [(w - 1 - x, y) for y in range(box) for x in range(box)],
        "BL": [(x, h - 1 - y) for y in range(box) for x in range(box)],
        "BR": [(w - 1 - x, h - 1 - y) for y in range(box) for x in range(box)],
    }
    return {k: [px[p] for p in pts] for k, pts in quads.items()}


def check(path, want_alpha):
    im = Image.open(path)
    has_alpha = im.mode in ("RGBA", "LA") or "transparency" in im.info
    assert has_alpha == want_alpha, f"{path}: 알파 {has_alpha}, 기대 {want_alpha}"

    rgba = im.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    box = max(2, int(w * CORNER_BOX))
    field = px[w // 2, h // 20]
    quads = corners_of(px, w, h, box)

    for name, pixels in quads.items():
        tip = pixels[0]  # 코너 끝
        if want_alpha:
            # 정확히 0 을 요구하지 않는다. 48px 파비콘은 1254px 원본을 26배 줄인 것이고
            # 라운딩 반지름이 7.8px 밖에 안 돼서, 코너 픽셀이 호의 안티에일리어싱과
            # 정당하게 겹친다(LANCZOS 는 support 가 넓다). 2/255 는 눈에 안 보인다.
            assert tip[3] <= ALPHA_EPS, f"{path} {name}: 코너가 투명하지 않다 {tip}"
        else:
            assert tip[3] == 255, f"{path} {name}: 코너가 불투명해야 한다 {tip}"
            assert max(abs(a - b) for a, b in zip(tip[:3], field[:3])) <= 4, \
                f"{path} {name}: 코너({tip[:3]})가 바탕색({field[:3]})과 다르다"

        # 불투명한 흰색이 남았으면 마스크가 스퀘어클을 못 따라간 것이다.
        white = [p for p in pixels if p[3] > 60 and min(p[:3]) > 200]
        assert not white, f"{path} {name}: 코너 박스에 불투명한 흰색 {len(white)}px"

        # 코너가 바탕색보다 어두우면 안 된다 — 투명 픽셀의 RGB 가 검정으로 죽었거나
        # 마스터의 어두운 윤곽선이 남은 것이다. 둘 다 리샘플 후 검은 후광으로 보인다.
        dark = [p for p in pixels if lum(p[:3]) < lum(field[:3]) - DARK_EPS]
        assert not dark, \
            f"{path} {name}: 램프 RGB 가 바탕색보다 어둡다 {len(dark)}px, 예: {dark[0]} (바탕 {field[:3]})"

    print(f"  ok  {path:28} {im.mode:5} field={field[:3]} corners=4")


if __name__ == "__main__":
    for path, want_alpha in ASSETS:
        check(path, want_alpha)

    a, b = (open(p, "rb").read() for p in MIRRORED)
    assert a == b, f"{MIRRORED[0]} 와 {MIRRORED[1]} 이 다르다 — 한쪽만 다시 만들었다"
    print(f"  ok  {MIRRORED[0]} == {MIRRORED[1]}")

    print(f"{len(ASSETS)}개 에셋 통과")
    sys.exit(0)
