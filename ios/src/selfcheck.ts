/* 임계치·필터·정렬 self-check. 실행: node src/selfcheck.ts */
import assert from "node:assert/strict";
import { NOTIF_POINTS, NOTIF_TYPE_TITLE, SEED, pointOf } from "./data.ts";
import { basisFor, count, ddayLabel, statusOf, thresholdFor, visibleList, ymd } from "./logic.ts";

const none = {};
const byId = (id: number) => SEED.find((p) => p.id === id)!;

/* 공감을 누르면 표시 수가 1 는다. */
const p3 = byId(3); // 88 / 180
assert.equal(count(p3, none), 88);
assert.equal(count(p3, { 3: true }), 89);

/* 상태 전이: 임계치를 넘는 순간 접수 → 검토중. 답변 완료는 유지된다. */
const edge = { ...byId(3), current: 179 }; // 임계치 180 도달 직전
assert.equal(statusOf(edge, none), "received");
assert.equal(statusOf(edge, { 3: true }), "reviewing");
assert.equal(statusOf(byId(4), none), "answered");

/* 답변 완료 탭은 공식 답변이 등록된 건의만 보여준다. */
const answered = visibleList(SEED, { tab: "answered", category: "all", query: "", sort: "hot" }, none);
assert.deepEqual(
  answered.map((p) => p.id),
  [4],
);
assert.ok(answered.every((p) => p.status === "answered"));

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

/* 알림 포인트 5개가 서버 NotificationType 8종을 빠짐없이·겹치지 않게 덮는지.
   백엔드가 enum 을 늘리면 여기가 먼저 터진다 — 그때 NOTIF_POINTS 에 그 종류를 넣는다
   (Skhu-Connect-BE notification/entity/NotificationType.java). */
const SERVER_NOTIF_TYPES = [
  "PETITION_AGREEMENT_60_PERCENT",
  "PETITION_AGREEMENT_100_PERCENT",
  "PETITION_UNDER_REVIEW",
  "PETITION_ANSWERED",
  "COMMENT_REPLY",
  "COMMENT_LIKE",
  "REPLY_LIKE",
  "NOTICE",
];
const mapped = NOTIF_POINTS.flatMap((point) => point.types);
assert.equal(NOTIF_POINTS.length, 5, "알림 포인트는 백엔드 NotificationEventService 의 발생 지점 5곳");
assert.equal(new Set(mapped).size, mapped.length, "한 알림 종류가 두 포인트에 걸치면 안 된다");
assert.deepEqual([...mapped].sort(), [...SERVER_NOTIF_TYPES].sort(), "8종이 5개 포인트로 빠짐없이 나뉘어야 한다");
assert.deepEqual(Object.keys(NOTIF_TYPE_TITLE).sort(), [...SERVER_NOTIF_TYPES].sort(), "제목도 8종 전부 있어야 한다");
assert.equal(pointOf("PETITION_ANSWERED").key, "answer");
assert.equal(pointOf("WHAT_IS_THIS").key, "etc", "모르는 종류는 회색 기본값으로 떨어진다");

console.log("selfcheck ok");
