/* 데이터 접근 계약. 화면·스토어는 **이 파일의 async 함수만** 호출한다.

   Phase 6(백엔드 연동)에서 mock 을 실 백엔드(skhu-connect-be-production.up.railway.app) fetch 로
   교체했다. 계약 차이는 docs/api-spec.md, 결정 사항은 exec-plans/roadmap-web.md Phase 6 참고.

   admin 콘솔(listAdminPetitions/listOwners/listNotifLogs/answerPetition)은 백엔드에 대응
   엔드포인트가 없어 여전히 mockDb.js 의 adminDb 로 동작한다 — 학생 웹 실 청원과는 별개 데이터셋.
   getPrefs/savePrefs(알림 3종 개별 토글)와 updateProfile(학부 수정)도 대응 엔드포인트가 없어
   로컬 상태로만 유지한다(새로고침하면 초기화).

   청원 수정/삭제(PUT·DELETE /connect/petitions/{id}), 댓글 수정/삭제(PUT·DELETE
   .../comments/{id}), 비밀번호 재설정(POST /connect/auth/password/reset)은 백엔드엔 있지만
   화면에 진입점(수정 메뉴·비밀번호 찾기 링크)이 없어 아직 연동하지 않았다 — 필요해지면 그 화면부터 만들 것. */

import { CATEGORY_META, adminDb } from "./mockDb.js";

const BASE_URL = "https://skhu-connect-be-production.up.railway.app";

const CATEGORY_KEY_TO_ENUM = { scholarship: "SCHOLARSHIP", facility: "FACILITY", dorm: "DORMITORY", library: "LIBRARY", department: "DEPARTMENT" };
const CATEGORY_ENUM_TO_KEY = Object.fromEntries(Object.entries(CATEGORY_KEY_TO_ENUM).map(([k, v]) => [v, k]));
const STATUS_ENUM_TO_KEY = { OPEN: "received", UNDER_REVIEW: "reviewing", ANSWERED: "answered", EXPIRED: "received" };

