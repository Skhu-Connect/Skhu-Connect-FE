/* 관리자 로그인. AdminLayout 의 인증 가드가 미인증 방문자를 여기로 보낸다.
   학생 AuthLayout(캠퍼스 영상 스플릿 화면)은 모집 마케팅용이라 재사용하지 않는다 — 관리자
   콘솔은 AdminLayout 사이드바와 같은 navy 톤 카드 하나로 충분하다. */

import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAdminSession } from "../../stores/adminSession";
import { Button, Icon, Input } from "../../components/ui";

export default function AdminLoginScreen() {
  const authed = useAdminSession((s) => s.authed);
  const login = useAdminSession((s) => s.login);
  const navigate = useNavigate();
  const [error, setError] = useState("");

  if (authed) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const loginId = String(form.get("loginId") ?? "").trim();
    const password = String(form.get("password") ?? "").trim();
    setError("");
    if (!loginId || !password) {
      setError("아이디와 비밀번호를 입력해 주세요.");
      return;
    }
    try {
      await login(loginId, password);
      navigate("/admin", { replace: true });
    } catch {
      // 학생 로그인과 같은 이유로 서버 문구를 그대로 띄우지 않는다 — 계정 존재 여부를 흘리지 않는다.
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--navy-900)" }}>
      <div style={{ width: 360, maxWidth: "90vw", background: "#fff", borderRadius: "var(--radius-lg)", padding: "32px 28px", boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
          <img src="/logo.png" alt="" width={34} height={34} style={{ borderRadius: 9, display: "block" }} />
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-strong)" }}>성공잇다 관리자</div>
            <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>ADMIN CONSOLE</div>
          </div>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="아이디" name="loginId" placeholder="관리자 아이디" prefix={<Icon name="user" size={16} />} required />
          <Input label="비밀번호" name="password" type="password" placeholder="••••••••" prefix={<Icon name="lock" size={16} />} required />
          {error && (
            <p role="alert" style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--danger-500)" }}>{error}</p>
          )}
          <Button type="submit" variant="primary" size="lg" block style={{ marginTop: 4 }}>로그인</Button>
        </form>
      </div>
    </div>
  );
}
