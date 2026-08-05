/* 회원가입 (ROADMAP Phase 5-1). 2단계: ① 학교 이메일 인증 ② 아이디·비밀번호·학부 입력.
   이메일을 모르면 여기서 학교 포털 사이트로 빠질 수 있다.
   이메일 자체는 계정 스키마에 없다 — 이 목 단계에서 인증 게이트로만 쓰고 버린다. */

import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useSession } from "../../stores/session";
import * as api from "../../api";
import AuthLayout from "../../layouts/AuthLayout";
import { Button, Icon, Input, Select } from "../../components/ui";

function EmailStep({ onVerified }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !value.includes("@")) {
      setError("학교 이메일을 입력해 주세요.");
      return;
    }
    setError("");
    setChecking(true);
    // ponytail: 목 단계라 실제 메일 발송·검증이 없다. 이메일 형식만 확인하고 다음 단계로 넘긴다.
    setTimeout(() => {
      setChecking(false);
      onVerified(value);
    }, 400);
  };

  return (
    <>
      <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "var(--text-strong)" }}>학교 인증</h2>
      <p style={{ margin: "0 0 22px", fontSize: 13.5, color: "var(--text-muted)" }}>학교 이메일로 재학생 여부를 확인해요.</p>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input
          label="학교 이메일"
          type="email"
          placeholder="예: 20260000@skhu.ac.kr"
          prefix={<Icon name="user" size={16} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {error && (
          <p role="alert" style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--danger-500)" }}>{error}</p>
        )}
        <Button type="submit" variant="primary" size="lg" block disabled={checking} style={{ marginTop: 4 }}>
          {checking ? "확인 중…" : "인증하기"}
        </Button>
      </form>

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 20, fontSize: 13 }}>
        <Link to="/login" style={{ color: "var(--text-muted)", fontWeight: 600 }}>로그인으로 돌아가기</Link>
        <span style={{ color: "var(--border-strong)" }}>|</span>
        <a href="https://portal.skhu.ac.kr/html/main/index.html?portalPage=portal_main" target="_blank" rel="noopener noreferrer" style={{ color: "var(--indigo-200)", fontWeight: 700 }}>학교 이메일을 모르시나요?</a>
      </div>
    </>
  );
}

function AccountStep({ email, onBack }) {
  const signup = useSession((s) => s.signup);
  const [departments, setDepartments] = useState([]);
  const [dept, setDept] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.listDepartments().then(setDepartments);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const sid = String(form.get("sid") ?? "").trim();
    const name = String(form.get("name") ?? "").trim();
    const password = String(form.get("password") ?? "").trim();
    const passwordConfirm = String(form.get("passwordConfirm") ?? "").trim();
    setError("");
    if (!sid || !name || !password) {
      setError("아이디·이름·비밀번호를 입력해 주세요.");
      return;
    }
    if (!dept) {
      setError("소속 학부를 선택해 주세요.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 서로 다릅니다.");
      return;
    }
    setSaving(true);
    try {
      await signup({ sid, name, dept, password });
    } catch {
      setError("회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button type="button" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontWeight: 600, fontSize: 13, marginBottom: 14, fontFamily: "var(--font-sans)", padding: 0 }}>
        <Icon name="arrowLeft" size={16} /> 이전
      </button>
      <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "var(--text-strong)" }}>계정 정보 입력</h2>
      <p style={{ margin: "0 0 22px", fontSize: 13.5, color: "var(--text-muted)" }}>{email} 인증 완료</p>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input label="아이디" name="sid" placeholder="아이디를 입력하세요" prefix={<Icon name="user" size={16} />} required />
        <Input label="이름" name="name" placeholder="이름을 입력하세요" required />
        <Select label="소속 학부" options={departments} value={dept} onChange={(e) => setDept(e.target.value)} placeholder="학부를 선택하세요" />
        <Input label="비밀번호" name="password" type="password" placeholder="••••••••" prefix={<Icon name="lock" size={16} />} required />
        <Input label="비밀번호 확인" name="passwordConfirm" type="password" placeholder="••••••••" prefix={<Icon name="lock" size={16} />} required />
        {error && (
          <p role="alert" style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--danger-500)" }}>{error}</p>
        )}
        <Button type="submit" variant="primary" size="lg" block disabled={saving} style={{ marginTop: 4 }}>회원가입</Button>
      </form>
    </>
  );
}

export default function SignupScreen() {
  const authed = useSession((s) => s.authed);
  const [email, setEmail] = useState(null);

  if (authed) return <Navigate to="/" replace />;

  return (
    <AuthLayout>
      {email ? (
        <AccountStep email={email} onBack={() => setEmail(null)} />
      ) : (
        <EmailStep onVerified={setEmail} />
      )}
    </AuthLayout>
  );
}
