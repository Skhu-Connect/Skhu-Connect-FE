/* 알림 발생 지점 정의. 백엔드 NotificationEventService 의 공개 메서드 5개를 그대로 옮겼다
   (Skhu-Connect-BE: onAgreementAdded / onPetitionAnswered / onReplyCreated / onCommentLiked /
   onNoticePublished). 서버 NotificationType 8종이 이 5개 포인트로 빠짐없이 나뉜다 —
   포인트를 늘리거나 줄일 땐 저 서비스부터 확인한다.

   Header.jsx(알림 벨)·MyPageScreen.jsx(알림함)·NotificationSettingsScreen.jsx 가 공용으로 쓴다.

   key 는 백엔드 notificationSettings와 PATCH /connect/users/me/notification-settings의
   5개 키다. */

export const NOTIF_POINTS = [
  {
    key: "agreement",
    title: "공감 도달",
    desc: "내 건의가 목표 공감의 60%·100%에 닿거나, 공감한 건의가 검토에 들어가면 알려드려요.",
    types: ["PETITION_AGREEMENT_60_PERCENT", "PETITION_AGREEMENT_100_PERCENT", "PETITION_UNDER_REVIEW"],
    icon: "trending",
    bg: "var(--status-review-bg)",
    fg: "var(--status-review-fg)",
  },
  {
    key: "answer",
    title: "답변 등록",
    desc: "내가 쓰거나 공감한 건의에 학교의 공식 답변이 올라오면 알려드려요.",
    types: ["PETITION_ANSWERED"],
    icon: "checkCircle",
    bg: "var(--status-answered-bg)",
    fg: "var(--status-answered-fg)",
  },
  {
    key: "reply",
    title: "답글",
    desc: "내가 쓴 댓글에 다른 학생이 답글을 달면 알려드려요.",
    types: ["COMMENT_REPLY"],
    icon: "message",
    bg: "var(--indigo-50)",
    fg: "var(--indigo-600)",
  },
  {
    key: "like",
    title: "댓글 공감",
    desc: "내가 쓴 댓글이나 답글에 공감이 눌리면 알려드려요.",
    types: ["COMMENT_LIKE", "REPLY_LIKE"],
    icon: "heart",
    bg: "#FCE7E9",
    fg: "var(--coral-600)",
  },
  {
    key: "notice",
    title: "공지사항",
    desc: "학생회·관리자가 새 공지를 올리면 알려드려요.",
    types: ["NOTICE"],
    icon: "fileText",
    bg: "var(--gray-150)",
    fg: "var(--gray-700)",
  },
];

/* 알림 한 건의 제목. 본문(message)은 서버가 완성된 문장으로 주므로 여기서는 종류 이름만 짓는다. */
export const NOTIF_TYPE_TITLE = {
  PETITION_AGREEMENT_60_PERCENT: "도달률 60% 달성",
  PETITION_AGREEMENT_100_PERCENT: "도달률 100% 달성",
  PETITION_UNDER_REVIEW: "검토 시작",
  PETITION_ANSWERED: "공식 답변 등록",
  COMMENT_REPLY: "답글 등록",
  COMMENT_LIKE: "댓글 공감",
  REPLY_LIKE: "답글 공감",
  NOTICE: "새 공지사항",
};

const FALLBACK = { key: "etc", title: "알림", desc: "", types: [], icon: "bell", bg: "var(--gray-150)", fg: "var(--gray-700)" };

/** 서버 NotificationType → 그 알림이 속한 포인트. 모르는 종류(백엔드가 enum 을 늘린 경우)는 회색 기본값. */
export const NOTIF_META = Object.fromEntries(NOTIF_POINTS.flatMap((p) => p.types.map((type) => [type, p])));

export function pointOf(type) {
  return NOTIF_META[type] ?? FALLBACK;
}
