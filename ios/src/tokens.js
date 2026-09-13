/* 디자인 토큰 — 값의 원본은 웹 이식본 `src/index.css` 의 @theme 블록이다(이슈 #100).
   tailwind.config.js(노드)와 앱 코드(메트로) 양쪽에서 require 하므로 .js 로 둔다.
   TS 로 바꾸면 tailwind.config.js 가 못 읽는다.

   새 시각 규칙(src/index.css 머리 주석). 새 화면·부품은 이것만 따른다:
   - 색: 액센트는 인디고 하나. 나머지는 채도 없는 회색 한 계열과 의미색(성공·경고·위험)뿐.
     그라데이션·색 그림자는 쓰지 않는다.
   - 모양: 컨트롤(버튼·입력·칩·배지)은 md(6), 떠 있는 면(시트·토스트·메뉴)은 lg(10).
     알약·원형은 쓰지 않는다(아바타만 원).
   - 그림자: 떠 있는 레이어에만 lg. xs/sm/md 는 값이 비어 있다.
   - 글자: 13px 미만 금지. 크기는 fs 단계만 쓴다. */

/* tokens/colors.css */
const colors = {
  white: "#FFFFFF",

  indigo: {
    50: "#EEEEFB",
    100: "#DCDCF4",
    200: "#B9B9E8",
    300: "#8C8AD6",
    400: "#605DBE",
    500: "#46429E",
    600: "#3D3A94", // primary
    700: "#322F7A",
    800: "#29275F",
    900: "#201F49",
  },

  /* 옛 색 계열. 범위 밖 화면(상세·알림 설정)이 아직 쓰고 있어 남긴 것이다.
     새로 쓰지 않는다 — 액센트는 인디고 하나다.
     navy 는 옛 히어로 그라데이션이 유일한 소비자였어서 그것과 함께 지웠다. */
  teal: { 50: "#E4F7F3", 100: "#C2EEE7", 400: "#3FC4B1", 500: "#23B3A0", 600: "#1B9C8B" },
  violet: { 400: "#8B82DD", 500: "#6C63C7", 600: "#5C53B8" },
  coral: { 400: "#F49BA0", 500: "#F0808A", 600: "#E36672" },
  magenta: { 500: "#E12E6D", 600: "#B22C7C" },
  blue: { 500: "#4C6EF5" },

  /* 채도 없는 회색 한 계열. 옛 회색(#F0F1F6, #23242F …)은 푸른 보라 기가 있어 화면 전체가
     인디고로 물들었다. gray-500 이 흰 바탕 5:1 로, 보조 글씨가 이 값이다(옛 #8B8C9C 는 3.3:1). */
  gray: {
    25: "#FBFBFB",
    50: "#F5F5F6",
    100: "#F0F0F1",
    150: "#E9E9EB",
    200: "#E3E3E6",
    300: "#CFCFD4",
    400: "#A3A3AB",
    500: "#6E6E78",
    600: "#5A5A63",
    700: "#414148",
    800: "#2C2C31",
    900: "#1C1C20",
  },

  /* 성공·위험은 채움뿐 아니라 글자색으로도 쓴다 — 흰 바탕 AA 를 맞춘 값이다. */
  success: "#1A7F53",
  warning: "#E8912B",
  danger: "#D12C42",
  info: "#4C6EF5",

  /* 건의 라이프사이클 진행중 → 검토중 → 답변 완료.
     배지는 진한 단색 면 + 흰 글자다(solid-*). 흰 글자 대비 7.56 · 6.76 · 7.90:1 로 AA 를 넘긴다.
     fg/bg 쌍은 상세의 공식 답변 블록이 쓰므로 남긴다 — 배지와 한 토큰으로 합치면 어두운 면에
     어두운 글리프가 얹힌다. answered-fg 는 13px 글씨로도 AA 를 넘기도록 웹이 한 단계 내린 값이다. */
  status: {
    "answered-fg": "#1A7F53",
    "answered-bg": "#EEF8F2",
    /* 상세의 공식 답변 카드 면·테두리. answered-bg 보다 옅다 — 카드 한 장을 통째로 덮는 색이라
       배지에 쓰는 농도로는 본문 글이 안 읽힌다. */
    "answered-surface": "#F2F9F5",
    "answered-line": "#D9EDE3",
    "solid-received": "#4B5563",
    "solid-reviewing": "#8A4B1F",
    "solid-answered": "#235B47",
  },

  /* 시맨틱 별칭 — 화면 코드와 className 이 이 이름을 쓴다. */
  strong: "#1C1C20", // --text-strong
  body: "#414148", // --text-body
  muted: "#6E6E78", // --text-muted
  page: "#FBFBFB", // --surface-page
  card: "#FFFFFF", // --surface-card
  sunken: "#F5F5F6", // --surface-sunken
  subtle: "#E3E3E6", // --border-subtle
  line: "#CFCFD4", // --border-strong
};

/* tokens/radii.css — 컨트롤 6 · 떠 있는 면 10.
   여섯 키를 모두 남긴다: tailwind.config.js 가 각 키를 직접 읽어 borderRadius 를 만든다.
   pill 은 값만 남은 것이다 — 범위 밖 화면이 아직 쓰고 있고, 새로 쓰지 않는다. */
const radius = { xs: 4, sm: 6, md: 6, lg: 10, xl: 10, pill: 999 };

/* tokens/shadows.css — 떠 있는 레이어에만 그림자를 준다.
   xs/sm/md 는 카드에 깔던 그림자다. 값은 비웠지만 **키는 남긴다** — 지우면 범위 밖
   NotifSettings.tsx 를 비롯한 참조 13곳이 undefined 로 타입 오류가 나 이번 범위 밖 파일까지 끌려온다.
   lg 는 CSS `0 12px 32px rgba(20,20,24,.14)` 를 기존 환산 규칙(shadowRadius ≈ blur/2)으로 옮긴 값이다. */
const shadow = {
  xs: {},
  sm: {},
  md: {},
  lg: { shadowColor: "#141418", shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
};

/* 글자 크기 단계 (px) — 13 이 바닥이다. 화면은 이 단계만 쓴다.
   tailwind.config.js 에는 넣지 않는다 — 범위 안 글자는 전부 인라인 style 이다. */
const fs = {
  caption: 13,
  sm: 14,
  body: 15,
  md: 16,
  lg: 17,
  xl: 20,
  xxl: 24,
  title: 28,
};

/* 그라데이션은 새 규칙에서 쓰지 않는다. 피드 머리말과 MY 프로필이 쓰던 hero 는 그 두 화면을
   옮기면서 소비자가 0이 되어 지웠다. mileage 만 남는다 — 범위 밖 상세 화면의 배너(Detail.tsx)가
   아직 쓰고 있어서다. 그 화면을 옮길 때 함께 걷는다. 새로 쓰지 않는다. */
const gradient = {
  mileage: { colors: ["#7A5CD0", "#E12E6D"], start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
};

/* Pretendard 바이너리는 핸드오프에 없다. fonts.css 가 애플 기기 폴백으로 지정한
   Apple SD Gothic Neo(iOS 시스템 한글 서체)를 그대로 쓴다 — 별도 폰트 로딩 없음. */
const font = "Apple SD Gothic Neo";

module.exports = { colors, radius, shadow, gradient, font, fs };
