/* CSV 생성. 관리자 콘솔의 청원 내보내기가 유일한 호출부다.

   toCsv 를 순수 함수로 분리한 이유는 재사용이 아니라 검증이다 — 아래 세 가지가 전부 조용히
   틀리는 종류의 버그라서 scripts/test_csv.mjs 로 고정해둔다(Blob·a.click 은 node 에서 못 돈다).

   1. 모든 필드를 따옴표로 감싸고 내부 " 를 "" 로 늘린다. 민원 본문에는 줄바꿈과 쉼표가 그냥
      들어 있어서, 이걸 빠뜨리면 행이 어긋나 엑셀에서 표 전체가 밀린다.
   2. BOM(U+FEFF) 을 붙인다. 없으면 윈도우 엑셀이 CP949 로 읽어 한글이 전부 깨진다.
   3. = + - @ 로 시작하는 셀 앞에 ' 를 붙인다. 민원 본문은 학생이 자유롭게 쓴 텍스트이고 그걸
      관리자가 엑셀로 연다 — 수식으로 해석되는 경로를 남겨두지 않는다(CSV injection). */

import { downloadFile } from "./download.js";

const escape = (value) => {
  const text = String(value ?? "");
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** @param {string[]} headers @param {Array<Array<string|number|null>>} rows */
export function toCsv(headers, rows) {
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
}

export function downloadCsv(csv, filename) {
  downloadFile(["\uFEFF", csv], "text/csv;charset=utf-8", filename);
}
