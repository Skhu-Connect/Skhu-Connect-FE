/* 아이디·비밀번호 입력 규칙과 안내 문구. 웹 src/utils/credentials.js 의 복제본이다
   (별도 npm 프로젝트라 import 할 수 없다 — useResendCooldown 과 같은 사정).
   규칙을 고치면 웹 파일과 scripts/test_credentials.mjs 를 같이 고친다.

   아이디   5~20자 · 영문 대/소문자 + 숫자 + 특수문자 _ - . 만
   비밀번호 5~20자 · 영문 1자 이상 필수 + 숫자 1자 이상 필수, 특수문자는 ! @ # $ % ^ & * ? _ 허용
   둘 다 한글·공백 금지. 대문자와 특수문자는 "허용"이지 필수가 아니다. */

const HANGUL = /[ㄱ-ㅎㅏ-ㅣ가-힣]/;
const LOGIN_ID_CHAR = /[A-Za-z0-9_.-]/;
const PASSWORD_CHAR = /[A-Za-z0-9!@#$%^&*?_]/;

export const MIN_LENGTH = 5;
export const MAX_LENGTH = 20;

export const LOGIN_ID_HINT = "5~20자 · 영문·숫자와 _ - . 만 쓸 수 있어요";
export const PASSWORD_HINT = "5~20자 · 영문과 숫자를 꼭 섞어 주세요 (특수문자 ! @ # $ % ^ & * ? _ 가능)";

/** 허용 문자표에 없는 글자들. 어떤 글자가 걸렸는지 보여줘야 사용자가 지울 곳을 찾는다. */
function badChars(value: string, allowed: RegExp): string {
  const bad = [...new Set([...value])].filter((c) => !allowed.test(c));
  return bad.slice(0, 3).join(" ");
}

/** 규칙 위반 문구. 통과하면 빈 문자열이라 `if (msg) setError(msg)` 로 쓴다. */
export function validateLoginId(value: string): string {
  if (!value) return "아이디를 입력해 주세요.";
  if (/\s/.test(value)) return "아이디에는 공백을 쓸 수 없습니다.";
  if (HANGUL.test(value)) return "아이디에는 한글을 쓸 수 없습니다. 영문·숫자와 _ - . 만 쓸 수 있어요.";
  const bad = badChars(value, LOGIN_ID_CHAR);
  if (bad) return `아이디에 쓸 수 없는 문자가 있습니다: ${bad} — 특수문자는 _ - . 만 쓸 수 있어요.`;
  if (value.length < MIN_LENGTH) return `아이디는 ${MIN_LENGTH}자 이상이어야 합니다. (지금 ${value.length}자)`;
  if (value.length > MAX_LENGTH) return `아이디는 ${MAX_LENGTH}자 이하여야 합니다. (지금 ${value.length}자)`;
  return "";
}

/** 규칙 위반 문구. label 은 "비밀번호"/"새 비밀번호" 처럼 화면이 부르는 이름이다. */
export function validatePassword(value: string, label = "비밀번호"): string {
  if (!value) return `${label}를 입력해 주세요.`;
  if (/\s/.test(value)) return `${label}에는 공백을 쓸 수 없습니다.`;
  if (HANGUL.test(value)) return `${label}에는 한글을 쓸 수 없습니다.`;
  const bad = badChars(value, PASSWORD_CHAR);
  if (bad) return `${label}에 쓸 수 없는 문자가 있습니다: ${bad} — 특수문자는 ! @ # $ % ^ & * ? _ 만 쓸 수 있어요.`;
  if (value.length < MIN_LENGTH) return `${label}는 ${MIN_LENGTH}자 이상이어야 합니다. (지금 ${value.length}자)`;
  if (value.length > MAX_LENGTH) return `${label}는 ${MAX_LENGTH}자 이하여야 합니다. (지금 ${value.length}자)`;
  if (!/[A-Za-z]/.test(value)) return `${label}에 영문을 1자 이상 넣어 주세요.`;
  if (!/[0-9]/.test(value)) return `${label}에 숫자를 1자 이상 넣어 주세요.`;
  return "";
}
