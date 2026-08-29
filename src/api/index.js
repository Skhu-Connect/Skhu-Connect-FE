/* 데이터 접근 계약. 화면·스토어는 **이 파일의 async 함수만** 호출한다.

   Phase 6(백엔드 연동)에서 mock 을 실 백엔드(skhu-connect-be-production.up.railway.app) fetch 로
   교체했다. 계약 차이는 docs/api-spec.md, 결정 사항은 exec-plans/roadmap-web.md Phase 6 참고.

   admin 콘솔은 로그인·청원 목록·공식 답변(GET/POST/PUT)·콘텐츠 숨김복원·댓글 조회·
   임계치 설정(GET/PUT)까지 실 백엔드로 연동됐다. listOwners/listNotifLogs(담당자 연락처·
   알림 로그)는 대응 엔드포인트가 없어 여전히 mockDb.js 의 CATEGORY_META/adminDb 로 동작한다.
   알림 설정(NotificationSettingsScreen)은 NotificationEventService의 발생 지점 5곳을 보여주고
   PATCH /connect/users/me/notification-settings로 종류별 수신 설정을 저장한다.

   청원 삭제(DELETE /connect/petitions/{id})는 상세 화면 ⋮ 메뉴로 연동했다. 서버가 공감 0건인
   진행중 청원만 허용하므로(아니면 409) 그 조건일 때만 메뉴를 띄운다. 청원 수정(PUT)은 화면에
   진입점을 두지 않기로 했다 — 필요해지면 그 화면부터 만들 것.

   비밀번호 재설정, 아이디 찾기(이메일 인증·비밀번호 확인), 로그인 상태의 아이디·비밀번호 변경까지
   실 백엔드에 연동됐다.

   회원탈퇴(deleteAccount)는 /connect/users/me DELETE({password})로 연동 완료(2026-08-11, /v3/api-docs
   로 계약 재확인 — 204/400/401/404, 에러 title 필드까지 일치). */

import { CATEGORY_META, adminDb } from "./mockDb.js";
import { NOTIF_TYPE_TITLE } from "../components/web/notifMeta.js";

const BASE_URL = "https://skhu-connect-be-production.up.railway.app";

const CATEGORY_KEY_TO_ENUM = { scholarship: "SCHOLARSHIP", facility: "FACILITY", dorm: "DORMITORY", library: "LIBRARY", department: "DEPARTMENT" };
const CATEGORY_ENUM_TO_KEY = Object.fromEntries(Object.entries(CATEGORY_KEY_TO_ENUM).map(([k, v]) => [v, k]));
const STATUS_ENUM_TO_KEY = { OPEN: "received", UNDER_REVIEW: "reviewing", ANSWERED: "answered", EXPIRED: "received" };

const NOTIF_MESSAGE_FALLBACK = {
  PETITION_AGREEMENT_60_PERCENT: "내 청원이 목표 공감의 60%에 도달했습니다.",
  PETITION_AGREEMENT_100_PERCENT: "내 청원이 목표 공감에 도달해 검토가 시작됩니다.",
  PETITION_UNDER_REVIEW: "내 청원을 담당 부서에서 검토하고 있습니다.",
  PETITION_ANSWERED: "내 청원에 공식 답변이 등록되었습니다.",
  COMMENT_REPLY: "내 댓글에 답글이 등록되었습니다.",
  COMMENT_LIKE: "내 댓글에 공감이 추가되었습니다.",
  REPLY_LIKE: "내 답글에 공감이 추가되었습니다.",
  NOTICE: "새 공지사항이 등록되었습니다.",
};

/* ───────────────── fetch 기반 ───────────────── */

let accessToken = null; // 메모리에만 둔다(localStorage 0건) — README 보안 항목 2
let refreshing = null;

