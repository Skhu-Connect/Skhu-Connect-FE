/* 실 백엔드(skhu-connect-be-production.up.railway.app) 연동 계약. 화면·App.tsx 는
   이 파일의 async 함수만 호출한다.

   웹 src/api/index.js 를 TS 로 포팅했다 — 어댑터·인증 흐름·이미 겪은 백엔드 제약(댓글 수
   미포함, mine/voted 파생 필요, 알림 설정 변경 API 없음)이 동일하게 적용된다. 공식 답변 본문은
   청원 상세 GET(`/connect/petitions/{id}`)의 officialAnswer 로 온다 — 목록 응답에는 없다.
   모바일 UI 가 안 쓰는 것(북마크, 댓글 수정/삭제/공감, 청원 수정/삭제, 전체 읽음)은 포팅하지
   않았다 — 진입점이 없는 코드는 만들지 않는다.

   비밀번호 재설정, 아이디 찾기(이메일 인증·비밀번호 확인), 로그인 상태의 비밀번호 변경까지
   실 백엔드에 연동했다.

   deleteAccount 는 DELETE /connect/users/me({password})로, updateDepartment 는
   PATCH /connect/users/me/department({departmentId})로 연동한다. */

import { NOTIF_TYPE_TITLE, pointOf } from "./data";
import type { AdminAnswer, CategoryKey, Comment, MyComment, Notice, Notification, NotificationSettingKey, Petition, StatusKey } from "./data";
import { basisFor, thresholdFor } from "./logic";

const BASE_URL = "https://skhu-connect-be-production.up.railway.app";

const CATEGORY_KEY_TO_ENUM: Record<CategoryKey, string> = {
  scholarship: "SCHOLARSHIP",
  facility: "FACILITY",
  dorm: "DORMITORY",
  library: "LIBRARY",
  department: "DEPARTMENT",
};
const CATEGORY_ENUM_TO_KEY: Record<string, CategoryKey> = Object.fromEntries(
  Object.entries(CATEGORY_KEY_TO_ENUM).map(([k, v]) => [v, k as CategoryKey]),
) as Record<string, CategoryKey>;
const STATUS_ENUM_TO_KEY: Record<string, StatusKey> = { OPEN: "received", UNDER_REVIEW: "reviewing", ANSWERED: "answered", EXPIRED: "received" };

/* ───────────────── fetch 기반 ───────────────── */

let accessToken: string | null = null; // 메모리에만 둔다(AsyncStorage 0건 — 보안 항목)
let refreshing: { version: number; request: Promise<void> } | null = null;
let sessionVersion = 0;

