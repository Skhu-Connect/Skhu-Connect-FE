/* /login·/signup 의 ?next= 복귀 경로 검증. 앱 내부 절대경로만 허용한다(오픈 리다이렉트 방지).
   "//evil.com"뿐 아니라 "/\evil.com"도 막는다 — WHATWG URL 파서는 http/https 스킴에서
   백슬래시를 슬래시로 정규화하므로 "/\evil.com"이 실제로는 "//evil.com"(프로토콜 상대 URL)과
   같게 취급된다. */
export function sanitizeNextPath(raw) {
  const value = raw || "/";
  return /^\/(?![\\/])/.test(value) ? value : "/";
}
