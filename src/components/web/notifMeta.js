/* 알림 발생 지점 정의. 백엔드 NotificationEventService 의 발생 지점을 그대로 옮겼다
   (Skhu-Connect-BE: onAgreementAdded / onPetitionAnswered / onReplyCreated / onCommentLiked /
   onNoticePublished / onReportProcessed). 서버 NotificationType 12종이 이 6개 포인트로
   빠짐없이 나뉜다 — 포인트를 늘리거나 줄일 땐 저 서비스부터 확인한다.

   Header.jsx(알림 벨)·MyPageScreen.jsx(알림함)·NotificationSettingsScreen.jsx 가 공용으로 쓴다.

   key 는 백엔드 notificationSettings와 PATCH /connect/users/me/notification-settings의
   6개 키다(agreement/answer/reply/like/notice/report) — NotificationSettingsScreen 이 이
   key 로 토글 스위치를 그리고 그대로 PATCH 바디에 싣는다. "report" 는 신고 처리 결과(신고자
   대상)와 운영 조치 안내(피신고자 대상)를 한 토글로 묶는다 - 백엔드가 NotificationPoint.REPORT
   하나로 둘 다 게이트한다(User.notifyReport 하나, 둘로 안 나뉜다). */

export const NOTIF_POINTS = [
  {
    key: "agreement",
    title: "요청 도달",
    desc: "내 건의가 목표 요청의 60%·100%에 닿거나, 요청한 건의가 검토에 들어가면 알려드려요.",
    types: ["PETITION_AGREEMENT_60_PERCENT", "PETITION_AGREEMENT_100_PERCENT", "PETITION_UNDER_REVIEW"],
    icon: "trending",
    bg: "var(--status-review-bg)",
    fg: "var(--status-review-fg)",
  },
  {
    key: "answer",
    title: "답변 등록",
    desc: "내가 쓰거나 요청한 건의에 학교의 공식 답변이 올라오면 알려드려요.",
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
  {
    key: "report",
    title: "신고 알림",
    desc: "내가 신고한 글·댓글의 처리 결과나, 내가 쓴 글·댓글이 숨김·계정 정지된 사실을 알려드려요.",
    types: ["REPORT_DISMISSED", "REPORT_ACTION_TAKEN", "CONTENT_HIDDEN", "ACCOUNT_LOGIN_BANNED"],
    icon: "flag",
    bg: "var(--teal-50)",
    fg: "var(--teal-600)",
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
  REPORT_DISMISSED: "신고 기각",
  REPORT_ACTION_TAKEN: "신고 조치 완료",
  CONTENT_HIDDEN: "글 숨김 처리",
  ACCOUNT_LOGIN_BANNED: "로그인 제한",
};

const FALLBACK = { key: "etc", title: "알림", desc: "", types: [], icon: "bell", bg: "var(--gray-150)", fg: "var(--gray-700)" };

/** 서버 NotificationType → 그 알림이 속한 포인트. 모르는 종류(백엔드가 enum 을 늘린 경우)는 회색 기본값. */
export const NOTIF_META = Object.fromEntries(NOTIF_POINTS.flatMap((p) => p.types.map((type) => [type, p])));

export function pointOf(type) {
  return NOTIF_META[type] ?? FALLBACK;
}