async function rawFetch(path: string, opts: { method?: string; body?: unknown; auth?: boolean } = {}) {
  const { method = "GET", body, auth = true } = opts;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return fetch(`${BASE_URL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}

async function refreshAccessToken() {
  const version = sessionVersion;
  if (!refreshing || refreshing.version !== version) {
    const request = rawFetch("/connect/auth/token/refresh", { method: "POST", auth: false })
      .then(async (res) => {
        if (!res.ok) throw new Error("세션이 만료되었습니다.");
        const data = await res.json();
        if (version === sessionVersion) accessToken = data.accessToken;
      })
      .finally(() => {
        if (refreshing?.request === request) refreshing = null;
      });
    refreshing = { version, request };
  }
  return refreshing.request;
}

export class ApiError extends Error {
  status: number;
  /** ProblemDetail 의 추가 속성(예: 429 의 retryAfterSeconds)을 호출부가 읽는다. */
  body: any;
  constructor(message: string, status: number, body?: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function parseError(res: Response) {
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* 본문 없음 */
  }
  return new ApiError(body?.title || `요청을 처리할 수 없습니다. (${res.status})`, res.status, body);
}

async function apiFetch<T = any>(path: string, opts: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const version = sessionVersion;
  let res = await rawFetch(path, opts);
  if (res.status === 401 && opts.auth !== false) {
    try {
      if (version !== sessionVersion) throw new Error("세션이 변경되었습니다.");
      await refreshAccessToken();
      if (version === sessionVersion) res = await rawFetch(path, opts);
    } catch {
      /* 재발급 실패 — 아래에서 원래 401 을 던진다 */
    }
  }
  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return null as T;
  const text = await res.text();
  return text ? JSON.parse(text) : (null as T);
}

// 서버가 타임존 없는 UTC LocalDateTime 을 내려준다 — 표기가 없을 때만 'Z' 를 붙여 UTC 로 명시한다.
function parseServerDate(iso: string): Date {
  return new Date(/[Zz]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
}

function formatRelative(iso: string): string {
  const min = Math.floor((Date.now() - parseServerDate(iso).getTime()) / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

/* ───────────────── voted/mine/bookmarked 파생 ─────────────────
   PetitionResponse 에는 mine/voted/bookmarked 가 없다. 로그인 시
   /users/me/{agreements,petitions,bookmarks} 로 내 공감·작성·북마크 청원 id 집합을 받아 캐시한다. */

let votedIds = new Set<number>();
let myPetitionIds = new Set<number>();
let bookmarkedIds = new Set<number>();
let flagsLoaded = false;

async function ensureFlags() {
  if (flagsLoaded || !accessToken) return;
  flagsLoaded = true;
  try {
    const [agreements, mine, bookmarks] = await Promise.all([
      apiFetch<any>("/connect/users/me/agreements?size=100"),
      apiFetch<any>("/connect/users/me/petitions?size=100"),
      apiFetch<any>("/connect/users/me/bookmarks?size=100"),
    ]);
    votedIds = new Set((agreements?.content ?? []).map((p: any) => p.id));
    myPetitionIds = new Set((mine?.content ?? []).map((p: any) => p.id));
    bookmarkedIds = new Set((bookmarks?.content ?? []).map((p: any) => p.id));
  } catch {
    flagsLoaded = false; // 다음 호출에서 재시도
  }
}

/** App.tsx 가 로컬 `votes` 오버레이(Record<id,boolean>)의 초기값을 채울 때 쓴다. */
export function getVotedIds(): Set<number> {
  return new Set(votedIds);
}

/* ───────────────── 카테고리별 목표 공감 수 ─────────────────
   thresholdFor(basisFor(key))(logic.ts)는 기준(basis) 단위 기본값일 뿐이고, 실제 관리자 설정값은
   카테고리 단위로 다르다(같은 "전체 학생" 기준이어도 장학·시설·도서관 목표가 서로 다를 수 있다).
   공개 GET /connect/threshold-settings 로 카테고리별 실제 값을 받아 앱 구동 시 1회 캐시한다. */
const DEFAULT_THRESHOLD: Record<CategoryKey, number> = Object.fromEntries(
  (Object.keys(CATEGORY_KEY_TO_ENUM) as CategoryKey[]).map((key) => [key, thresholdFor(basisFor(key))]),
) as Record<CategoryKey, number>;
let liveThreshold: Partial<Record<CategoryKey, number>> = {};
let thresholdsLoaded = false;

async function ensureCategoryThresholds() {
  if (thresholdsLoaded) return;
  thresholdsLoaded = true;
  try {
    const rows = await apiFetch<{ category: string; targetAgreementCount: number }[]>("/connect/threshold-settings", { auth: false });
    liveThreshold = Object.fromEntries(
      (rows ?? []).map((row) => [CATEGORY_ENUM_TO_KEY[row.category], row.targetAgreementCount]),
    );
  } catch {
    thresholdsLoaded = false; // 실패 시 다음 호출에서 재시도, 그때까진 기본값 유지
  }
}

/** 청원 등록 미리보기(Submit.tsx)가 쓰는 카테고리별 현재 목표 공감 수. */
export function currentThreshold(category: CategoryKey): number {
  return liveThreshold[category] ?? DEFAULT_THRESHOLD[category];
}

function resetSessionCaches() {
  flagsLoaded = false;
  votedIds = new Set();
  myPetitionIds = new Set();
  bookmarkedIds = new Set();
}

/* ───────────────── 세션 ───────────────── */

/** 알림 종류별 on/off. 키는 data.ts NOTIF_POINTS 의 key 와 같다. */
export type NotificationSettings = Record<NotificationSettingKey, boolean>;
export type Me = { loginId: string; email: string; departmentName: string; notificationSettings: NotificationSettings };
let cachedMe: Me | null = null;

export async function getMe(version = sessionVersion): Promise<Me | null> {
  if (!accessToken) return null;
  const me = await apiFetch<any>("/connect/users/me");
  if (version !== sessionVersion) return null;
  cachedMe = { loginId: me.loginId, email: me.email, departmentName: me.departmentName, notificationSettings: me.notificationSettings };
  return cachedMe;
}

/** 토글 하나만 보내고 서버가 돌려준 5개 전체로 덮는다. */
export async function updateNotificationSettings(patch: Partial<NotificationSettings>): Promise<NotificationSettings> {
  const settings = await apiFetch<NotificationSettings>("/connect/users/me/notification-settings", { method: "PATCH", body: patch });
  if (cachedMe) cachedMe = { ...cachedMe, notificationSettings: settings };
  return settings;
}

/** 콜드 스타트 부팅 시 호출한다: accessToken 은 메모리 전용이라 앱을 껐다 켜면 사라지지만
    refreshToken 쿠키(서버가 Set-Cookie 로 관리, iOS 네이티브 쿠키 저장소가 유지)가 살아있을
    수 있으므로 그걸로 세션을 복구해본다. 실패하면 null(비로그인 취급). */
export async function restoreSession(): Promise<Me | null> {
  try {
    await refreshAccessToken();
  } catch {
    return null;
  }
  resetSessionCaches();
  return getMe();
}

export async function login(loginId: string, password: string): Promise<Me | null> {
  const id = loginId.trim();
  const pw = password.trim();
  if (!id || !pw) throw new Error("아이디와 비밀번호를 입력해 주세요.");
  const { accessToken: token } = await apiFetch<{ accessToken: string }>("/connect/auth/login", { method: "POST", auth: false, body: { loginId: id, password: pw } });
  accessToken = token;
  sessionVersion += 1;
  cachedMe = null;
  resetSessionCaches();
  return getMe();
}

/** 이메일 인증 2단계 뒤 호출한다: sendSignupCode → confirmSignupCode(→verificationToken) → signup. */
export async function sendSignupCode(email: string): Promise<void> {
  await apiFetch("/connect/auth/email-verifications", { method: "POST", auth: false, body: { email, purpose: "SIGN_UP" } });
}

export async function confirmSignupCode(email: string, code: string): Promise<string> {
  const { verificationToken } = await apiFetch<{ verificationToken: string }>("/connect/auth/email-verifications/confirm", {
    method: "POST",
    auth: false,
    body: { email, code, purpose: "SIGN_UP" },
  });
  return verificationToken;
}

export async function signup(args: { loginId: string; password: string; departmentId: number; verificationToken: string; termsAgreed: true; termsVersion: "1.0" }): Promise<Me | null> {
  await apiFetch("/connect/auth/signup", { method: "POST", auth: false, body: args });
  return login(args.loginId, args.password);
}

export async function sendLoginIdFindCode(email: string): Promise<void> {
  await apiFetch("/connect/auth/email-verifications", { method: "POST", auth: false, body: { email, purpose: "LOGIN_ID_FIND" } });
}

export async function confirmLoginIdFindCode(email: string, code: string): Promise<string> {
  const { verificationToken } = await apiFetch<{ verificationToken: string }>("/connect/auth/email-verifications/confirm", {
    method: "POST",
    auth: false,
    body: { email, code, purpose: "LOGIN_ID_FIND" },
  });
  return verificationToken;
}

export async function findLoginIdByEmail(verificationToken: string): Promise<string> {
  const { loginId } = await apiFetch<{ loginId: string }>("/connect/auth/login-id/find/email", { method: "POST", auth: false, body: { verificationToken } });
  return loginId;
}

export async function findLoginIdByPassword(email: string, password: string): Promise<string> {
  const { loginId } = await apiFetch<{ loginId: string }>("/connect/auth/login-id/find/password", { method: "POST", auth: false, body: { email, password } });
  return loginId;
}

/** 비밀번호 찾기 3단계 뒤 호출한다: sendPasswordResetCode → confirmPasswordResetCode(→verificationToken) → resetPassword.
    가입 이메일 인증(sendSignupCode/confirmSignupCode)과 같은 엔드포인트를 purpose 만 바꿔 쓴다. */
export async function sendPasswordResetCode(email: string): Promise<void> {
  await apiFetch("/connect/auth/email-verifications", { method: "POST", auth: false, body: { email, purpose: "PASSWORD_RESET" } });
}

export async function confirmPasswordResetCode(email: string, code: string): Promise<string> {
  const { verificationToken } = await apiFetch<{ verificationToken: string }>("/connect/auth/email-verifications/confirm", {
    method: "POST",
    auth: false,
    body: { email, code, purpose: "PASSWORD_RESET" },
  });
  return verificationToken;
}

export async function resetPassword(verificationToken: string, newPassword: string): Promise<void> {
  const pw = newPassword.trim();
  if (!pw) throw new Error("새 비밀번호를 입력해 주세요.");
  await apiFetch("/connect/auth/password/reset", { method: "POST", auth: false, body: { verificationToken, newPassword: pw } });
}

export async function logout(): Promise<void> {
  sessionVersion += 1;
  accessToken = null;
  cachedMe = null;
  try {
    await apiFetch("/connect/auth/logout", { method: "POST", auth: false });
  } catch {
    /* 이미 만료됐어도 로컬 상태는 정리한다 */
  }
  resetSessionCaches();
}

export async function deleteAccount(password: string): Promise<void> {
  const pw = password.trim();
  if (!pw) throw new Error("비밀번호를 입력해 주세요.");
  await apiFetch("/connect/users/me", { method: "DELETE", body: { password: pw } });
  accessToken = null;
  cachedMe = null;
  resetSessionCaches();
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const current = currentPassword;
  const next = newPassword;
  if (!current || !next) throw new Error("현재 비밀번호와 새 비밀번호를 입력해 주세요.");
  await apiFetch("/connect/users/me/password", { method: "PATCH", body: { currentPassword: current, newPassword: next } });
}

export async function updateDepartment(departmentId: number, departmentName: string): Promise<Me> {
  if (!Number.isSafeInteger(departmentId) || departmentId < 1) throw new Error("학부를 선택해 주세요.");
  const version = sessionVersion;
  await apiFetch("/connect/users/me/department", { method: "PATCH", body: { departmentId } });
  if (version !== sessionVersion) throw new Error("세션이 변경되었습니다.");
  try {
    const me = await getMe(version);
    if (me) return me;
  } catch {
    /* 204는 이미 확정됐으므로, 프로필 재조회 실패 시 선택한 학부명으로 화면을 맞춘다. */
  }
  if (version !== sessionVersion) throw new Error("세션이 변경되었습니다.");
  if (!cachedMe) throw new Error("학부 정보를 불러오지 못했습니다.");
  cachedMe = { ...cachedMe, departmentName };
  return cachedMe;
}

export async function listDepartments(): Promise<{ id: number; name: string }[]> {
  const list = await apiFetch<{ id: number; code: string; name: string }[]>("/connect/departments", { auth: false });
  return (list ?? []).map((d) => ({ id: d.id, name: d.name }));
}

/* ───────────────── 청원 ─────────────────
   current 는 서버 agreementCount 에서 "내 공감" 을 뺀 값으로 저장한다 — App.tsx 의 votes
   오버레이(logic.ts 의 count())가 voted 일 때 +1 해 원래 총합을 복원하는 기존 구조를
   그대로 쓰기 위해서다(mock 시절 SEED.current 가 "나를 제외한 공감 수" 였던 것과 같은 자리). */

// AnswerModal.jsx(웹)의 ANSWER_SOURCES 라벨과 동일하다 — 실 답변에는 담당자 이름이 없다(답변 주체만).
const ANSWER_SOURCE_LABEL: Record<string, string> = { OPERATION_TEAM: "운영팀 답변", SCHOOL_OFFICIAL: "학교 공식 답변" };

function adaptOfficialAnswer(raw: any): AdminAnswer | null {
  if (!raw) return null;
  return { body: raw.content, dept: ANSWER_SOURCE_LABEL[raw.answerSource] ?? "공식 답변", date: formatRelative(raw.createdAt) };
}

function adaptPetition(raw: any): Petition {
  const key = CATEGORY_ENUM_TO_KEY[raw.category] ?? "department";
  const iVoted = votedIds.has(raw.id);
  return {
    id: raw.id,
    title: raw.title,
    excerpt: (raw.content ?? "").slice(0, 120),
    body: raw.content,
    category: key,
    status: STATUS_ENUM_TO_KEY[raw.status] ?? "received",
    current: (raw.agreementCount ?? 0) - (iVoted ? 1 : 0),
    threshold: raw.targetAgreementCount ?? currentThreshold(key),
    basis: BASIS_LABEL[key],
    author: "익명",
    createdAt: raw.createdAt,
    // 댓글 수는 목록 응답에 없다 — listPetitions 가 청원별로 따로 세어 채운다.
    comments: 0,
    views: "0", // 조회수는 백엔드가 아예 집계하지 않는다(웹과 동일한 한계).
    mine: myPetitionIds.has(raw.id),
    bookmarked: bookmarkedIds.has(raw.id),
    answer: adaptOfficialAnswer(raw.officialAnswer),
  };
}

const BASIS_LABEL: Record<CategoryKey, Petition["basis"]> = {
  department: "학과 정원",
  dorm: "기숙사 정원",
  scholarship: "전체 학생",
  facility: "전체 학생",
  library: "전체 학생",
};

/* 청원 목록 응답에 댓글 수 필드가 없다 — 댓글 목록을 직접 세서 채운다. 실패해도 피드
   전체를 막지 않도록 0 으로 눙친다. */
async function countComments(petitionId: number): Promise<number> {
  try {
    const data = await apiFetch<any>(`/connect/petitions/${petitionId}/comments?size=100`);
    return (data?.content ?? []).length;
  } catch {
    return 0;
  }
}

/* listPetitions/getPetition 은 로그인 중이면 토큰을 보낸다(auth 기본값 true) — 서버가
   "로그인한 사용자는 영구 차단한 작성자의 청원을 볼 수 없습니다" 를 이 토큰으로 판단한다
   (Skhu-Connect-BE User Block, 2026-08-18 확인). 비로그인일 땐 accessToken 이 없어 헤더 자체가
   안 붙으므로 기존 동작과 같다. */
export async function listPetitions(): Promise<Petition[]> {
  await Promise.all([ensureFlags(), ensureCategoryThresholds()]);
  const data = await apiFetch<any>("/connect/petitions?size=100&sort=createdAt,desc");
  const petitions = (data?.content ?? []).map(adaptPetition);
  await Promise.all(petitions.map(async (p: Petition) => { p.comments = await countComments(p.id); }));
  return petitions;
}

/** 상세 진입 시 부른다 — 답변 본문(officialAnswer)은 이 응답에만 온다(목록 응답에는 없다).
    차단한 작성자의 청원은 404 — App.tsx 가 이미 "청원을 찾을 수 없음" 으로 피드로 돌려보낸다. */
export async function getPetition(petitionId: number): Promise<Petition> {
  await Promise.all([ensureFlags(), ensureCategoryThresholds()]);
  const raw = await apiFetch<any>(`/connect/petitions/${petitionId}`);
  return adaptPetition(raw);
}

/** 서버가 429 와 함께 주는 남은 초를 "3분 42초" 로 읽는다. 값이 없으면(구버전 서버) 시간 없이 안내만 한다.
    웹 src/api/index.js 의 cooldownMessage 와 같은 문구다. */
function cooldownMessage(retryAfterSeconds: unknown): string {
  const total = Number(retryAfterSeconds);
  const suffix = "마지막 등록 후 10분이 지나야 하며, 삭제한 건의도 이 시간에 포함됩니다.";
  if (!Number.isFinite(total) || total <= 0) return `새 건의는 아직 올릴 수 없습니다. ${suffix}`;
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min ? `${min}분 ${sec}초` : `${sec}초`} 후에 새 건의를 올릴 수 있습니다. ${suffix}`;
}

export async function createPetition(args: { category: CategoryKey; title: string; body: string }): Promise<Petition> {
  const title = args.title.trim();
  const body = args.body.trim();
  if (!title) throw new Error("제목을 입력해 주세요.");
  if (!body) throw new Error("건의 내용을 입력해 주세요.");
  let raw: any;
  try {
    raw = await apiFetch<any>("/connect/petitions", { method: "POST", body: { category: CATEGORY_KEY_TO_ENUM[args.category], title, content: body } });
  } catch (e) {
    // 429 는 서버가 영문 title 로 준다 - 그대로 토스트에 뜨면 안 된다.
    if (e instanceof ApiError && e.status === 429) throw new Error(cooldownMessage(e.body?.retryAfterSeconds));
    throw e;
  }
  myPetitionIds.add(raw.id);
  const p = adaptPetition(raw);
  p.comments = 0;
  return p;
}

export type ReportReasonType = "SPAM" | "ABUSE" | "INAPPROPRIATE" | "FALSE_INFORMATION" | "OTHER";
const REPORT_REASON_TYPES = new Set<ReportReasonType>(["SPAM", "ABUSE", "INAPPROPRIATE", "FALSE_INFORMATION", "OTHER"]);

function reportReason(reasonType: ReportReasonType, reasonDetail: string) {
  const detail = reasonDetail.trim();
  if (!REPORT_REASON_TYPES.has(reasonType)) throw new Error("신고 종류를 선택해 주세요.");
  if (detail.length < 10 || detail.length > 500) throw new Error("신고 이유는 10자 이상 500자 이하로 입력해 주세요.");
  return { reasonType, reasonDetail: detail };
}

export async function reportPetition(petitionId: number, reasonType: ReportReasonType, reasonDetail: string): Promise<void> {
  // 신고 API는 토큰이 없을 때 401 대신 400을 준다. 앱 재개 뒤에도 쿠키 세션을 먼저 복구한다.
  if (!accessToken) await refreshAccessToken();
  await apiFetch("/connect/reports", {
    method: "POST",
    body: { petitionId, commentId: null, ...reportReason(reasonType, reasonDetail) },
  });
}

export async function reportComment(commentId: number, reasonType: ReportReasonType, reasonDetail: string): Promise<void> {
  if (!accessToken) await refreshAccessToken();
  await apiFetch("/connect/reports", {
    method: "POST",
    body: { petitionId: null, commentId, ...reportReason(reasonType, reasonDetail) },
  });
}

/** 콘텐츠 작성자를 영구 차단한다(POST /connect/users/me/blocks). 단방향·해제 불가 — 서버가 그 뒤
    청원 목록/상세와 댓글 목록 양쪽에서 이 작성자를 전부 걸러준다(PetitionRepository·CommentRepository
    의 block 필터, 둘 다 writer.id 로만 비교한다). 청원이든 댓글이든 targetType 만 다르고 나머지는
    같아서 한 함수로 둔다. 409(이미 차단)는 성공 취급한다 — toggleEmpathy 와 같은 이유. */
async function blockAuthor(targetType: "PETITION" | "COMMENT", contentId: number): Promise<void> {
  try {
    await apiFetch("/connect/users/me/blocks", { method: "POST", body: { targetType, contentId } });
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) return;
    /* 404 의 서버 title 은 "Content writer not found"/"Content not found" 영어 원문이라 그대로 못 쓴다.
       탈퇴한 작성자 차단은 백엔드가 열어줄 예정이라(2026-08-18 협의), 그 전후 모두 맞는 문구로 둔다. */
    if (e instanceof ApiError && e.status === 404) throw new Error("이미 삭제되었거나 탈퇴한 사용자예요. 차단할 수 없습니다.");
    throw e;
  }
}

