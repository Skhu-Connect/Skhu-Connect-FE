/* 디자인 토큰 — 원본은 design-handoff 의 _ds/…/tokens/*.css 다.
   tailwind.config.js(노드)와 앱 코드(메트로) 양쪽에서 require 하므로 .js 로 둔다.
   TS 로 바꾸면 tailwind.config.js 가 못 읽는다. */

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
  navy: { 900: "#26264F" },
  teal: { 50: "#E4F7F3", 100: "#C2EEE7", 400: "#3FC4B1", 500: "#23B3A0", 600: "#1B9C8B" },
  violet: { 400: "#8B82DD", 500: "#6C63C7", 600: "#5C53B8" },
  coral: { 400: "#F49BA0", 500: "#F0808A", 600: "#E36672" },
  magenta: { 500: "#E12E6D", 600: "#B22C7C" },
  blue: { 500: "#4C6EF5" },

  gray: {
    50: "#F5F6FA",
    100: "#F0F1F6",
    150: "#E9EAF1",
    200: "#E1E2EC",
    300: "#CFD0DC",
    400: "#A9AAB9",
    500: "#8B8C9C",
    600: "#6A6B7B",
    700: "#4C4D5C",
    800: "#333442",
    900: "#23242F",
  },

  success: "#22A06B",
  warning: "#E8912B",
  danger: "#E5354A",
  info: "#4C6EF5",

  /* 청원 라이프사이클 접수 → 검토중 → 답변 완료 */
  status: {
    "received-fg": "#3D3A94",
    "received-bg": "#E7E7F7",
    "review-fg": "#B26A00",
    "review-bg": "#FCEFD6",
    "answered-fg": "#1B8F5E",
    "answered-bg": "#DDF3E7",
  },

  /* 카테고리 액센트 */
  cat: {
    scholarship: "#E8912B",
    facility: "#23B3A0",
    dorm: "#6C63C7",
    library: "#F0808A",
    department: "#4C6EF5",
  },

  /* 시맨틱 별칭 — 디자인 원본이 이 이름으로 쓰므로 className 도 같은 이름을 쓴다 */
  strong: "#23242F", // --text-strong
  body: "#4C4D5C", // --text-body
  muted: "#8B8C9C", // --text-muted
  page: "#F0F1F6", // --surface-page
  card: "#FFFFFF", // --surface-card
  sunken: "#F5F6FA", // --surface-sunken
  subtle: "#E1E2EC", // --border-subtle
  line: "#CFD0DC", // --border-strong
};

/* tokens/radii.css */
const radius = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };

/* tokens/shadows.css — CSS blur 를 iOS shadowRadius(≈blur/2)로 환산했다. */
const shadow = {
  xs: { shadowColor: "#26264F", shadowOpacity: 0.06, shadowRadius: 1, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  sm: { shadowColor: "#26264F", shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  md: { shadowColor: "#26264F", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  lg: { shadowColor: "#26264F", shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 14 }, elevation: 10 },
  magenta: { shadowColor: "#E12E6D", shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
};

/* 시그니처 그라데이션.
   CSS 100deg → 단위 좌표. sin/cos 로 환산한 값을 반올림했다. */
const gradient = {
  hero: { colors: ["#3D5AB5", "#34348A", "#26264F"], locations: [0, 0.55, 1], start: { x: 0, y: 0.59 }, end: { x: 1, y: 0.41 } },
  mileage: { colors: ["#7A5CD0", "#E12E6D"], start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
};

/* Pretendard 바이너리는 핸드오프에 없다. fonts.css 가 애플 기기 폴백으로 지정한
   Apple SD Gothic Neo(iOS 시스템 한글 서체)를 그대로 쓴다 — 별도 폰트 로딩 없음. */
const font = "Apple SD Gothic Neo";

module.exports = { colors, radius, shadow, gradient, font };
