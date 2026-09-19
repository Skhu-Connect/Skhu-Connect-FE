import assert from "node:assert/strict";
import { toRtf } from "../src/utils/rtf.js";

/* 한글 escape 가 틀리면 파일은 열리는데 글자만 깨진다 — 눈으로 보기 전엔 모르는 종류라
   여기서 고정한다. 실제로 열리는지는 scripts/check_rtf_opens.sh 가 textutil 로 확인한다. */

const doc = toRtf("성공잇다 민원 내역", "2026-09-19 · 6건", [
  { heading: "화장실 문", meta: "시설 · 검토중", body: "첫 줄\n둘째 줄" },
]);

// 헤더: 한글 코드페이지 + \uc1(대체 문자 1개) + 한글 charset 폰트
assert.match(doc, /^\{\\rtf1\\ansi\\ansicpg949\\deff0\\uc1/);
assert.match(doc, /\\fcharset129/);
assert.ok(doc.endsWith("}"), "RTF 는 중괄호로 닫혀야 한다");

// 한글은 부호 있는 16비트로 escape 된다. "한" = U+D55C = 54620 > 32767 → 54620-65536
assert.match(toRtf("한", "", []), /\\u-10916\?/);
// "가" = U+AC00 = 44032 → 44032-65536
assert.match(toRtf("가", "", []), /\\u-21504\?/);
// 32767 이하(예: U+00E9)는 양수 그대로
assert.match(toRtf("é", "", []), /\\u233\?/);
// 이모지는 서러게이트 두 개가 각각 escape 된다(U+1F600 → D83D DE00)
assert.match(toRtf("😀", "", []), /\\u-10179\?\\u-8704\?/);

// RTF 제어 문자는 백슬래시로 막는다 — 안 막으면 문서 구조가 깨져 파일이 안 열린다
assert.match(toRtf("a\\b{c}d", "", []), /a\\\\b\\\{c\\\}d/);

// 본문 개행은 문단으로, \r 은 버린다(\r\n 이 빈 문단을 만들지 않게)
assert.match(doc, /\\par\n.*\\u/s);
assert.equal((toRtf("", "", [{ heading: "h", meta: "m", body: "A\r\nB" }]).match(/A\\par\nB/g) ?? []).length, 1);

// ASCII 는 그대로 통과한다
assert.match(doc, /1\. /);

console.log("rtf checks ok");
