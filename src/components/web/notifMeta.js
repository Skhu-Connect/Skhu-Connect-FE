/* Header.jsx(알림 벨 드롭다운)·MyPageScreen.jsx(알림 목록) 공용 아이콘·색 매핑.
   api.js 의 NOTIF_TYPE_TO_LEGACY 가 서버 7종 알림을 이 3종으로 근사한다. */
export const NOTIF_META = {
  threshold: { icon: "trending", bg: "var(--status-review-bg)", fg: "var(--status-review-fg)" },
  answer: { icon: "checkCircle", bg: "var(--status-answered-bg)", fg: "var(--status-answered-fg)" },
  empathy: { icon: "heart", bg: "#FCE7E9", fg: "var(--coral-600)" },
};
