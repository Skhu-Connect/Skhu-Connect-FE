/* 데이터 접근 계약. 화면·스토어는 **이 파일의 async 함수만** 호출한다.
   백엔드가 준비되면 이 파일 내부를 fetch 로 바꾸고 mockDb.js 를 지운다 — 그게 전부다.

   모든 함수는 async 이고 목 지연 150ms 를 갖는다(로딩 경로가 실제로 존재하게).
   반환값은 db 와 분리된 복사본이다 — 호출자가 상태를 직접 변형할 수 없다. */

import { db, DEPARTMENTS } from "./mockDb.js";

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));
const copy = (v) => structuredClone(v);

const EXPIRY_DAYS = 30;
const isExpired = (p) => Date.now() - new Date(p.createdAt).getTime() > EXPIRY_DAYS * 86400000;
// "2주 전" 같은 상대 시간 대신, 30일 만료까지 남은 기간을 D-day 로 보여준다.
const ddayLabel = (p) => {
  const daysLeft = EXPIRY_DAYS - Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 86400000);
  return daysLeft > 0 ? `D-${daysLeft}` : "만료";
};

const category = (key) => db.categories.find((c) => c.key === key);
const record = (id) => db.petitions.find((p) => p.id === Number(id));

/** 청원 레코드 + 카테고리에서 파생한 임계치·기준·담당자 + 내 공감/북마크 여부.
    화면은 p.current 를 그대로 렌더한다 — 내 공감은 이미 반영돼 있다.

    admin=false(학생)면 담당자는 **부서명까지만** 내린다. 담당자 실명·이메일·직통번호는
    학생 화면이 쓰지 않는데도 응답에 실리면, 학번 하나로 로그인한 학생이 DevTools 로
    5개 부서 담당자 연락처를 전부 긁을 수 있다 — 스코프는 라우트가 아니라 응답 필드다. */
function view(p, { admin = false } = {}) {
  const c = category(p.category);
  return copy({
    ...p,
    threshold: c.threshold,
    basis: c.basis,
    date: ddayLabel(p),
    // 댓글 수는 목록에서 파생한다 — 별도 카운트 필드를 두면 카드(47)와 상세(0)가 어긋난다.
    comments: (db.comments[p.id] ?? []).length,
    owner: admin ? c.owner : { team: c.owner.team },
    voted: db.voted.has(p.id),
    bookmarked: db.bookmarked.has(p.id),
    answered: !!db.answers[p.id],
    answer: db.answers[p.id] ?? null,
    expired: isExpired(p),
  });
}

/** 임계치 전이: 접수 → 검토중. 공감이 임계치에 닿으면 담당자 검토 요청이 나간 것으로 본다.
    ponytail: 승격만 한다. 공감 취소로 임계치 아래로 내려가도 되돌리지 않는다 —
    이미 발송된 검토 요청을 취소할 방법이 없기 때문. 되돌림이 필요해지면 여기 한 곳만 고친다. */
function applyThreshold(p) {
  if (p.status === "received" && p.current >= category(p.category).threshold) {
    p.status = "reviewing";
  }
  return p;
}

/* ───────────────── 세션 ───────────────── */

export async function login(sid, password) {
  if (!String(sid ?? "").trim() || !String(password ?? "").trim()) {
    throw new Error("학번과 비밀번호를 입력해 주세요.");
  }
  await delay();
  db.session = db.user; // 목: 자격 증명은 검증하지 않는다. 실제 인증은 백엔드가 한다.
  return { user: copy(db.session), prefs: copy(db.prefs) };
}

export async function signup({ sid, password, name, dept }) {
  const s = String(sid ?? "").trim();
  const pw = String(password ?? "").trim();
  const n = String(name ?? "").trim();
  if (!s || !pw) throw new Error("학번과 비밀번호를 입력해 주세요.");
  if (!n) throw new Error("이름을 입력해 주세요.");
  if (!DEPARTMENTS.includes(dept)) throw new Error("소속 학부를 선택해 주세요.");
  await delay();
  // ponytail: 목 단계라 자격 증명·중복 학번을 검증하지 않는다(login 과 동일한 한계). 학년은
  // sid 로 산출할 방법이 없어 1로 둔다 — 실제 계산은 백엔드 연동 시 여기만 고치면 된다.
  db.user = { name: n, dept, year: 1, sid: s };
  db.session = db.user;
  return { user: copy(db.session), prefs: copy(db.prefs) };
}

export async function logout() {
  await delay(0);
  db.session = null;
}

export async function getMe() {
  await delay();
  return db.session ? copy(db.session) : null;
}

export async function updateProfile(patch) {
  await delay();
  db.user = { ...db.user, ...patch };
  if (db.session) db.session = db.user;
  return copy(db.user);
}

export async function getPrefs() {
  await delay();
  return copy(db.prefs);
}

export async function savePrefs(patch) {
  await delay();
  db.prefs = { ...db.prefs, ...patch };
  return copy(db.prefs);
}

