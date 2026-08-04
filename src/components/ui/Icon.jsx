import { createElement } from "react";

/* Lucide 지오메트리를 인라인한 아이콘.
   원본: design-handoff/project/app/web-app-v7.jsx 6–54행 (admin-app-v4.jsx 와 동일).
   lucide-react 를 넣지 않는다 — 원본이 필요한 path 지오메트리를 이미 갖고 있고,
   패키지 교체는 픽셀 일치를 보장하지 않는다. */
const LUCIDE = {
  search: [["circle", { cx: 11, cy: 11, r: 8 }], ["path", { d: "m21 21-4.3-4.3" }]],
  plus: [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]],
  bell: [["path", { d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" }], ["path", { d: "M10.3 21a1.94 1.94 0 0 0 3.4 0" }]],
  chevronDown: [["path", { d: "m6 9 6 6 6-6" }]],
  chevronLeft: [["path", { d: "m15 18-6-6 6-6" }]],
  chevronRight: [["path", { d: "m9 18 6-6-6-6" }]],
  arrowLeft: [["path", { d: "m12 19-7-7 7-7" }], ["path", { d: "M19 12H5" }]],
  arrowRight: [["path", { d: "M5 12h14" }], ["path", { d: "m12 5 7 7-7 7" }]],
  share: [["circle", { cx: 18, cy: 5, r: 3 }], ["circle", { cx: 6, cy: 12, r: 3 }], ["circle", { cx: 18, cy: 19, r: 3 }], ["line", { x1: 8.59, y1: 13.51, x2: 15.42, y2: 17.49 }], ["line", { x1: 15.41, y1: 6.51, x2: 8.59, y2: 10.49 }]],
  message: [["path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }]],
  clock: [["circle", { cx: 12, cy: 12, r: 10 }], ["polyline", { points: "12 6 12 12 16 14" }]],
  eye: [["path", { d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" }], ["circle", { cx: 12, cy: 12, r: 3 }]],
  check: [["path", { d: "M20 6 9 17l-5-5" }]],
  checkCircle: [["path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }], ["path", { d: "m9 11 3 3L22 4" }]],
  x: [["path", { d: "M18 6 6 18" }], ["path", { d: "M6 6l12 12" }]],
  send: [["path", { d: "M22 2 11 13" }], ["path", { d: "M22 2 15 22 11 13 2 9z" }]],
  heart: [["path", { d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" }]],
  users: [["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }], ["circle", { cx: 9, cy: 7, r: 4 }], ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }], ["path", { d: "M16 3.13a4 4 0 0 1 0 7.75" }]],
  home: [["path", { d: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }], ["path", { d: "M9 22V12h6v10" }]],
  user: [["path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }], ["circle", { cx: 12, cy: 7, r: 4 }]],
  filter: [["path", { d: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z" }]],
  sliders: [["path", { d: "M21 4h-7" }], ["path", { d: "M10 4H3" }], ["path", { d: "M21 12h-9" }], ["path", { d: "M8 12H3" }], ["path", { d: "M21 20h-5" }], ["path", { d: "M12 20H3" }], ["circle", { cx: 14, cy: 4, r: 2 }], ["circle", { cx: 8, cy: 12, r: 2 }], ["circle", { cx: 16, cy: 20, r: 2 }]],
  logOut: [["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }], ["path", { d: "m16 17 5-5-5-5" }], ["path", { d: "M21 12H9" }]],
  dashboard: [["rect", { x: 3, y: 3, width: 7, height: 9, rx: 1 }], ["rect", { x: 14, y: 3, width: 7, height: 5, rx: 1 }], ["rect", { x: 14, y: 12, width: 7, height: 9, rx: 1 }], ["rect", { x: 3, y: 16, width: 7, height: 5, rx: 1 }]],
  megaphone: [["path", { d: "m3 11 18-5v12L3 14v-3z" }], ["path", { d: "M11.6 16.8a3 3 0 1 1-5.8-1.6" }]],
  calendar: [["rect", { x: 3, y: 4, width: 18, height: 18, rx: 2 }], ["path", { d: "M16 2v4" }], ["path", { d: "M8 2v4" }], ["path", { d: "M3 10h18" }]],
  trending: [["path", { d: "m22 7-8.5 8.5-5-5L2 17" }], ["path", { d: "M16 7h6v6" }]],
  link: [["path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }], ["path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" }]],
  more: [["circle", { cx: 12, cy: 12, r: 1 }], ["circle", { cx: 19, cy: 12, r: 1 }], ["circle", { cx: 5, cy: 12, r: 1 }]],
  inbox: [["path", { d: "M22 12h-6l-2 3h-4l-2-3H2" }], ["path", { d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" }]],
  pencil: [["path", { d: "M12 20h9" }], ["path", { d: "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" }]],
  lock: [["rect", { x: 3, y: 11, width: 18, height: 11, rx: 2 }], ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4" }]],
  fileText: [["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" }], ["path", { d: "M14 2v5h5" }], ["path", { d: "M16 13H8" }], ["path", { d: "M16 17H8" }]],
  bookmark: [["path", { d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" }]],
  shield: [["path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" }], ["path", { d: "m9 12 2 2 4-4" }]],
  sparkles: [["path", { d: "M9.94 14.66A2 2 0 0 1 8.66 13L7 11.34a2 2 0 0 1 0-2.68L8.66 7A2 2 0 0 1 10 5.34L11.66 4" }], ["path", { d: "M12 3v18" }]],

  /* 청원 카테고리 5종. 원본: skhu_tag_components/category/icon_only/*.svg (translate(12,12) 오프셋을 뺀 24x24 좌표). */
  peopleGroup: [["circle", { cx: 8, cy: 8, r: 3 }], ["circle", { cx: 16, cy: 8, r: 3 }], ["path", { d: "M2.5 20c.3-4 2.4-6 5.5-6s5.2 2 5.5 6" }], ["path", { d: "M10.5 20c.3-4 2.4-6 5.5-6s5.2 2 5.5 6" }]],
  dormHouse: [["path", { d: "M3 10.5 12 3l9 7.5" }], ["path", { d: "M5 9.5V21h14V9.5" }], ["path", { d: "M9 21v-7h6v7" }]],
  facilityBuilding: [["path", { d: "M4 21V5h7v16" }], ["path", { d: "M11 9h9v12" }], ["path", { d: "M7 8h1M7 12h1M7 16h1M15 12h1M15 16h1" }], ["path", { d: "M2 21h20" }]],
  bookOpen: [["path", { d: "M3 5.5c3-1 6-.4 9 2v13c-3-2.4-6-3-9-2V5.5Z" }], ["path", { d: "M21 5.5c-3-1-6-.4-9 2v13c3-2.4 6-3 9-2V5.5Z" }]],
  graduationCap: [["path", { d: "M3 9l9-5 9 5-9 5-9-5Z" }], ["path", { d: "M7 11.5V16c0 1.4 2.2 3 5 3s5-1.6 5-3v-4.5" }], ["path", { d: "M21 9v6" }]],
};

export const ICON_NAMES = Object.keys(LUCIDE);

export function Icon({ name, size = 20, stroke = 2, color = "currentColor", style }) {
  const node = LUCIDE[name];
  if (!node) return null; // 원본과 동일: 없는 이름은 렌더하지 않는다
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {node.map((c, i) => createElement(c[0], { ...c[1], key: i }))}
    </svg>
  );
}
