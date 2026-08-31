import assert from "node:assert/strict";
import { RESEND_WAIT_SECONDS, sendCodeErrorMessage } from "../src/utils/useResendCooldown.js";

/* 서버는 인증코드 재발송을 60초에 한 번만 허용한다(EmailVerification.RESEND_WAIT_SECONDS).
   그 창 안에서 누르면 429 가 오는데, 예전엔 "이메일을 확인해 주세요" 로 뭉개져 사용자가
   멀쩡한 학교 메일을 계속 고쳐 쓰는 상황이 됐다. 429 만은 따로 안내해야 한다. */
assert.equal(RESEND_WAIT_SECONDS, 60, "백엔드 RESEND_WAIT_SECONDS 와 같아야 한다");

const tooSoon = Object.assign(new Error("Email verification request failed"), { status: 429 });
assert.match(sendCodeErrorMessage(tooSoon, "폴백"), /1분에 한 번/);

/* 429 가 아닌 실패는 화면이 주는 문구를 그대로 쓴다 — 서버 title 은 영어라 못 쓴다. */
const conflict = Object.assign(new Error("Email verification request failed"), { status: 409 });
assert.equal(sendCodeErrorMessage(conflict, "폴백"), "폴백");
assert.equal(sendCodeErrorMessage(new Error("네트워크 오류"), "폴백"), "폴백");
assert.equal(sendCodeErrorMessage(undefined, "폴백"), "폴백");

console.log("resend cooldown check ok");
