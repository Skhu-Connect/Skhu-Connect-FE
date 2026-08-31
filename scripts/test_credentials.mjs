import assert from "node:assert/strict";
import { LOGIN_ID_HINT, PASSWORD_HINT, validateLoginId, validatePassword } from "../src/utils/credentials.js";

/* 규칙(백엔드 정책):
   아이디   5~20자 · 영문/숫자 + _ - . 만, 한글·공백 금지
   비밀번호 5~20자 · 영문 1자+숫자 1자 필수, 특수문자는 ! @ # $ % ^ & * ? _ 만, 한글·공백 금지
   대문자·특수문자는 선택이다 — 안 써도 통과해야 한다. */

/* 통과하는 것들 — 소문자만, 대문자 섞기, 허용 특수문자, 경계 길이(5·20). */
for (const ok of ["abcde", "Hong_Gil.dong-1", "20260000", "a".repeat(20), "user.name"]) {
  assert.equal(validateLoginId(ok), "", `아이디 통과해야 함: ${ok}`);
}
for (const ok of ["abc12", "Passw0rd!", "a1_b2*c3?", "a".repeat(19) + "1"]) {
  assert.equal(validatePassword(ok), "", `비밀번호 통과해야 함: ${ok}`);
}

/* 아이디 — 무엇이 틀렸는지 다르게 말한다. */
assert.match(validateLoginId(""), /입력해 주세요/);
assert.match(validateLoginId("hong gil"), /공백/);
assert.match(validateLoginId("홍길동abc"), /한글/);
assert.match(validateLoginId("hong@skhu"), /@/, "걸린 문자를 짚어 줘야 한다");
assert.match(validateLoginId("abcd"), /5자 이상.*지금 4자/);
assert.match(validateLoginId("a".repeat(21)), /20자 이하.*지금 21자/);

/* 비밀번호 — 길이·구성요소·문자표를 각각 따로 잡는다. */
assert.match(validatePassword(""), /입력해 주세요/);
assert.match(validatePassword("abc 123"), /공백/);
assert.match(validatePassword("비밀번호1"), /한글/);
assert.match(validatePassword("abc123~"), /~/);
assert.match(validatePassword("ab1"), /5자 이상.*지금 3자/);
assert.match(validatePassword("a1".repeat(11)), /20자 이하.*지금 22자/);
assert.match(validatePassword("abcdef"), /영문.*1자 이상|숫자.*1자 이상/);
assert.match(validatePassword("abcdef"), /숫자/, "숫자가 없으면 숫자를 말한다");
assert.match(validatePassword("123456"), /영문/, "영문이 없으면 영문을 말한다");

/* 화면이 "새 비밀번호"라 부르면 문구도 그렇게 나온다(비밀번호 찾기·변경). */
assert.match(validatePassword("123456", "새 비밀번호"), /^새 비밀번호에 영문/);

/* 안내 문구도 규칙과 같은 숫자를 말해야 한다 — 힌트와 경고가 어긋나면 사용자가 헤맨다. */
assert.match(LOGIN_ID_HINT, /5~20자/);
assert.match(PASSWORD_HINT, /5~20자/);

console.log("credentials check ok");
