"""mklogo.py 가 만든 에셋의 코너 규칙을 검사한다.  python3 scripts/test_mklogo.py

깨지면 안 되는 것 두 가지다.
  - 앱 아이콘에 알파가 있으면 Expo 가 흰색으로 합성해 코너가 흰색이 된다 (App Store 도 거부한다)
  - 그 밖의 자리는 코너가 투명해야 한다. 파비콘에는 CSS border-radius 가 안 걸려서
    원본의 흰 코너가 그대로 보인다
"""

import sys
from PIL import Image

# (경로, 알파 있어야 하나)
ASSETS = [
    ("public/logo.png", True),
    ("ios/assets/icon.png", False),
    ("ios/assets/splash-icon.png", True),
    ("ios/assets/favicon.png", True),
    ("ios/assets/logo-mark.png", True),
]

CORNER_BOX = 0.15  # 코너에서 이 비율만큼의 정사각 영역을 흰색 잔존 검사 대상으로 본다


def check(path, want_alpha):
    im = Image.open(path)
    has_alpha = im.mode in ("RGBA", "LA") or "transparency" in im.info
    assert has_alpha == want_alpha, f"{path}: 알파 {has_alpha}, 기대 {want_alpha}"

    rgba = im.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    assert len(set(corners)) == 1, f"{path}: 네 코너가 서로 다르다 {corners}"
    c = corners[0]

    if want_alpha:
        assert c[3] == 0, f"{path}: 코너가 투명하지 않다 {c}"
    else:
        # 코너가 바탕색으로 채워져 있어야 한다 — 흰색이면 원본 코너가 그대로 남은 것이다.
        field = px[w // 2, h // 20]
        assert c[3] == 255, f"{path}: 코너가 불투명해야 한다 {c}"
        assert max(abs(a - b) for a, b in zip(c[:3], field[:3])) <= 4, \
            f"{path}: 코너({c[:3]})가 바탕색({field[:3]})과 다르다"

    # 코너 박스에 불투명한 흰색이 남아 있으면 마스크가 스퀘어클을 못 따라간 것이다.
    box = max(2, int(w * CORNER_BOX))
    left = [px[x, y] for y in range(box) for x in range(box)]
    assert not [p for p in left if p[3] > 60 and min(p[:3]) > 200], \
        f"{path}: 코너 박스에 불투명한 흰색이 남았다"

    print(f"  ok  {path:28} {im.mode:5} corner={c}")


if __name__ == "__main__":
    for path, want_alpha in ASSETS:
        check(path, want_alpha)
    print(f"{len(ASSETS)}개 에셋 통과")
    sys.exit(0)
