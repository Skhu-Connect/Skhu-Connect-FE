/* 로그인·회원가입 공용 셸. 400px 카드가 그라디언트 위에 떠 있던 이전 모습은 모바일 앱
   로그인 화면을 그대로 옮긴 것처럼 보인다는 지적을 받았다 — 데스크톱 웹에 맞게
   좌(브랜드 그라디언트 패널) · 우(폼 패널) 스플릿 스크린으로 바꾼다. 프로젝트에
   반응형 분기가 없으므로(exec-plans/roadmap-web.md 참고) 고정 스플릿만 짠다. */

import { Link } from "react-router-dom";

export default function AuthLayout({ eyebrow, title, desc, children }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <div
        style={{
          flex: "0 0 42%",
          position: "relative",
          overflow: "hidden",
          background: "var(--gradient-hero)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 56px",
        }}
      >
        <Link to="/" style={{ position: "absolute", top: 40, left: 56, display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#fff" }}>
          <img src="/logo.png" alt="" width={34} height={34} style={{ borderRadius: 10, display: "block" }} />
          <span style={{ fontWeight: 800, fontSize: 17 }}>청원시스템</span>
        </Link>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 420 }}>
          <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.85, marginBottom: 12 }}>{eyebrow}</div>
          <h1 style={{ margin: 0, fontSize: 36, fontWeight: 800, lineHeight: 1.28, letterSpacing: "-.02em" }}>{title}</h1>
          <p style={{ margin: "16px 0 0", fontSize: 15, opacity: 0.9, lineHeight: 1.65 }}>{desc}</p>
        </div>

        <div style={{ position: "absolute", right: -80, top: -60, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
        <div style={{ position: "absolute", left: -60, bottom: -100, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, background: "var(--surface-page)" }}>
        <div style={{ width: 400, maxWidth: "100%" }}>{children}</div>
      </div>
    </div>
  );
}
