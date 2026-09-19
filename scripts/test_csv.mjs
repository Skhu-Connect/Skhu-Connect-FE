import assert from "node:assert/strict";
import { toCsv } from "../src/utils/csv.js";

/* 민원 본문이 그대로 들어가는 열이 있어서, 아래 네 가지가 깨지면 엑셀에서 표가 통째로 밀리거나
   한글이 깨지거나 셀이 수식으로 실행된다. 전부 조용히 틀리는 종류라 여기서 고정한다. */

assert.equal(toCsv(["a", "b"], [[1, 2]]), '"a","b"\r\n"1","2"');

// 1. 줄바꿈·쉼표가 든 본문은 따옴표 안에 그대로 있어야 한다(행이 늘어나면 안 된다).
const multiline = toCsv(["내용"], [["첫 줄\n둘째 줄, 쉼표"]]);
assert.equal(multiline, '"내용"\r\n"첫 줄\n둘째 줄, 쉼표"');
assert.equal(multiline.split("\r\n").length, 2, "본문 개행이 CSV 행을 늘리면 안 된다");

// 2. 본문 속 따옴표는 두 개로 늘린다.
assert.equal(toCsv(["내용"], [['그는 "안 된다" 고 했다']]), '"내용"\r\n"그는 ""안 된다"" 고 했다"');

// 3. 수식으로 시작하는 셀은 ' 로 무력화한다(CSV injection).
assert.equal(toCsv(["내용"], [["=1+1"]]), '"내용"\r\n"\'=1+1"');
assert.equal(toCsv(["내용"], [["-급식 문제"]]), '"내용"\r\n"\'-급식 문제"');
assert.equal(toCsv(["내용"], [["+82 문의"]]), '"내용"\r\n"\'+82 문의"');
assert.equal(toCsv(["내용"], [["정상 문장"]]), '"내용"\r\n"정상 문장"', "평범한 본문에 ' 를 붙이면 안 된다");

// 4. null·undefined 는 빈 칸이지 "null" 이 아니다(숨김 사유가 없는 청원).
assert.equal(toCsv(["사유"], [[null]]), '"사유"\r\n""');

console.log("csv checks ok");
