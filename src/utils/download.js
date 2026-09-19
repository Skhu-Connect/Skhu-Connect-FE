/* 브라우저에 파일 하나를 내려보낸다. CSV·한글 문서 두 내보내기가 같이 쓴다.

   링크를 실제로 DOM 에 넣었다 빼고, 해제는 한 틱 미룬다 — 만들자마자 click 하고 바로
   revoke 하면 브라우저에 따라 다운로드가 시작되기 전에 URL 이 사라져 아무 일도 안 일어난다.
   이 순서가 포맷마다 갈리면 한쪽만 조용히 안 받아지므로 한 군데 둔다. */

export function downloadFile(parts, type, filename) {
  const url = URL.createObjectURL(new Blob(parts, { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