/* 서버 알림 7종 → 기존 화면이 아는 3종 아이콘 계열로 근사 매핑(6-6 에서 7종 전용 아이콘으로 교체 예정). */
const NOTIF_TYPE_TO_LEGACY = {
  PETITION_AGREEMENT_60_PERCENT: "empathy",
  PETITION_AGREEMENT_100_PERCENT: "threshold",
  PETITION_UNDER_REVIEW: "threshold",
  PETITION_ANSWERED: "answer",
  COMMENT_REPLY: "answer",
  COMMENT_LIKE: "empathy",
  REPLY_LIKE: "empathy",
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
  let title = "";
  try {
    title = (await res.json())?.title ?? "";
  } catch {
    /* 본문 없음 */
  }
  const err = new Error(title || `요청을 처리할 수 없습니다. (${res.status})`);
  err.status = res.status;
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

function formatRelative(iso) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

/* ───────────────── voted/bookmarked/mine 파생 ─────────────────
   서버 청원 응답에는 voted/bookmarked/mine 이 없다. 로그인 시 내 공감·북마크·작성 청원 id 집합을
   /connect/users/me/{agreements,bookmarks,petitions} 로 받아 캐시하고, 토글·등록할 때 그 캐시를
   직접 갱신한다. size 는 100 초과 시 서버가 400("Invalid user activity page request")을 낸다. */

let votedIds = new Set();
let bookmarkedIds = new Set();
let myPetitionIds = new Set();
let flagsLoaded = false;

async function ensureFlags() {
  if (flagsLoaded || !accessToken) return;
  flagsLoaded = true;
  try {
    const [agreements, bookmarks, mine] = await Promise.all([
      apiFetch("/connect/users/me/agreements?size=100"),
      apiFetch("/connect/users/me/bookmarks?size=100"),
      apiFetch("/connect/users/me/petitions?size=100"),
    ]);
    votedIds = new Set((agreements?.content ?? []).map((p) => p.id));
    bookmarkedIds = new Set((bookmarks?.content ?? []).map((p) => p.id));
    myPetitionIds = new Set((mine?.content ?? []).map((p) => p.id));
  } catch {
    flagsLoaded = false; // 다음 호출에서 재시도
  }
}

function resetSessionCaches() {
  flagsLoaded = false;
  votedIds = new Set();
  bookmarkedIds = new Set();
  myPetitionIds = new Set();
}

/* ───────────────── 세션 ───────────────── */

let cachedMe = null;

function toUser(me) {
  return { loginId: me.loginId, email: me.email, dept: me.departmentName, departmentCode: me.departmentCode, notificationEnabled: me.notificationEnabled };
}

let localPrefs = { threshold: true, answer: true, empathy: false };

export async function getMe() {
  if (!accessToken) return null;
  const me = await apiFetch("/connect/users/me");
  cachedMe = toUser(me);
  return { ...cachedMe };
}

export async function login(sid, password) {
  const loginId = String(sid ?? "").trim();
  const pw = String(password ?? "").trim();
  if (!loginId || !pw) throw new Error("아이디와 비밀번호를 입력해 주세요.");
  const { accessToken: token } = await apiFetch("/connect/auth/login", { method: "POST", auth: false, body: { loginId, password: pw } });
  accessToken = token;
  resetSessionCaches();
  const user = await getMe();
  return { user, prefs: { ...localPrefs } };
}

/** 이메일 인증 2단계 뒤 호출한다: sendSignupCode → confirmSignupCode(→verificationToken) → signup. */
export async function sendSignupCode(email) {
  await apiFetch("/connect/auth/email-verifications", { method: "POST", auth: false, body: { email, purpose: "SIGN_UP" } });
}

export async function confirmSignupCode(email, code) {
  const { verificationToken } = await apiFetch("/connect/auth/email-verifications/confirm", { method: "POST", auth: false, body: { email, code, purpose: "SIGN_UP" } });
  return verificationToken;
}

export async function signup({ loginId, password, departmentId, verificationToken }) {
  await apiFetch("/connect/auth/signup", { method: "POST", auth: false, body: { loginId, password, departmentId, verificationToken } });
  return login(loginId, password);
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

/** 학부 수정 PATCH 엔드포인트가 없다 — 로컬에만 반영(새로고침하면 초기화, 알려진 한계). */
export async function updateProfile(patch) {
  cachedMe = { ...cachedMe, ...patch };
  return { ...cachedMe };
}

export async function getPrefs() {
  return { ...localPrefs };
}

export async function savePrefs(patch) {
  localPrefs = { ...localPrefs, ...patch };
  return { ...localPrefs };
}

export async function listDepartments() {
  const list = await apiFetch("/connect/departments", { auth: false });
  return (list ?? []).map((d) => ({ value: d.id, label: d.name }));
}

/* ───────────────── 청원 ───────────────── */

function adaptPetition(raw) {
  const key = CATEGORY_ENUM_TO_KEY[raw.category] ?? "department";
  const meta = CATEGORY_META[key];
  const deadline = raw.agreementDeadline ?? raw.expiresAt;
  const daysLeft = deadline ? Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000) : null;
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
    // 댓글 수는 목록 응답에 없다 — 상세 진입 시 listComments 로 실제 값이 덮인다(store loadPetition).
    comments: 0,
    views: 0,
    date: expired || daysLeft == null ? (expired ? "만료" : "") : daysLeft > 0 ? `D-${daysLeft}` : "만료",
    mine: myPetitionIds.has(raw.id),
    voted: votedIds.has(raw.id),
    bookmarked: bookmarkedIds.has(raw.id),
    expired,
    answered: false,
    answer: null,
  };
}

export async function listPetitions() {
  await ensureFlags();
  const data = await apiFetch("/connect/petitions?size=100&sort=createdAt,desc", { auth: false });
  return (data?.content ?? []).map(adaptPetition);
}

