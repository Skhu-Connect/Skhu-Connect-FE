/* 임계치·필터·정렬 self-check. 실행: node src/selfcheck.ts */
import assert from "node:assert/strict";
import { SEED } from "./data.ts";
import { basisFor, count, ddayLabel, isSoon, remain, statusOf, thresholdFor, visibleList, ymd } from "./logic.ts";

const none = {};
const byId = (id: number) => SEED.find((p) => p.id === id)!;

/* 공감을 누르면 표시 수가 1 늘고 남은 인원이 1 준다. */
const p3 = byId(3); // 88 / 180
assert.equal(count(p3, none), 88);
assert.equal(remain(p3, none), 92);
assert.equal(count(p3, { 3: true }), 89);
assert.equal(remain(p3, { 3: true }), 91);

/* 임계치를 넘긴 청원의 남은 인원은 음수가 아니라 0 이다. */
assert.equal(remain(byId(1), none), 0); // 512 / 480

/* 임박 = 40% 이상 모였고 아직 도달 전. */
assert.equal(isSoon(byId(1), none), false, "이미 도달한 건 임박이 아니다");
assert.equal(isSoon(byId(3), none), true, "88/180 = 48.9%");
assert.equal(isSoon(byId(6), none), false, "96/480 = 20%");
assert.equal(isSoon(byId(5), none), true, "268/480 = 55.8%");

/* 임계치 도달 직전 한 건이 공감 하나로 임박에서 빠진다. */
const edge = { ...byId(3), current: 179 };
assert.equal(isSoon(edge, none), true);
assert.equal(isSoon(edge, { 3: true }), false, "180/180 도달 → 임박 아님");

/* 상태 전이: 임계치를 넘는 순간 접수 → 검토중. 답변 완료는 유지된다. */
assert.equal(statusOf(edge, none), "received");
assert.equal(statusOf(edge, { 3: true }), "reviewing");
assert.equal(statusOf(byId(4), none), "answered");

/* 임박 탭은 남은 인원이 적은 순으로 고정 정렬된다. */
const soon = visibleList(SEED, { tab: "soon", category: "all", query: "", sort: "hot" }, none);
assert.deepEqual(
  soon.map((p) => p.id),
  [...soon].sort((a, b) => remain(a, none) - remain(b, none)).map((p) => p.id),
);
assert.ok(soon.every((p) => isSoon(p, none)));

/* 홈 탭 정렬 토글. */
const hot = visibleList(SEED, { tab: "home", category: "all", query: "", sort: "hot" }, none);
assert.equal(hot[0].id, 4, "공감순 1위는 631건");
const fresh = visibleList(SEED, { tab: "home", category: "all", query: "", sort: "new" }, none);
assert.equal(fresh[0].id, 6, "최신순 1위는 id 가 가장 큰 건");

/* 필터는 누적된다. */
const filtered = visibleList(SEED, { tab: "home", category: "library", query: "노트북", sort: "hot" }, none);
assert.deepEqual(
  filtered.map((p) => p.id),
  [6],
);
assert.deepEqual(
  visibleList(SEED, { tab: "mine", category: "all", query: "", sort: "hot" }, none).map((p) => p.id),
  [4, 3],
);
assert.deepEqual(
  visibleList(SEED, { tab: "home", category: "all", query: "세탁기", sort: "hot" }, none).map((p) => p.id),
  [2],
);
assert.equal(visibleList(SEED, { tab: "home", category: "all", query: "없는말", sort: "hot" }, none).length, 0);

/* 카테고리마다 임계치 기준이 다르다. */
assert.equal(thresholdFor(basisFor("department")), 180);
assert.equal(thresholdFor(basisFor("dorm")), 240);
assert.equal(thresholdFor(basisFor("library")), 480);

/* 30일 만료 D-day. 등록 당일은 D-30, 하루 지날 때마다 하나씩 줄고, 30일째부터 만료다. */
const at = (iso: string) => ({ ...byId(1), createdAt: iso });
const NOW = Date.parse("2026-08-06T12:00:00Z");
assert.equal(ddayLabel(at("2026-08-06T09:00:00Z"), NOW), "D-30");
assert.equal(ddayLabel(at("2026-08-04T12:00:00Z"), NOW), "D-28");
assert.equal(ddayLabel(at("2026-07-08T12:00:00Z"), NOW), "D-1", "29일 경과");
assert.equal(ddayLabel(at("2026-07-07T12:00:00Z"), NOW), "만료", "30일 경과");
assert.equal(ddayLabel(at("2026-05-01T12:00:00Z"), NOW), "만료");

/* SEED 는 갓 등록된 것부터 2주 전까지라 전부 만료 전이다. */
for (const p of SEED) assert.match(ddayLabel(p), /^D-(1[6-9]|2\d|30)$/, `SEED #${p.id} dday`);

assert.equal(ymd("2026-08-06T12:00:00+09:00"), "2026.08.06");

/* SEED 의 status 는 임계치 규칙과 어긋나지 않는다. */
for (const p of SEED) assert.equal(p.status, statusOf(p, none), `SEED #${p.id} status`);

console.log("selfcheck ok");
