/* 회원가입 (ROADMAP Phase 5-1 → Phase 6-3 실 백엔드 이메일 인증 플로우로 재작업).
   3단계: ① 이메일 인증코드 발송 ② 6자리 코드 확인(→verificationToken) ③ 계정 정보 입력.
   서버 UserMeResponse·SignupRequest 어디에도 이름 필드가 없어 이름 입력란을 없앴다
   (docs/api-spec.md, 사용자 확인 완료 — 헤더·마이페이지 이름 표시 제거는 별도 이슈 6-4). */

import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useSession } from "../../stores/session";
import * as api from "../../api";
import AuthLayout from "../../layouts/AuthLayout";
import { Button, Icon, Input, Select } from "../../components/ui";

function EmailStep({ onSent, loginHref }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !value.includes("@")) {
      setError("학교 이메일을 입력해 주세요.");
      return;
    }
    setError("");
    setSending(true);
    try {
      await api.sendSignupCode(value);
      onSent(value);
    } catch {
      setError("인증코드 발송에 실패했습니다. 이메일을 확인해 주세요.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "var(--text-strong)" }}>학교 인증</h2>
      <p style={{ margin: "0 0 22px", fontSize: 13.5, color: "var(--text-muted)" }}>학교 이메일로 인증코드를 보내드려요.</p>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input
          label="학교 이메일"
          type="email"
          placeholder="예: 20260000@office.skhu.ac.kr"
          prefix={<Icon name="user" size={16} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {error && (
          <p role="alert" style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--danger-500)" }}>{error}</p>
        )}
        <Button type="submit" variant="primary" size="lg" block disabled={sending} style={{ marginTop: 4 }}>
          {sending ? "발송 중…" : "인증코드 받기"}
        </Button>
      </form>

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 20, fontSize: 13 }}>
        <Link to={loginHref} style={{ color: "var(--text-muted)", fontWeight: 600 }}>로그인으로 돌아가기</Link>
        <span style={{ color: "var(--border-strong)" }}>|</span>
        <a href="https://portal.skhu.ac.kr/html/main/index.html?portalPage=portal_main" target="_blank" rel="noopener noreferrer" style={{ color: "var(--indigo-200)", fontWeight: 700 }}>학교 이메일을 모르시나요?</a>
      </div>
    </>
  );
}

function CodeStep({ email, onVerified, onBack }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const value = code.trim();
    if (!/^\d{6}$/.test(value)) {
      setError("6자리 인증코드를 입력해 주세요.");
      return;
    }
    setError("");
    setChecking(true);
    try {
      const verificationToken = await api.confirmSignupCode(email, value);
      onVerified(verificationToken);
    } catch {
      setError("인증코드가 올바르지 않거나 만료되었습니다.");
    } finally {
      setChecking(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError("");
    try {
      await api.sendSignupCode(email);
    } catch {
      setError("인증코드 재발송에 실패했습니다.");
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <button type="button" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontWeight: 600, fontSize: 13, marginBottom: 14, fontFamily: "var(--font-sans)", padding: 0 }}>
        <Icon name="arrowLeft" size={16} /> 이전
      </button>
      <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "var(--text-strong)" }}>인증코드 확인</h2>
      <p style={{ margin: "0 0 22px", fontSize: 13.5, color: "var(--text-muted)" }}>{email} 로 보낸 6자리 코드를 입력하세요.</p>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input
          label="인증코드"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          prefix={<Icon name="shield" size={16} />}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          required
        />
        {error && (
          <p role="alert" style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--danger-500)" }}>{error}</p>
        )}
        <Button type="submit" variant="primary" size="lg" block disabled={checking} style={{ marginTop: 4 }}>
          {checking ? "확인 중…" : "확인"}
        </Button>
      </form>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button type="button" onClick={resend} disabled={resending} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--indigo-200)", fontWeight: 700, fontSize: 13, fontFamily: "var(--font-sans)" }}>
          {resending ? "재발송 중…" : "인증코드 다시 받기"}
        </button>
      </div>
    </>
  );
}

function AccountStep({ verificationToken, onBack }) {
  const signup = useSession((s) => s.signup);
  const [departments, setDepartments] = useState([]);
  const [dept, setDept] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadedDepartments, setLoadedDepartments] = useState(false);

  useEffect(() => {
    api.listDepartments().then((list) => {
      setDepartments(list);
      setLoadedDepartments(true);
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const loginId = String(form.get("loginId") ?? "").trim();
    const password = String(form.get("password") ?? "").trim();
    const passwordConfirm = String(form.get("passwordConfirm") ?? "").trim();
    setError("");
    if (!loginId || !password) {
      setError("아이디와 비밀번호를 입력해 주세요.");
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
      await signup({ loginId, password, departmentId: Number(dept), verificationToken });
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
      <p style={{ margin: "0 0 22px", fontSize: 13.5, color: "var(--text-muted)" }}>이메일 인증 완료</p>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input label="아이디" name="loginId" placeholder="아이디를 입력하세요" prefix={<Icon name="user" size={16} />} required />
        <Select label="소속 학부" options={departments} value={dept} onChange={(e) => setDept(e.target.value)} placeholder={loadedDepartments ? "학부를 선택하세요" : "불러오는 중…"} />
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
  const [step, setStep] = useState("email"); // email → code → account
  const [email, setEmail] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [params] = useSearchParams();
  const raw = params.get("next") || "/";
  // 오픈 리다이렉트 방지: LoginScreen과 동일한 규칙(앱 내부 절대경로만 허용).
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

  if (authed) return <Navigate to={next} replace />;

  return (
    <AuthLayout>
      {step === "email" && (
        <EmailStep
          loginHref={`/login?next=${encodeURIComponent(next)}`}
          onSent={(value) => {
            setEmail(value);
            setStep("code");
          }}
        />
      )}
      {step === "code" && (
        <CodeStep
          email={email}
          onBack={() => setStep("email")}
          onVerified={(token) => {
            setVerificationToken(token);
            setStep("account");
          }}
        />
      )}
      {step === "account" && <AccountStep verificationToken={verificationToken} onBack={() => setStep("code")} />}
    </AuthLayout>
  );
}