/** 소속 학부 11개. 회원가입·마이페이지가 같은 출처를 읽는다. */
export async function listDepartments() {
  await delay();
  return copy(DEPARTMENTS);
}

/* ───────────────── 청원 ───────────────── */

/** 학생용 목록 — 담당자는 부서명까지만. */
export async function listPetitions() {
  await delay();
  return db.petitions.map((p) => view(p));
}

/** 관리자용 목록 — 담당자 실명·이메일·직통번호 포함. 백엔드는 이 엔드포인트에 관리자 스코프를 건다. */
export async function listAdminPetitions() {
  await delay();
  return db.petitions.map((p) => view(p, { admin: true }));
}

export async function getPetition(id) {
  await delay();
  const p = record(id);
  return p ? view(p) : null;
}

export async function createPetition({ category: categoryKey, title, body }) {
  const t = String(title ?? "").trim();
  const b = String(body ?? "").trim();
  if (!category(categoryKey)) throw new Error("카테고리를 선택해 주세요.");
  if (!t) throw new Error("제목을 입력해 주세요.");
  if (!b) throw new Error("건의 내용을 입력해 주세요.");
  await delay();
  const p = {
    id: Math.max(...db.petitions.map((x) => x.id)) + 1,
    title: t,
    excerpt: b.slice(0, 120),
    body: b,
    category: categoryKey,
    status: "received",
    current: 0,
    author: "익명",
    createdAt: new Date().toISOString(),
    views: 0,
    mine: true,
  };
  db.petitions.unshift(p);
  return view(p);
}

export async function toggleEmpathy(id) {
  await delay();
  const p = record(id);
  if (!p) throw new Error(`건의 ${id} 을(를) 찾을 수 없습니다.`);
  if (db.voted.has(p.id)) {
    db.voted.delete(p.id);
    p.current -= 1;
  } else {
    db.voted.add(p.id);
    p.current += 1;
    applyThreshold(p);
  }
  return view(p);
}

export async function toggleBookmark(id) {
  await delay();
  const p = record(id);
  if (!p) throw new Error(`건의 ${id} 을(를) 찾을 수 없습니다.`);
  if (db.bookmarked.has(p.id)) db.bookmarked.delete(p.id);
  else db.bookmarked.add(p.id);
  return view(p);
}

/* ───────────────── 댓글 ───────────────── */

export async function listComments(petitionId) {
  await delay();
  return copy(db.comments[Number(petitionId)] ?? []);
}

export async function addComment(petitionId, body) {
  const text = String(body ?? "").trim();
  if (!text) throw new Error("댓글 내용을 입력해 주세요.");
  await delay();
  const key = Number(petitionId);
  const list = (db.comments[key] ??= []);
  const c = { id: (list.at(-1)?.id ?? 0) + 1, author: `익명 ${list.length + 1}`, body: text, date: "방금 전", votes: 0 };
  list.push(c);
  return copy(c);
}

/* ───────────────── 카테고리 · 담당자 ───────────────── */

/** 5개 실제 카테고리. 필터의 「전체」 칩은 화면이 앞에 붙인다 — 도메인이 아니라 UI 다. */
export async function listCategories() {
  await delay();
  return copy(db.categories);
}

export async function listOwners() {
  await delay();
  return copy(db.categories.map((c) => ({ key: c.key, label: c.label, ...c.owner })));
}

/* ───────────────── 알림 ───────────────── */

export async function listNotifications() {
  await delay();
  return copy(db.notifications);
}

export async function markAllNotifRead() {
  await delay();
  db.notifications.forEach((n) => (n.read = true));
  return copy(db.notifications);
}

export async function listNotifLogs() {
  await delay();
  return copy(db.notifLogs);
}

/* ───────────────── 관리자 답변 (의존 B 의 쓰기 쪽) ───────────────── */

/** 답변 레코드를 청원별로 만들고 상태를 답변 완료로 바꾼다.
    프로토타입처럼 본문을 버리면 학생 웹 상세가 어느 청원에서나 같은 답변을 보여준다. */
export async function answerPetition(id, body) {
  const text = String(body ?? "").trim();
  if (!text) throw new Error("답변 본문을 입력해 주세요.");
  await delay();
  const p = record(id);
  if (!p) throw new Error(`청원 ${id} 을(를) 찾을 수 없습니다.`);
  const { owner, threshold } = category(p.category);
  // 임계치를 넘어야 담당 부서가 답한다 — 제품의 핵심 규칙이므로 UI 게이팅이 아니라 여기서 막는다.
  // 백엔드는 이 계약을 그대로 구현한다.
  if (p.current < threshold) throw new Error("임계치에 도달하지 않은 청원입니다.");
  if (db.answers[p.id]) throw new Error("이미 답변이 등록된 청원입니다.");
  db.answers[p.id] = {
    petitionId: p.id,
    dept: owner.team,
    manager: owner.name,
    date: new Date().toISOString().slice(0, 10).replaceAll("-", "."),
    body: text,
  };
  p.status = "answered";
  return { petition: view(p, { admin: true }), answer: copy(db.answers[p.id]) };
}
