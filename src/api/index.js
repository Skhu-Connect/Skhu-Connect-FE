/* 데이터 접근 계약. 화면·스토어는 **이 파일의 async 함수만** 호출한다.
   백엔드가 준비되면 이 파일 내부를 fetch 로 바꾸고 mockDb.js 를 지운다 — 그게 전부다.

   모든 함수는 async 이고 목 지연 150ms 를 갖는다(로딩 경로가 실제로 존재하게).
   반환값은 db 와 분리된 복사본이다 — 호출자가 상태를 직접 변형할 수 없다. */

import { db } from "./mockDb.js";

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));
const copy = (v) => structuredClone(v);

const category = (key) => db.categories.find((c) => c.key === key);
const record = (id) => db.petitions.find((p) => p.id === Number(id));

/** 청원 레코드 + 카테고리에서 파생한 임계치·기준·담당자 + 내 공감/북마크 여부.
    화면은 p.current 를 그대로 렌더한다 — 내 공감은 이미 반영돼 있다. */
function view(p) {
  const c = category(p.category);
  return copy({
    ...p,
    threshold: c.threshold,
    basis: c.basis,
    owner: c.owner,
    voted: db.voted.has(p.id),
    bookmarked: db.bookmarked.has(p.id),
    answered: !!db.answers[p.id],
    answer: db.answers[p.id] ?? null,
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

export async function logout() {
  await delay(0);
  db.session = null;
}

export async function getMe() {
  await delay();
  return db.session ? copy(db.session) : null;
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

/* ───────────────── 청원 ───────────────── */

export async function listPetitions() {
  await delay();
  return db.petitions.map(view);
}

export async function getPetition(id) {
  await delay();
  const p = record(id);
  return p ? view(p) : null;
}

export async function createPetition({ category: categoryKey, title, body }) {
  const t = String(title ?? "").trim();
  if (!category(categoryKey)) throw new Error("카테고리를 선택해 주세요.");
  if (!t) throw new Error("제목을 입력해 주세요.");
  await delay();
  const p = {
    id: Math.max(...db.petitions.map((x) => x.id)) + 1,
    title: t,
    excerpt: String(body ?? "").trim().slice(0, 120),
    body: String(body ?? "").trim(),
    category: categoryKey,
    status: "received",
    current: 0,
    author: "익명",
    date: "방금 전",
    comments: 0,
    views: 0,
    mine: true,
  };
  db.petitions.unshift(p);
  return view(p);
}

export async function toggleEmpathy(id) {
  await delay();
  const p = record(id);
  if (!p) throw new Error(`청원 ${id} 을(를) 찾을 수 없습니다.`);
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
  if (!p) throw new Error(`청원 ${id} 을(를) 찾을 수 없습니다.`);
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
  const p = record(key);
  if (p) p.comments += 1;
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
  const { owner } = category(p.category);
  db.answers[p.id] = {
    petitionId: p.id,
    dept: owner.team,
    manager: owner.name,
    date: new Date().toISOString().slice(0, 10).replaceAll("-", "."),
    body: text,
  };
  p.status = "answered";
  return { petition: view(p), answer: copy(db.answers[p.id]) };
}