async function rawFetch(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: "include", // refreshToken 은 서버 Set-Cookie 로만 오간다
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function refreshAccessToken() {
  if (!refreshing) {
    refreshing = rawFetch("/connect/auth/token/refresh", { method: "POST", auth: false })
      .then(async (res) => {
        if (!res.ok) throw new Error("세션이 만료되었습니다.");
        const data = await res.json();
        accessToken = data.accessToken;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

async function parseError(res) {
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* 본문 없음 */
  }
  const err = new Error(body?.title || `요청을 처리할 수 없습니다. (${res.status})`);
  err.status = res.status;
  err.body = body; // ProblemDetail 의 추가 속성(예: 429 의 retryAfterSeconds)을 호출부가 읽는다
  return err;
}

async function apiFetch(path, opts = {}) {
  let res = await rawFetch(path, opts);
  if (res.status === 401 && opts.auth !== false) {
    try {
      await refreshAccessToken();
      res = await rawFetch(path, opts);
    } catch {
      /* 재발급 실패 — 아래에서 원래 401 을 던진다 */
    }
  }
  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// 서버가 타임존 없는 UTC LocalDateTime을 내려준다 — 그대로 new Date()에 넣으면 브라우저가 로컬시간(KST)으로
// 오인해 9시간 밀린다. 타임존 표기가 없을 때만 'Z'를 붙여 UTC로 명시한다.
function parseServerDate(iso) {
  return new Date(/[Zz]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
}

function formatRelative(iso) {
  const min = Math.floor((Date.now() - parseServerDate(iso).getTime()) / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

/* ───────────────── voted/bookmarked/mine 파생 ─────────────────
   서버 청원 응답에는 voted/bookmarked/mine 이 없다. 로그인 시 내 공감·북마크·작성 청원 id 집합을
   /connect/users/me/{agreements,bookmarks,petitions} 로 받아 캐시하고, 토글·등록할 때 그 캐시를
   직접 갱신한다. size 는 100 초과 시 서버가 400("Invalid user activity page request")을 낸다.

   버그 수정: 셋 다 Promise.all 로 묶여 있으면 하나만 실패(콜드 스타트·일시적 네트워크 오류)해도
   세 Set 이 통째로 비어버린다 — "탭을 나갔다가 들어오면 공감 표시가 사라진다" 증상의 원인.
   allSettled 로 서로 독립시켜 실패한 것만 비우고, 하나라도 실패하면 flagsLoaded 를 다시 false 로
   둬서 다음 호출(피드 재진입 등)에서 그 항목만 재시도되게 한다.
   totalElements 도 같이 저장한다 — mine/voted 개수는 이 페이지(size=100)에 걸리는 청원 수가 아니라
   서버가 세는 전체 개수를 써야 마이페이지 통계가 100건 너머에서도 정확하다. */

let votedIds = new Set();
let bookmarkedIds = new Set();
let myPetitionIds = new Set();
let myTotals = { mine: 0, voted: 0, bookmarked: 0, answered: 0 };
let flagsLoaded = false;

async function ensureFlags() {
  if (flagsLoaded || !accessToken) return;
  flagsLoaded = true;
  const [agreements, bookmarks, mine] = await Promise.allSettled([
    apiFetch("/connect/users/me/agreements?size=100"),
    apiFetch("/connect/users/me/bookmarks?size=100"),
    apiFetch("/connect/users/me/petitions?size=100"),
  ]);
  if (agreements.status === "fulfilled") {
    votedIds = new Set((agreements.value?.content ?? []).map((p) => p.id));
    myTotals = { ...myTotals, voted: agreements.value?.totalElements ?? votedIds.size };
  }
  if (bookmarks.status === "fulfilled") {
    bookmarkedIds = new Set((bookmarks.value?.content ?? []).map((p) => p.id));
    myTotals = { ...myTotals, bookmarked: bookmarks.value?.totalElements ?? bookmarkedIds.size };
  }
  if (mine.status === "fulfilled") {
    myPetitionIds = new Set((mine.value?.content ?? []).map((p) => p.id));
    // "받은 답변" 은 여기서 직접 센다 — 이 목록 응답(size=100)에는 officialAnswer 가 없어
    // adaptPetition() 의 answer 필드가 항상 null 이다(청원 상세 GET 에만 온다). status(ANSWERED)만
    // 여기서 정답이다.
    const answered = (mine.value?.content ?? []).filter((p) => p.status === "ANSWERED").length;
    myTotals = { ...myTotals, mine: mine.value?.totalElements ?? myPetitionIds.size, answered };
  }
  if (agreements.status !== "fulfilled" || bookmarks.status !== "fulfilled" || mine.status !== "fulfilled") {
    flagsLoaded = false; // 실패한 항목이 있다 — 다음 호출에서 재시도
  }
}

/** 마이페이지 통계용. petitions 피드는 최근 100건만 오므로 그 배열을 세면 100건 너머에서 값이 샌다 —
    서버가 센 전체 개수를 그대로 쓴다. */
export function getMyTotals() {
  return { ...myTotals };
}

function resetSessionCaches() {
  flagsLoaded = false;
  votedIds = new Set();
  bookmarkedIds = new Set();
  myPetitionIds = new Set();
  myTotals = { mine: 0, voted: 0, bookmarked: 0, answered: 0 };
}

/* ───────────────── 세션 ───────────────── */

let cachedMe = null;

function toUser(me) {
  return {
    loginId: me.loginId,
    email: me.email,
    dept: me.departmentName,
    departmentCode: me.departmentCode,
    notificationEnabled: me.notificationEnabled,
    notificationSettings: me.notificationSettings,
  };
}

export async function updateNotificationSettings(patch) {
  const settings = await apiFetch("/connect/users/me/notification-settings", { method: "PATCH", body: patch });
  if (cachedMe) cachedMe = { ...cachedMe, notificationSettings: settings };
  return settings;
}

export async function getMe() {
  if (!accessToken) return null;
  const me = await apiFetch("/connect/users/me");
  cachedMe = toUser(me);
  return { ...cachedMe };
}

/** 새로고침 직후 부팅 시 호출한다: accessToken 은 메모리에만 있어 사라졌지만 refreshToken
    쿠키는 살아있을 수 있으므로, 그걸로 세션을 복구해본다. 실패하면 null(비로그인 취급). */
export async function restoreSession() {
  try {
    await refreshAccessToken();
  } catch {
    return null;
  }
  resetSessionCaches();
  const user = await getMe();
  if (!user) return null;
  return { user };
}

export async function login(sid, password) {
  const loginId = String(sid ?? "").trim();
  const pw = String(password ?? "").trim();
  if (!loginId || !pw) throw new Error("아이디와 비밀번호를 입력해 주세요.");
  const { accessToken: token } = await apiFetch("/connect/auth/login", { method: "POST", auth: false, body: { loginId, password: pw } });
  accessToken = token;
  resetSessionCaches();
  const user = await getMe();
  return { user };
}

/** 이메일 인증 2단계 뒤 호출한다: sendSignupCode → confirmSignupCode(→verificationToken) → signup. */
export async function sendSignupCode(email) {
  await apiFetch("/connect/auth/email-verifications", { method: "POST", auth: false, body: { email, purpose: "SIGN_UP" } });
}

export async function confirmSignupCode(email, code) {
  const { verificationToken } = await apiFetch("/connect/auth/email-verifications/confirm", { method: "POST", auth: false, body: { email, code, purpose: "SIGN_UP" } });
  return verificationToken;
}

export async function signup({ loginId, password, departmentId, verificationToken, termsAgreed, termsVersion }) {
  await apiFetch("/connect/auth/signup", { method: "POST", auth: false, body: { loginId, password, departmentId, verificationToken, termsAgreed, termsVersion } });
  return login(loginId, password);
}

export async function sendLoginIdFindCode(email) {
  await apiFetch("/connect/auth/email-verifications", { method: "POST", auth: false, body: { email, purpose: "LOGIN_ID_FIND" } });
}

export async function confirmLoginIdFindCode(email, code) {
  const { verificationToken } = await apiFetch("/connect/auth/email-verifications/confirm", { method: "POST", auth: false, body: { email, code, purpose: "LOGIN_ID_FIND" } });
  return verificationToken;
}

export async function findLoginIdByEmail(verificationToken) {
  const { loginId } = await apiFetch("/connect/auth/login-id/find/email", { method: "POST", auth: false, body: { verificationToken } });
  return loginId;
}

export async function findLoginIdByPassword(email, password) {
  const { loginId } = await apiFetch("/connect/auth/login-id/find/password", { method: "POST", auth: false, body: { email, password } });
  return loginId;
}

/** 비밀번호 찾기 3단계 뒤 호출한다: sendPasswordResetCode → confirmPasswordResetCode(→verificationToken) → resetPassword.
    가입 이메일 인증(sendSignupCode/confirmSignupCode)과 같은 엔드포인트를 purpose 만 바꿔 쓴다. */
export async function sendPasswordResetCode(email) {
  await apiFetch("/connect/auth/email-verifications", { method: "POST", auth: false, body: { email, purpose: "PASSWORD_RESET" } });
}

export async function confirmPasswordResetCode(email, code) {
  const { verificationToken } = await apiFetch("/connect/auth/email-verifications/confirm", { method: "POST", auth: false, body: { email, code, purpose: "PASSWORD_RESET" } });
  return verificationToken;
}

export async function resetPassword(verificationToken, newPassword) {
  const pw = String(newPassword ?? "").trim();
  if (!pw) throw new Error("새 비밀번호를 입력해 주세요.");
  await apiFetch("/connect/auth/password/reset", { method: "POST", auth: false, body: { verificationToken, newPassword: pw } });
}

export async function logout() {
  try {
    await apiFetch("/connect/auth/logout", { method: "POST", auth: false });
  } catch {
    /* 이미 만료됐어도 로컬 상태는 정리한다 */
  }
  accessToken = null;
  cachedMe = null;
  resetSessionCaches();
}

export async function deleteAccount(password) {
  const pw = String(password ?? "").trim();
  if (!pw) throw new Error("비밀번호를 입력해 주세요.");
  await apiFetch("/connect/users/me", { method: "DELETE", body: { password: pw } });
  accessToken = null;
  cachedMe = null;
  resetSessionCaches();
}

export async function changeLoginId(newLoginId, password) {
  const id = String(newLoginId ?? "").trim();
  const pw = String(password ?? "");
  if (!id || !pw) throw new Error("새 아이디와 비밀번호를 입력해 주세요.");
  if (id.length > 50) throw new Error("아이디는 50자 이하로 입력해 주세요.");
  const result = await apiFetch("/connect/users/me/login-id", { method: "PATCH", body: { newLoginId: id, password: pw } });
  if (cachedMe) cachedMe = { ...cachedMe, loginId: result.loginId };
  return result.loginId;
}

export async function changePassword(currentPassword, newPassword) {
  const current = String(currentPassword ?? "");
  const next = String(newPassword ?? "");
  if (!current || !next) throw new Error("현재 비밀번호와 새 비밀번호를 입력해 주세요.");
  await apiFetch("/connect/users/me/password", { method: "PATCH", body: { currentPassword: current, newPassword: next } });
}

export async function updateDepartment(departmentId, departmentName) {
  if (!Number.isSafeInteger(departmentId) || departmentId < 1) throw new Error("학부를 선택해 주세요.");
  await apiFetch("/connect/users/me/department", { method: "PATCH", body: { departmentId } });
  try {
    const user = await getMe();
    if (user) return user;
  } catch {
    /* 204는 이미 확정됐으므로, 프로필 재조회 실패 시 선택한 학부명으로 화면을 맞춘다. */
  }
  cachedMe = { ...cachedMe, dept: departmentName };
  return { ...cachedMe };
}

export async function listDepartments() {
  const list = await apiFetch("/connect/departments", { auth: false });
  return (list ?? []).map((d) => ({ value: d.id, label: d.name }));
}

/* ───────────────── 청원 ───────────────── */

// AnswerModal.jsx 의 ANSWER_SOURCES 라벨과 동일하다 — 실 답변에는 담당자 이름이 없다(답변 주체만).
const ANSWER_SOURCE_LABEL = { OPERATION_TEAM: "운영팀 답변", SCHOOL_OFFICIAL: "학교 공식 답변" };

/** 청원 상세 응답(GET /connect/petitions/{id})에만 오는 필드 — 목록 응답에는 없다. */
function adaptOfficialAnswer(raw) {
  if (!raw) return null;
  return { body: raw.content, dept: ANSWER_SOURCE_LABEL[raw.answerSource] ?? "공식 답변", date: formatRelative(raw.createdAt) };
}

function adaptPetition(raw) {
  const key = CATEGORY_ENUM_TO_KEY[raw.category] ?? "department";
  const meta = CATEGORY_META[key];
  const deadline = raw.agreementDeadline ?? raw.expiresAt;
  const daysLeft = deadline ? Math.ceil((parseServerDate(deadline).getTime() - Date.now()) / 86400000) : null;
  const expired = raw.status === "EXPIRED";
  return {
    id: raw.id,
    title: raw.title,
    excerpt: (raw.content ?? "").slice(0, 120),
    body: raw.content,
    category: key,
    status: STATUS_ENUM_TO_KEY[raw.status] ?? "received",
    current: raw.agreementCount ?? 0,
    threshold: raw.targetAgreementCount ?? meta.threshold,
    basis: meta.basis,
    author: "익명",
    // 홈 화면 "급상승 건의"/"기간 요약"이 기간별 신규 건의를 가려내는 데 쓴다(FeedScreen.jsx).
    createdAt: raw.createdAt,
    // 댓글 수는 목록 응답에 없다 — 상세 진입 시 listComments 로 실제 값이 덮인다(store loadPetition).
    comments: 0,
    views: 0,
    date: expired || daysLeft == null ? (expired ? "만료" : "") : daysLeft > 0 ? `D-${daysLeft}` : "만료",
    mine: myPetitionIds.has(raw.id),
    voted: votedIds.has(raw.id),
    bookmarked: bookmarkedIds.has(raw.id),
    expired,
    answered: raw.status === "ANSWERED",
    answer: adaptOfficialAnswer(raw.officialAnswer),
  };
}

/* 청원 목록/상세 응답에 댓글 수 필드가 없다 — 댓글 목록(원댓글+대댓글)을 직접 세서 채운다.
   실패해도 피드 전체를 막지 않도록 0으로 눙친다. */
async function countComments(petitionId) {
  try {
    const data = await apiFetch(`/connect/petitions/${Number(petitionId)}/comments?size=100`);
    return (data?.content ?? []).reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0);
  } catch {
    return 0;
  }
}

/* listPetitions/getPetition 은 로그인 중이면 토큰을 보낸다(auth 기본값 true) — 서버가
   "로그인한 사용자는 영구 차단한 작성자의 청원을 볼 수 없습니다" 를 이 토큰으로 판단한다
   (Skhu-Connect-BE User Block, 2026-08-18 확인). 비로그인일 땐 accessToken 이 없어 헤더 자체가
   안 붙으므로 기존 동작과 같다. */
export async function listPetitions() {
  await ensureFlags();
  const data = await apiFetch("/connect/petitions?size=100&sort=createdAt,desc");
  const petitions = (data?.content ?? []).map(adaptPetition);
  await Promise.all(petitions.map(async (p) => { p.comments = await countComments(p.id); }));
  return petitions;
}

/** 차단한 작성자의 청원은 404 — 호출부가 이미 null 로 받아 "청원을 찾을 수 없음" 을 탄다. */
export async function getPetition(id) {
  await ensureFlags();
  try {
    const raw = await apiFetch(`/connect/petitions/${Number(id)}`);
    const p = adaptPetition(raw);
    p.comments = await countComments(p.id);
    return p;
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

/** 서버가 429 와 함께 주는 남은 초를 "3분 42초" 로 읽는다. 값이 없으면(구버전 서버) 시간 없이 안내만 한다. */
function cooldownMessage(retryAfterSeconds) {
  const total = Number(retryAfterSeconds);
  const suffix = "마지막 등록 후 10분이 지나야 하며, 삭제한 건의도 이 시간에 포함됩니다.";
  if (!Number.isFinite(total) || total <= 0) return `새 건의는 아직 올릴 수 없습니다. ${suffix}`;
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min ? `${min}분 ${sec}초` : `${sec}초`} 후에 새 건의를 올릴 수 있습니다. ${suffix}`;
}

export async function createPetition({ category: categoryKey, title, body }) {
  const t = String(title ?? "").trim();
  const b = String(body ?? "").trim();
  if (!CATEGORY_META[categoryKey]) throw new Error("카테고리를 선택해 주세요.");
  if (!t) throw new Error("제목을 입력해 주세요.");
  if (!b) throw new Error("건의 내용을 입력해 주세요.");
  // 429 는 서버가 영문 title("Petition creation cooldown is active")로 준다 — 그대로 토스트에 뜨면 안 된다.
  // 쿨다운은 created_at 기준이라 등록 후 삭제해도 풀리지 않는다(PetitionRepository.findLatestCreatedAtByWriterId).
  let raw;
  try {
    raw = await apiFetch("/connect/petitions", { method: "POST", body: { category: CATEGORY_KEY_TO_ENUM[categoryKey], title: t, content: b } });
  } catch (e) {
    if (e.status === 429) throw new Error(cooldownMessage(e.body?.retryAfterSeconds));
    throw e;
  }
  myPetitionIds.add(raw.id);
  myTotals = { ...myTotals, mine: myTotals.mine + 1 };
  return adaptPetition(raw);
}

/** 작성자 본인의 청원 삭제(논리 삭제). 서버는 공감 0건인 OPEN 청원만 허용한다(아니면 409).
    두 번 눌러 404 가 와도 "이미 지워진 것"이므로 성공으로 본다. */
export async function deletePetition(petitionId) {
  const id = Number(petitionId);
  try {
    await apiFetch(`/connect/petitions/${id}`, { method: "DELETE" });
  } catch (e) {
    if (e.status === 409) throw new Error("공감이 달렸거나 검토가 시작된 건의는 삭제할 수 없습니다.");
    if (e.status !== 404) throw e;
  }
  myPetitionIds.delete(id);
  myTotals = { ...myTotals, mine: Math.max(0, myTotals.mine - 1) };
  // 공감은 0건이어야 삭제되므로 voted 는 줄지 않는다. 내 글을 내가 북마크한 경우만 반영한다.
  if (bookmarkedIds.delete(id)) {
    myTotals = { ...myTotals, bookmarked: Math.max(0, myTotals.bookmarked - 1) };
  }
}

const REPORT_REASON_TYPES = new Set(["SPAM", "ABUSE", "INAPPROPRIATE", "FALSE_INFORMATION", "OTHER"]);

function reportReason(reasonType, reasonDetail) {
  const detail = String(reasonDetail ?? "").trim();
  if (!REPORT_REASON_TYPES.has(reasonType)) throw new Error("신고 종류를 선택해 주세요.");
  if (detail.length < 10 || detail.length > 500) throw new Error("신고 이유는 10자 이상 500자 이하로 입력해 주세요.");
  return { reasonType, reasonDetail: detail };
}

export async function reportPetition(id, reasonType, reasonDetail) {
  // 신고 API는 인증 정보가 없을 때 401 대신 400을 준다. HMR 뒤 메모리 토큰이 비어도 쿠키 세션을 먼저 복구한다.
  if (!accessToken) await refreshAccessToken();
  await apiFetch("/connect/reports", {
    method: "POST",
    body: { petitionId: Number(id), commentId: null, ...reportReason(reasonType, reasonDetail) },
  });
}

export async function reportComment(id, reasonType, reasonDetail) {
  if (!accessToken) await refreshAccessToken();
  await apiFetch("/connect/reports", {
    method: "POST",
    body: { petitionId: null, commentId: Number(id), ...reportReason(reasonType, reasonDetail) },
  });
}

/** 청원 작성자를 영구 차단한다(POST /connect/users/me/blocks). 단방향·해제 불가 — 서버가 그 뒤
    listPetitions/getPetition 에서 이 작성자의 글을 걸러준다(위 auth 주석 참고). 409(이미 차단)는
    성공 취급한다 — toggleEmpathy 와 같은 이유. */
async function blockAuthor(targetType, contentId) {
  try {
    await apiFetch("/connect/users/me/blocks", { method: "POST", body: { targetType, contentId: Number(contentId) } });
  } catch (e) {
    if (e.status === 409) return;
    /* 404 의 서버 title 은 "Content writer not found"/"Content not found" 영어 원문이라 그대로 못 쓴다.
       탈퇴한 작성자 차단은 백엔드가 열어줄 예정이라(2026-08-18 협의), 그 전후 모두 맞는 문구로 둔다. */
    if (e.status === 404) throw new Error("이미 삭제되었거나 탈퇴한 사용자예요. 차단할 수 없습니다.");
    throw e;
  }
}

export function blockPetitionAuthor(id) {
  return blockAuthor("PETITION", id);
}

export function blockCommentAuthor(id) {
  return blockAuthor("COMMENT", id);
}

/** 409/404 는 "서버가 이미 의도한 상태" 로 간주하고 로컬 집합을 그 상태로 맞춘 뒤 재조회한다.
    myTotals 도 같이 증감시킨다 — 안 그러면 ensureFlags 가 세션당 한 번만 도는 캐시라
    마이페이지의 "누른 공감" 이 토글 직후엔 갱신되지 않고 다음 전체 새로고침까지 그대로 남는다. */
export async function toggleEmpathy(id) {
  const petitionId = Number(id);
  const wasVoted = votedIds.has(petitionId);
  try {
    await apiFetch(`/connect/petitions/${petitionId}/agreements`, { method: wasVoted ? "DELETE" : "POST" });
  } catch (e) {
    if (e.status !== 409 && e.status !== 404) throw e;
  }
  if (wasVoted) votedIds.delete(petitionId);
  else votedIds.add(petitionId);
  myTotals = { ...myTotals, voted: Math.max(0, myTotals.voted + (wasVoted ? -1 : 1)) };
  return getPetition(petitionId);
}

export async function toggleBookmark(id) {
  const petitionId = Number(id);
  const wasBookmarked = bookmarkedIds.has(petitionId);
  try {
    await apiFetch(`/connect/petitions/${petitionId}/bookmarks`, { method: wasBookmarked ? "DELETE" : "POST" });
  } catch (e) {
    if (e.status !== 409 && e.status !== 404) throw e;
  }
  if (wasBookmarked) bookmarkedIds.delete(petitionId);
  else bookmarkedIds.add(petitionId);
  myTotals = { ...myTotals, bookmarked: Math.max(0, myTotals.bookmarked + (wasBookmarked ? -1 : 1)) };
  return getPetition(petitionId);
}

/* ───────────────── 댓글 ───────────────── */

/** replies 는 root 댓글에만 온다(1단계 대댓글 — 서버가 대댓글의 대댓글을 지원하지 않는다). */
function adaptComment(c) {
  return { id: c.id, author: `익명 ${c.anonymousNumber}`, body: c.content, date: formatRelative(c.createdAt), votes: c.likeCount, mine: c.myComment, liked: c.liked, replies: (c.replies ?? []).map(adaptComment) };
}

/** auth 를 강제로 끄지 않는다 — 로그인 상태여야 서버가 각 댓글의 liked/myComment 를 내 기준으로 채워 준다. */
export async function listComments(petitionId) {
  const data = await apiFetch(`/connect/petitions/${Number(petitionId)}/comments?size=100`);
  return (data?.content ?? []).map(adaptComment);
}

/** parentCommentId 를 주면 그 root 댓글의 대댓글로 등록한다. */
export async function addComment(petitionId, body, parentCommentId = null) {
  const text = String(body ?? "").trim();
  if (!text) throw new Error("댓글 내용을 입력해 주세요.");
  const raw = await apiFetch(`/connect/petitions/${Number(petitionId)}/comments`, { method: "POST", body: { content: text, parentCommentId } });
  return adaptComment(raw);
}

export async function updateComment(petitionId, commentId, body) {
  const text = String(body ?? "").trim();
  if (!text) throw new Error("댓글 내용을 입력해 주세요.");
  const raw = await apiFetch(`/connect/petitions/${Number(petitionId)}/comments/${Number(commentId)}`, { method: "PUT", body: { content: text } });
  return adaptComment(raw);
}

export async function deleteComment(petitionId, commentId) {
  await apiFetch(`/connect/petitions/${Number(petitionId)}/comments/${Number(commentId)}`, { method: "DELETE" });
}

/** liked 는 캐시하지 않고 목록 응답의 CommentResponse.liked 를 그대로 쓴다 — 호출부가 넘겨준다. */
export async function toggleCommentLike(petitionId, commentId, liked) {
  const res = await apiFetch(`/connect/petitions/${Number(petitionId)}/comments/${Number(commentId)}/likes`, { method: liked ? "DELETE" : "POST" });
  return { votes: res.likeCount, liked: res.liked };
}

function adaptMyComment(uc) {
  return { id: uc.comment.id, petitionId: uc.petitionId, title: "", body: uc.comment.content, date: formatRelative(uc.comment.createdAt) };
}

export async function listMyComments() {
  const data = await apiFetch("/connect/users/me/comments?size=100");
  return (data?.content ?? []).map(adaptMyComment);
}

/* ───────────────── 카테고리 · 담당자 (학생/관리자 공용, 클라이언트 상수) ───────────────── */

/* 라벨·기준 문구·담당자는 대응 엔드포인트가 없어 CATEGORY_META 상수를 쓰지만, threshold(목표
   공감 수)는 공개 GET /connect/threshold-settings 로 관리자가 설정한 실제 값을 받아와 덮어쓴다
   (세션당 1회, adminApiFetch 와 달리 인증 불필요 — 학생 화면도 호출 가능). */
// refreshAccessToken(위 63행)과 같은 패턴 — 진행 중인 fetch 를 저장해 동시 호출이 서로 다른
// 결과(하나는 서버값, 하나는 아직 안 덮인 폴백값)를 보지 않고 같은 요청을 같이 기다리게 한다.
let categoryThresholdsPromise = null;

async function ensureCategoryThresholds() {
  if (!categoryThresholdsPromise) {
    categoryThresholdsPromise = apiFetch("/connect/threshold-settings", { auth: false })
      .then((rows) => {
        for (const row of rows ?? []) {
          const key = CATEGORY_ENUM_TO_KEY[row.category];
          if (CATEGORY_META[key]) CATEGORY_META[key].threshold = row.targetAgreementCount;
        }
      })
      .catch(() => {
        categoryThresholdsPromise = null; // 실패 시 다음 호출에서 재시도, 그때까진 폴백값 유지
      });
  }
  return categoryThresholdsPromise;
}

export async function listCategories() {
  await ensureCategoryThresholds();
  return Object.entries(CATEGORY_META).map(([key, meta]) => ({ key, ...meta }));
}

export async function listOwners() {
  return Object.entries(CATEGORY_META).map(([key, meta]) => ({ key, label: meta.label, ...meta.owner }));
}

/* ───────────────── 알림 ───────────────── */

export function notificationMessage(n) {
  const message = String(n.message ?? "").trim();
  // 이미 ? 또는 한자형 깨진 문자로 저장된 알림은 원문 복원이 불가능해 종류별 한국어 문구로 대체한다.
  const broken = /[�]|[\u3400-\u9FFF]/.test(message) || (message.match(/\?/g)?.length ?? 0) >= 2;
  return message && !broken ? message : (NOTIF_MESSAGE_FALLBACK[n.type] ?? "새 알림이 도착했습니다.");
}

/* type 은 서버 enum 그대로 둔다 — 화면(notifMeta.js)이 5개 알림 포인트로 묶는다.
   title 은 종류 이름, body 는 서버가 완성해 준 문장이다. */
function adaptNotification(n) {
  return {
    id: n.id,
    type: n.type,
    title: NOTIF_TYPE_TITLE[n.type] ?? "알림",
    body: notificationMessage(n),
    petitionId: n.petitionId,
    commentId: n.commentId,
    date: formatRelative(n.createdAt),
    read: n.read,
  };
}

export async function listNotifications() {
  const data = await apiFetch("/connect/notifications?size=50");
  return (data?.content ?? []).map(adaptNotification);
}

export async function markAllNotifRead() {
  await apiFetch("/connect/notifications/read-all", { method: "PATCH" });
  return listNotifications();
}

export async function markNotifRead(id) {
  await apiFetch(`/connect/notifications/${Number(id)}/read`, { method: "PATCH" });
}

/* ───────────────── 관리자 인증 ─────────────────
   학생 세션(accessToken/refreshing)과 완전히 분리된 상태를 쓴다. 서버가 리프레시 쿠키명부터
   adminRefreshToken 으로 학생(refreshToken)과 구분해두므로, 401 재시도 때 학생용
   /connect/auth/token/refresh 를 잘못 호출해 관리자 세션이 깨지는 일이 구조적으로 없다. */

let adminAccessToken = null;
let adminRefreshing = null;

async function adminRawFetch(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && adminAccessToken) headers.Authorization = `Bearer ${adminAccessToken}`;
  return fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: "include", // adminRefreshToken 쿠키
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function refreshAdminAccessToken() {
  if (!adminRefreshing) {
    adminRefreshing = adminRawFetch("/connect/admin/auth/token/refresh", { method: "POST", auth: false })
      .then(async (res) => {
        if (!res.ok) throw new Error("세션이 만료되었습니다.");
        const data = await res.json();
        adminAccessToken = data.accessToken;
      })
      .finally(() => {
        adminRefreshing = null;
      });
  }
  return adminRefreshing;
}

async function adminApiFetch(path, opts = {}) {
  let res = await adminRawFetch(path, opts);
  if (res.status === 401 && opts.auth !== false) {
    try {
      await refreshAdminAccessToken();
      res = await adminRawFetch(path, opts);
    } catch {
      /* 재발급 실패 — 아래에서 원래 401 을 던진다 */
    }
  }
  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/** AdminLayout 이 마운트 시 호출한다: adminRefreshToken 쿠키가 살아있으면 세션을 복구한다. */
export async function restoreAdminSession() {
  try {
    await refreshAdminAccessToken();
    return true;
  } catch {
    return false;
  }
}

export async function adminLogin(loginId, password) {
  const id = String(loginId ?? "").trim();
  const pw = String(password ?? "").trim();
  if (!id || !pw) throw new Error("아이디와 비밀번호를 입력해 주세요.");
  const { accessToken: token } = await adminApiFetch("/connect/admin/auth/login", { method: "POST", auth: false, body: { loginId: id, password: pw } });
  adminAccessToken = token;
}

export async function adminLogout() {
  try {
    await adminApiFetch("/connect/admin/auth/logout", { method: "POST", auth: false });
  } catch {
    /* 이미 만료됐어도 로컬 상태는 정리한다 */
  }
  adminAccessToken = null;
}

/* ───────────────── 관리자 콘솔 (로그인·청원 목록·공식 답변은 실 백엔드 — 담당자·알림 로그만 mockDb.adminDb) ───────────────── */

// 담당자 연락처(basis·owner)는 GET /connect/admin/petitions 응답에 없다 — 카테고리 단위 고정값이라
// 여전히 CATEGORY_META 에서 읽는다(#49 Owners 화면과 같은 소스). threshold 는 청원마다 다를 수
// 있어 응답의 targetAgreementCount 를 우선하고, 없을 때만 CATEGORY_META 폴백을 쓴다.
function adaptAdminPetition(raw) {
  const key = CATEGORY_ENUM_TO_KEY[raw.category] ?? "department";
  const meta = CATEGORY_META[key];
  return {
    id: raw.id,
    title: raw.title,
    excerpt: (raw.content ?? "").slice(0, 120),
    category: key,
    status: STATUS_ENUM_TO_KEY[raw.status] ?? "received",
    current: raw.agreementCount ?? 0,
    threshold: raw.targetAgreementCount ?? meta.threshold,
    basis: meta.basis,
    owner: meta.owner,
    hidden: raw.hidden ?? false,
    hiddenReason: raw.hiddenReason ?? null,
    answered: raw.status === "ANSWERED",
    // 목록 응답엔 답변 본문이 없다 — GET .../answer 로 따로 받아야 하는 화면(#47)에서 채운다.
    answer: null,
  };
}

export async function listAdminPetitions() {
  const data = await adminApiFetch("/connect/admin/petitions?size=100");
  return (data?.content ?? []).map(adaptAdminPetition);
}

export async function listNotifLogs() {
  return [...adminDb.notifLogs];
}

function pickHiddenState(raw) {
  return { hidden: raw.hidden, hiddenReason: raw.hiddenReason ?? null };
}

export async function hideAdminPetition(petitionId, reason) {
  const text = String(reason ?? "").trim();
  if (!text) throw new Error("숨김 사유를 입력해 주세요.");
  return pickHiddenState(await adminApiFetch(`/connect/admin/petitions/${Number(petitionId)}/hide`, { method: "PATCH", body: { hiddenReason: text } }));
}

export async function restoreAdminPetition(petitionId) {
  return pickHiddenState(await adminApiFetch(`/connect/admin/petitions/${Number(petitionId)}/restore`, { method: "PATCH" }));
}

const REPORT_STATUS_TO_KEY = { PENDING: "pending", DISMISSED: "dismissed", ACTION_TAKEN: "actionTaken" };
const REPORT_TARGET_TO_KEY = { PETITION: "petition", COMMENT: "comment" };

function adaptAdminReport(raw) {
  return {
    id: raw.id,
    status: REPORT_STATUS_TO_KEY[raw.status] ?? "pending",
    targetType: REPORT_TARGET_TO_KEY[raw.targetType] ?? "petition",
    petitionId: raw.petitionId,
    commentId: raw.commentId ?? null,
    reasonType: raw.reasonType,
    reasonDetail: raw.reasonDetail,
    processingReason: raw.processingReason ?? null,
    // 신고 대상 원문. 작성자가 지운 글도 신고 화면에서는 원문이 보여야 한다(관리자 정책 3절).
    targetTitle: raw.targetTitle ?? null,
    targetContent: raw.targetContent ?? null,
    targetDeleted: raw.targetDeleted ?? false,
    targetHidden: raw.targetHidden ?? false,
  };
}

/** 신고는 현재 최대 100건을 한 번에 관리한다. 페이지네이션이 필요해지면 이 호출에 page 를 노출한다. */
export async function listAdminReports() {
  const data = await adminApiFetch("/connect/admin/reports?size=100");
  return (data?.content ?? []).map(adaptAdminReport);
}

export async function processAdminReport(reportId, status, processingReason) {
  const reason = String(processingReason ?? "").trim();
  const apiStatus = { dismissed: "DISMISSED", actionTaken: "ACTION_TAKEN" }[status];
  if (!apiStatus || !reason) throw new Error("처리 사유를 입력해 주세요.");
  return adaptAdminReport(await adminApiFetch(`/connect/admin/reports/${Number(reportId)}`, { method: "PATCH", body: { status: apiStatus, processingReason: reason } }));
}

function adaptAdminComment(raw) {
  return { id: raw.id, parentCommentId: raw.parentCommentId ?? null, content: raw.content, anonymousNumber: raw.anonymousNumber, hidden: raw.hidden, hiddenReason: raw.hiddenReason ?? null };
}

export async function listAdminComments(petitionId) {
  const data = await adminApiFetch(`/connect/admin/petitions/${Number(petitionId)}/comments?size=100`);
  return (data?.content ?? []).map(adaptAdminComment);
}

export async function hideAdminComment(petitionId, commentId, reason) {
  const text = String(reason ?? "").trim();
  if (!text) throw new Error("숨김 사유를 입력해 주세요.");
  return pickHiddenState(await adminApiFetch(`/connect/admin/petitions/${Number(petitionId)}/comments/${Number(commentId)}/hide`, { method: "PATCH", body: { hiddenReason: text } }));
}

export async function restoreAdminComment(petitionId, commentId) {
  return pickHiddenState(await adminApiFetch(`/connect/admin/petitions/${Number(petitionId)}/comments/${Number(commentId)}/restore`, { method: "PATCH" }));
}

function adaptAdminAnswer(raw) {
  return { id: raw.id, petitionId: raw.petitionId, content: raw.content, answerSource: raw.answerSource, createdAt: raw.createdAt, updatedAt: raw.updatedAt };
}

/** 답변이 아직 없는 청원(등록 전)을 조회하면 서버가 404 를 준다 — 그건 정상 상태라 null 로
    삼킨다. 그 외 오류(권한 없음 등)는 그대로 던진다. */
export async function getAdminAnswer(petitionId) {
  try {
    return adaptAdminAnswer(await adminApiFetch(`/connect/admin/petitions/${Number(petitionId)}/answer`));
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

export async function createAdminAnswer(petitionId, content, answerSource) {
  const text = String(content ?? "").trim();
  if (!text) throw new Error("답변 본문을 입력해 주세요.");
  const raw = await adminApiFetch(`/connect/admin/petitions/${Number(petitionId)}/answer`, { method: "POST", body: { content: text, answerSource } });
  return adaptAdminAnswer(raw);
}

export async function updateAdminAnswer(petitionId, content, answerSource) {
  const text = String(content ?? "").trim();
  if (!text) throw new Error("답변 본문을 입력해 주세요.");
  const raw = await adminApiFetch(`/connect/admin/petitions/${Number(petitionId)}/answer`, { method: "PUT", body: { content: text, answerSource } });
  return adaptAdminAnswer(raw);
}

function adaptThresholdSetting(raw) {
  const key = CATEGORY_ENUM_TO_KEY[raw.category] ?? "department";
  return {
    category: key,
    totalStudentCount: raw.totalStudentCount,
    thresholdRate: raw.thresholdRate,
    minimumCount: raw.minimumCount,
    targetAgreementCount: raw.targetAgreementCount,
    changeReason: raw.changeReason ?? null,
    updatedAt: raw.updatedAt ?? null,
  };
}

export async function listAdminThresholdSettings() {
  const data = await adminApiFetch("/connect/admin/threshold-settings");
  return (data ?? []).map(adaptThresholdSetting);
}

/** targetAgreementCount(실제 목표 공감 수)는 서버가 totalStudentCount·thresholdRate·
    minimumCount 로부터 계산한다 — 클라이언트가 보내지 않는다. */
export async function updateAdminThresholdSetting(category, { totalStudentCount, thresholdRate, minimumCount, changeReason }) {
  const reason = String(changeReason ?? "").trim();
  if (!reason) throw new Error("변경 사유를 입력해 주세요.");
  const enumCategory = CATEGORY_KEY_TO_ENUM[category];
  const raw = await adminApiFetch(`/connect/admin/threshold-settings/${enumCategory}`, {
    method: "PUT",
    body: { totalStudentCount, thresholdRate, minimumCount, changeReason: reason },
  });
  return adaptThresholdSetting(raw);
}