export function blockPetitionAuthor(petitionId: number): Promise<void> {
  return blockAuthor("PETITION", petitionId);
}

export function blockCommentAuthor(commentId: number): Promise<void> {
  return blockAuthor("COMMENT", commentId);
}

/** 409/404 는 "서버가 이미 의도한 상태" 로 간주하고 로컬 집합을 그 상태로 맞춘다.
    성공/무시 성공 시 true, 그 외 에러는 던진다 — App.tsx 가 실패 시 낙관적 UI 를 되돌린다. */
export async function toggleEmpathy(petitionId: number, wasVoted: boolean): Promise<void> {
  try {
    await apiFetch(`/connect/petitions/${petitionId}/agreements`, { method: wasVoted ? "DELETE" : "POST" });
  } catch (e) {
    // 본인 청원 공감 거부는 "서버가 이미 의도한 상태"가 아니라 진짜 실패다 — 삼키면 votedIds 에
    // 좋아요를 기록해 실제로는 공감 안 된 글을 공감한 것처럼 보이게 된다. 화면 쪽 사전 차단
    // (App.tsx 의 vote())을 우회한 stale 상태에 대비한 마지막 방어선이다.
    if (e instanceof ApiError && e.status === 409 && e.body?.title === "Cannot agree to own petition") {
      throw new Error("본인 청원에는 요청할 수 없습니다");
    }
    if (e instanceof ApiError && (e.status === 409 || e.status === 404)) {
      // 서버 상태가 이미 원하는 쪽이다 — 로컬 캐시만 맞추고 성공 취급.
    } else {
      throw e;
    }
  }
  if (wasVoted) votedIds.delete(petitionId);
  else votedIds.add(petitionId);
}