export async function getPetition(id) {
  await ensureFlags();
  try {
    const raw = await apiFetch(`/connect/petitions/${Number(id)}`, { auth: false });
    return adaptPetition(raw);
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

export async function createPetition({ category: categoryKey, title, body }) {
  const t = String(title ?? "").trim();
  const b = String(body ?? "").trim();
  if (!CATEGORY_META[categoryKey]) throw new Error("카테고리를 선택해 주세요.");
  if (!t) throw new Error("제목을 입력해 주세요.");
  if (!b) throw new Error("건의 내용을 입력해 주세요.");
  const raw = await apiFetch("/connect/petitions", { method: "POST", body: { category: CATEGORY_KEY_TO_ENUM[categoryKey], title: t, content: b } });
  myPetitionIds.add(raw.id);
  return adaptPetition(raw);
}

/** 409/404 는 "서버가 이미 의도한 상태" 로 간주하고 로컬 집합을 그 상태로 맞춘 뒤 재조회한다. */
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
  return getPetition(petitionId);
}

/* ───────────────── 댓글 ───────────────── */

/** replies 는 root 댓글에만 온다(1단계 대댓글 — 서버가 대댓글의 대댓글을 지원하지 않는다). */
function adaptComment(c) {
  return { id: c.id, author: `익명 ${c.anonymousNumber}`, body: c.content, date: formatRelative(c.createdAt), votes: c.likeCount, mine: c.myComment, liked: c.liked, replies: (c.replies ?? []).map(adaptComment) };
}

export async function listComments(petitionId) {
  const data = await apiFetch(`/connect/petitions/${Number(petitionId)}/comments?size=100`, { auth: false });
  return (data?.content ?? []).map(adaptComment);
}

/** parentCommentId 를 주면 그 root 댓글의 대댓글로 등록한다. */
export async function addComment(petitionId, body, parentCommentId = null) {
  const text = String(body ?? "").trim();
  if (!text) throw new Error("댓글 내용을 입력해 주세요.");
  const raw = await apiFetch(`/connect/petitions/${Number(petitionId)}/comments`, { method: "POST", body: { content: text, parentCommentId } });
  return adaptComment(raw);
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

export async function listCategories() {
  return Object.entries(CATEGORY_META).map(([key, meta]) => ({ key, ...meta }));
}

export async function listOwners() {
  return Object.entries(CATEGORY_META).map(([key, meta]) => ({ key, label: meta.label, ...meta.owner }));
}

/* ───────────────── 알림 ───────────────── */

function adaptNotification(n) {
  return { id: n.id, type: NOTIF_TYPE_TO_LEGACY[n.type] ?? "answer", title: "", body: n.message, petitionId: n.petitionId, date: formatRelative(n.createdAt), read: n.read };
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

/* ───────────────── 관리자 콘솔 (백엔드 미지원 — mockDb.adminDb 로 계속 동작) ───────────────── */

function adminView(p) {
  const meta = CATEGORY_META[p.category];
  return { id: p.id, title: p.title, excerpt: p.excerpt, category: p.category, status: p.status, current: p.current, threshold: meta.threshold, basis: meta.basis, owner: meta.owner, comments: 0, answered: p.status === "answered", answer: adminDb.answers[p.id] ?? null };
}

export async function listAdminPetitions() {
  return adminDb.petitions.map(adminView);
}

export async function listNotifLogs() {
  return [...adminDb.notifLogs];
}

export async function answerPetition(id, body) {
  const text = String(body ?? "").trim();
  if (!text) throw new Error("답변 본문을 입력해 주세요.");
  const p = adminDb.petitions.find((x) => x.id === Number(id));
  if (!p) throw new Error(`청원 ${id} 을(를) 찾을 수 없습니다.`);
  const meta = CATEGORY_META[p.category];
  if (p.current < meta.threshold) throw new Error("임계치에 도달하지 않은 청원입니다.");
  if (adminDb.answers[p.id]) throw new Error("이미 답변이 등록된 청원입니다.");
  adminDb.answers[p.id] = { petitionId: p.id, dept: meta.owner.team, manager: meta.owner.name, date: new Date().toISOString().slice(0, 10).replaceAll("-", "."), body: text };
  p.status = "answered";
  return { petition: adminView(p), answer: adminDb.answers[p.id] };
}
