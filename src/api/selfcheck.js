/* 임계치 전이 self-check. 프레임워크 없이 실행한다:
     node src/api/selfcheck.js

   ROADMAP 0-6 의 완료 조건(임계치 전이 · 의존 B · 의존 C)만 검증한다.
   테스트 픽스처를 만들기 위해서만 mockDb 를 import 한다 — 시드에는 "임계치 직전"
   상태의 청원이 없어서 공개 api 만으로는 전이 순간을 만들 수 없다.
   화면·스토어 코드는 절대 mockDb 를 import 하지 않는다(3-3 검증 대상). */

import assert from "node:assert/strict";
import { db } from "./mockDb.js";
import { getPetition, listCategories, toggleEmpathy, answerPetition } from "./index.js";

/* --- C. 임계치·기준·담당자의 단일 출처는 categories[] 다 --- */
const cats = await listCategories();
const dorm = cats.find((c) => c.key === "dorm");
const p2 = await getPetition(2); // 기숙사 청원
assert.equal(dorm.threshold, 240);
assert.equal(p2.threshold, dorm.threshold, "청원의 임계치는 카테고리에서 파생돼야 한다");
assert.equal(p2.basis, dorm.basis);
assert.equal(p2.owner.name, dorm.owner.name);

/* --- 임계치 전이: 접수 → 검토중 --- */
const target = db.petitions.find((p) => p.id === 3); // 학부, 임계치 180
target.current = 179;
target.status = "received";

const before = await getPetition(3);
assert.equal(before.status, "received");
assert.equal(before.current, 179);

const crossed = await toggleEmpathy(3);
assert.equal(crossed.current, 180, "공감 1건이 카운트에 반영돼야 한다");
assert.equal(crossed.status, "reviewing", "임계치에 닿으면 검토중으로 전이해야 한다");
assert.equal(crossed.voted, true, "내 공감 여부가 실려야 한다(화면이 +1 을 더하지 않는다)");

const undone = await toggleEmpathy(3);
assert.equal(undone.current, 179);
assert.equal(undone.status, "reviewing", "이미 발송된 검토 요청은 되돌리지 않는다(승격 전용)");

/* 임계치 미달 청원은 공감해도 접수 상태를 유지한다 */
const below = await toggleEmpathy(5); // 시설 154/480
assert.equal(below.current, 155);
assert.equal(below.status, "received");

/* --- B. 답변은 청원별로 정규화된다 --- */
const seeded = await getPetition(4);
assert.equal(seeded.answer.dept, "학생지원팀", "시드 답변은 그 청원의 담당 부서 명의여야 한다");
assert.equal((await getPetition(1)).answer, null, "답변 없는 청원은 answer 가 없다");

const { answer } = await answerPetition(1, "  시험기간 시범 운영을 검토하겠습니다.  ");
assert.equal(answer.body, "시험기간 시범 운영을 검토하겠습니다.");
assert.equal(answer.dept, "학술정보관", "답변 부서는 카테고리 담당자에서 온다");
assert.equal((await getPetition(1)).status, "answered");
assert.equal((await getPetition(1)).answer.body, answer.body);
assert.equal((await getPetition(3)).answer, null, "다른 청원에는 답변이 생기지 않는다");

await assert.rejects(() => answerPetition(1, "   "), /답변 본문/, "빈 본문은 거부한다");

console.log("selfcheck ok");