/** 공감과 같은 낙관적 패턴 — 성공/무시 성공 시 캐시만 맞춘다. 실패는 던져서 App.tsx 가 되돌린다. */
export async function toggleBookmark(petitionId: number, wasBookmarked: boolean): Promise<void> {
  try {
    await apiFetch(`/connect/petitions/${petitionId}/bookmarks`, { method: wasBookmarked ? "DELETE" : "POST" });
  } catch (e) {
    if (e instanceof ApiError && (e.status === 409 || e.status === 404)) {
      // 서버 상태가 이미 원하는 쪽이다.
    } else {
      throw e;
    }
  }
  if (wasBookmarked) bookmarkedIds.delete(petitionId);
  else bookmarkedIds.add(petitionId);
}

/* ───────────────── 댓글 ─────────────────
   replies 는 root 댓글에만 온다(1단계 대댓글 — 서버가 대댓글의 대댓글을 지원하지 않는다).
   웹 src/api/index.js adaptComment 와 같은 짝이다. */

/* liked/myComment 는 서버가 로그인한 나를 기준으로 채워 준다 — auth 를 끄면 안 된다(웹과 같다). */
function adaptComment(c: any): Comment {
  return {
    id: c.id,
    author: `익명 ${c.anonymousNumber}`,
    body: c.content,
    date: formatRelative(c.createdAt),
    mine: !!c.myComment,
    votes: c.likeCount ?? 0,
    liked: !!c.liked,
    replies: (c.replies ?? []).map(adaptComment),
  };
}

