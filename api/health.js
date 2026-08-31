/* GET /health — 인증 없는 헬스체크. 도메인 최상단(vercel.json 리라이트)에 붙는다.

   양방향 한 곳에서 처리한다: 이 함수가 응답하면 프론트가 살아있는 것이고(백엔드/모니터가
   여길 찌른다), 응답 본문의 backend 는 우리가 백엔드 /actuator/health 를 찔러본 결과다.
   브라우저에서 직접 못 찌르는 이유 — /actuator/health 에는 CORS 헤더가 없다. 서버에서
   부르면 CORS 자체가 없으므로 상태값을 그대로 읽을 수 있다. */

const BACKEND_HEALTH = "https://skhu-connect-be-production.up.railway.app/actuator/health";

export default async function handler(req, res) {
  const started = Date.now();
  let backend;
  try {
    const r = await fetch(BACKEND_HEALTH, { signal: AbortSignal.timeout(5000) });
    const body = r.ok ? await r.json().catch(() => null) : null;
    backend = { status: r.ok ? (body?.status ?? "UP") : "DOWN", httpStatus: r.status };
  } catch (e) {
    backend = { status: "DOWN", error: e.name }; // 타임아웃/DNS/커넥션 거부
  }
  backend.latencyMs = Date.now() - started;

  const up = backend.status === "UP";
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*"); // 인증 없는 공개 엔드포인트 — 누가 찌르든 상관없다
  res.status(up ? 200 : 503).json({
    status: up ? "UP" : "DEGRADED",
    frontend: "UP",
    backend,
    checkedAt: new Date().toISOString(),
  });
}
