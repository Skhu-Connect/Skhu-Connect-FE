/* 한글(한컴오피스)에서 열 수 있는 문서 생성. 관리자 콘솔의 청원 내보내기가 유일한 호출부다.

   왜 .hwp 가 아니라 .rtf 인가
   - .hwp 는 공개 스펙이 없는 독점 바이너리(CFBF)라 라이브러리 없이는 못 만든다.
   - .hwpx 는 ZIP+XML(OWPML)이라 만들 수는 있지만 스키마가 까다로워 한 군데만 어긋나도
     한글이 파일을 통째로 거부한다. 개발 환경에 한컴오피스가 없어 검증할 방법이 없다.
   - .rtf 는 순수 텍스트 포맷이라 의존성이 0이고, 한글이 예전부터 「불러오기」로 지원한다.
     TextEdit·Word·Pages 로도 열려서 우리가 실제로 열어보고 확인할 수 있다.
   표가 필요하면 엑셀(CSV)로 받는다. 이 문서는 긴 민원 본문을 읽으라고 만든다.

   한글 문자는 전부 \uNNNN? 로 escape 한다. RTF 본문은 ASCII 라 한글을 그대로 넣으면
   읽는 쪽 코드페이지에 따라 깨진다. N 은 부호 있는 16비트라서 32767 을 넘으면 음수로 적는다
   (한글 음절 U+AC00~U+D7A3 이 전부 이 구간이다). 뒤의 ? 는 \uc1 이 요구하는 대체 문자다. */

import { downloadFile } from "./download.js";

function escape(text) {
  const s = String(text ?? "");
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const code = s.charCodeAt(i);
    if (ch === "\\" || ch === "{" || ch === "}") out += `\\${ch}`;
    else if (ch === "\n") out += "\\par\n";
    else if (ch === "\r") continue; // \r\n 이 문단 두 개가 되지 않게 버린다
    else if (code < 128) out += ch;
    else out += `\\u${code > 32767 ? code - 65536 : code}?`;
  }
  return out;
}

const par = (text, prefix = "") => `{${prefix}${escape(text)}\\par}\n`;

/** @param {string} title @param {string} subtitle
    @param {Array<{heading: string, meta: string, body: string}>} items */
export function toRtf(title, subtitle, items) {
  const head = "{\\rtf1\\ansi\\ansicpg949\\deff0\\uc1{\\fonttbl{\\f0\\fnil\\fcharset129 Malgun Gothic;}}\n\\f0\\fs22\n";
  const body = items
    .map((it, i) => par(`${i + 1}. ${it.heading}`, "\\b\\fs26 ") + par(it.meta, "\\fs18 ") + "{\\par}\n" + par(it.body) + "{\\par}\n")
    .join("");
  return `${head}${par(title, "\\b\\fs32 ")}${par(subtitle, "\\fs18 ")}{\\par}\n${body}}`;
}

export function downloadRtf(rtf, filename) {
  downloadFile([rtf], "application/rtf", filename);
}