/** 웹 src/api/index.js toggleCommentLike 과 같은 계약 — 켜져 있으면 DELETE, 아니면 POST. */
export async function toggleCommentLike(petitionId: number, commentId: number, liked: boolean): Promise<{ votes: number; liked: boolean }> {
  const res = await apiFetch<any>(`/connect/petitions/${petitionId}/comments/${commentId}/likes`, { method: liked ? "DELETE" : "POST" });
  return { votes: res.likeCount, liked: res.liked };
}

export async function listComments(petitionId: number): Promise<Comment[]> {
  const data = await apiFetch<any>(`/connect/petitions/${petitionId}/comments?size=100`);
  return (data?.content ?? []).map(adaptComment);
}

/** parentCommentId 를 주면 그 root 댓글의 대댓글로 등록한다(웹과 같은 계약). */
export async function addComment(petitionId: number, body: string, parentCommentId: number | null = null): Promise<Comment> {
  const content = body.trim();
  if (!content) throw new Error("댓글 내용을 입력해 주세요.");
  const raw = await apiFetch<any>(`/connect/petitions/${petitionId}/comments`, { method: "POST", body: { content, parentCommentId } });
  return adaptComment(raw);
}

/** 웹 src/api/index.js updateComment 과 같은 계약 — 서버가 작성자 본인인지 검사한다. */
export async function updateComment(petitionId: number, commentId: number, body: string): Promise<Comment> {
  const content = body.trim();
  if (!content) throw new Error("댓글 내용을 입력해 주세요.");
  const raw = await apiFetch<any>(`/connect/petitions/${petitionId}/comments/${commentId}`, { method: "PUT", body: { content } });
  return adaptComment(raw);
}

