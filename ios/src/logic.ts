/* 순수 로직 — 임계치·필터·정렬. RN 을 import 하지 않으므로 `node src/selfcheck.ts` 로 바로 돌린다. */
import type { BasisLabel, CategoryKey, Petition, StatusKey } from "./data";

export type Votes = Record<number, boolean>;
export type Tab = "home" | "answered" | "mine" | "my";
export type Sort = "hot" | "new";

/** 내가 누른 공감 1건을 더한 표시용 공감 수. */
export function count(p: Petition, votes: Votes): number {
  return p.current + (votes[p.id] ? 1 : 0);
}

export type Filter = {
  tab: Tab;
  category: CategoryKey | "all";
  query: string;
  sort: Sort;
};

export function visibleList(petitions: Petition[], f: Filter, votes: Votes): Petition[] {
  let list = petitions.slice();
  if (f.tab === "mine") list = list.filter((p) => p.mine);
  // 답변 완료 탭은 웹 /answered 와 같은 조건이다 — 공식 답변이 등록된 건의만.
  if (f.tab === "answered") list = list.filter((p) => p.status === "answered");
  if (f.category !== "all") list = list.filter((p) => p.category === f.category);

  const q = f.query.trim();
  if (q) list = list.filter((p) => (p.title + p.excerpt).includes(q));

  list.sort((a, b) => (f.sort === "hot" ? count(b, votes) - count(a, votes) : b.id - a.id));

  return list;
}

/* 건의는 등록 30일 뒤 만료된다 — 웹 `src/api/index.js` 와 같은 규칙이다.
   목록·상세는 "2일 전" 같은 상대 시간 대신 만료까지 남은 기간을 보여준다. */
export const EXPIRY_DAYS = 30;
const DAY_MS = 86400000;

/** 만료까지 남은 일수. 0 이하면 만료. */
export function daysLeft(p: Petition, now = Date.now()): number {
  return EXPIRY_DAYS - Math.floor((now - new Date(p.createdAt).getTime()) / DAY_MS);
}

/** 게시 시각 자리에 들어가는 문구. */
export function ddayLabel(p: Petition, now = Date.now()): string {
  const left = daysLeft(p, now);
  return left > 0 ? `D-${left}` : "만료";
}

/** 등록 날짜(상세 "접수" 단계). 2026.05.22 꼴. */
export function ymd(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

/** 카테고리마다 임계치 산정 기준이 다르다. */
export function basisFor(category: CategoryKey): BasisLabel {
  if (category === "department") return "학과 정원";
  if (category === "dorm") return "기숙사 정원";
  return "전체 학생";
}

export function thresholdFor(basis: BasisLabel): number {
  if (basis === "학과 정원") return 180;
  if (basis === "기숙사 정원") return 240;
  return 480;
}

/** 접수 → 검토중 → 답변 완료. 임계치를 넘는 순간 검토중으로 넘어간다. */
export function statusOf(p: Petition, votes: Votes): StatusKey {
  if (p.status === "answered") return "answered";
  return count(p, votes) >= p.threshold ? "reviewing" : "received";
}
