import assert from "node:assert/strict";
import { setOnSessionExpired, reportPetition } from "../src/api/index.js";

/* refresh 가 실패하면(리프레시 토큰 만료/무효) session.js 의 onSessionExpired 훅이 불려야 한다 —
   안 그러면 authed 스토어가 그대로 남아 "좀비 로그인" 상태가 된다(대화 맥락 참고). */
global.fetch = async () => ({ ok: false, status: 401, json: async () => ({}) });

let expired = false;
setOnSessionExpired(() => {
  expired = true;
});

await assert.rejects(() => reportPetition(1, "SPAM", "테스트 신고 사유입니다"));
assert.equal(expired, true, "refresh 실패 시 onSessionExpired 훅이 호출돼야 한다");

console.log("session expired hook check ok");