/** 작성자 본인의 청원 삭제(논리 삭제). 서버는 공감 0건인 OPEN 청원만 허용한다(아니면 409).
    두 번 눌러 404 가 와도 "이미 지워진 것"이므로 성공으로 본다. 웹 deletePetition 과 같은 계약이다. */
export async function deletePetition(petitionId: number): Promise<void> {
  try {
    await apiFetch(`/connect/petitions/${petitionId}`, { method: "DELETE" });
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) throw new Error("요청이 달렸거나 검토가 시작된 건의는 삭제할 수 없습니다.");
    if (!(e instanceof ApiError) || e.status !== 404) throw e;
  }
  myPetitionIds.delete(petitionId);
  bookmarkedIds.delete(petitionId);
}

export async function deleteComment(petitionId: number, commentId: number): Promise<void> {
  await apiFetch(`/connect/petitions/${petitionId}/comments/${commentId}`, { method: "DELETE" });
}

function adaptMyComment(uc: any): MyComment {
  return { id: uc.comment.id, petitionId: uc.petitionId, body: uc.comment.content, date: formatRelative(uc.comment.createdAt) };
}

export async function listMyComments(): Promise<MyComment[]> {
  const data = await apiFetch<any>("/connect/users/me/comments?size=100");
  return (data?.content ?? []).map(adaptMyComment);
}

