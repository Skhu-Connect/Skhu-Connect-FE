import assert from "node:assert/strict";
import { isAgreeable } from "../src/utils/serverDate.js";

/* 서버는 OPEN && 기한 > now 일 때만 요청·취소를 받는다(그 밖은 409 Petition is not agreeable).
   이 판정이 어긋나면 막힌 글의 버튼이 살아나 가짜 성공이 다시 생긴다. */
const now = Date.parse("2026-10-26T06:00:00Z");

assert.equal(isAgreeable("OPEN", "2026-10-26T06:00:01", now), true, "OPEN 기한 전");
assert.equal(isAgreeable("OPEN", "2026-10-26T05:59:59", now), false, "OPEN 기한 지남");
assert.equal(isAgreeable("OPEN", "2026-10-26T06:00:00", now), false, "기한과 같은 시각은 마감(서버는 > now)");
assert.equal(isAgreeable("OPEN", null, now), false, "기한 없음");
assert.equal(isAgreeable("OPEN", undefined, now), false, "기한 없음");
for (const s of ["EXPIRED", "UNDER_REVIEW", "ANSWERED"]) assert.equal(isAgreeable(s, "2026-11-30T00:00:00", now), false, s);

// 마이크로초 — 타임존 없으면 UTC 로 읽는다
assert.equal(isAgreeable("OPEN", "2026-10-26T06:00:00.123456", now), true, "마이크로초 기한 전");
assert.equal(isAgreeable("OPEN", "2026-10-26T05:59:59.999999", now), false, "마이크로초 기한 지남");
// +09:00 — 15:00 KST = 06:00 UTC. 'Z' 를 덧붙이면 안 된다
assert.equal(isAgreeable("OPEN", "2026-10-26T15:00:01+09:00", now), true, "+09:00 기한 전");
assert.equal(isAgreeable("OPEN", "2026-10-26T14:59:59+09:00", now), false, "+09:00 기한 지남");

console.log("agreeable check ok");