/* ───────────────── 공지 ───────────────── */

/** publishedAt 이 없으면 createdAt 을 게시 시각으로 본다(웹 adaptNotice 와 동일). */
function adaptNotice(raw: any): Notice {
  const at: string = raw.publishedAt ?? raw.createdAt;
  return { id: raw.id, title: raw.title, content: raw.content, publishedAt: at, date: formatRelative(at) };
}

/** 인증 없이 열린다 — 로그인 전에도 홈이 그려진다. 서버는 PUBLISHED 만 내려준다. */
export async function listNotices(): Promise<Notice[]> {
  // sort 를 서버에 넘겨야 100건을 넘겼을 때도 첫 페이지에 최신 공지가 온다(청원 목록과 같은 방식).
  const data = await apiFetch<any>("/connect/notices?size=100&sort=publishedAt,desc", { auth: false });
  return (data?.content ?? [])
    .map(adaptNotice)
    .sort((a: Notice, b: Notice) => parseServerDate(b.publishedAt).getTime() - parseServerDate(a.publishedAt).getTime());
}

/* ───────────────── 알림 ───────────────── */

/* 아이콘·색은 알림 포인트(data.ts NOTIF_POINTS)에서 가져온다 — 같은 포인트의 알림은 같은 모양이다. */
function adaptNotification(n: any): Notification {
  const point = pointOf(n.type);
  return {
    id: n.id,
    type: n.type,
    petitionId: n.petitionId,
    title: NOTIF_TYPE_TITLE[n.type] ?? "알림",
    body: n.message,
    date: formatRelative(n.createdAt),
    read: n.read,
    icon: point.icon,
    iconBg: point.iconBg,
    iconFg: point.iconFg,
  };
}

export async function listNotifications(): Promise<Notification[]> {
  const data = await apiFetch<any>("/connect/notifications?size=50");
  return (data?.content ?? []).map(adaptNotification);
}

export async function markNotifRead(id: number): Promise<void> {
  await apiFetch(`/connect/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotifRead(): Promise<void> {
  await apiFetch("/connect/notifications/read-all", { method: "PATCH" });
}

/* ───────────────── 푸시(FCM) 토큰 ───────────────── */

export async function registerFcmToken(token: string): Promise<void> {
  await apiFetch("/connect/notifications/fcm-tokens", { method: "POST", body: { token } });
}

export async function deleteFcmToken(token: string): Promise<void> {
  await apiFetch("/connect/notifications/fcm-tokens", { method: "DELETE", body: { token } });
}
