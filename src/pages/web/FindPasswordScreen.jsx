/* 비밀번호 찾기. SignupScreen 의 이메일 인증 3단계(EmailStep→CodeStep)와 같은 구조를 재사용하고,
   마지막 단계만 계정 생성 대신 새 비밀번호 입력으로 바꾼다. purpose 만 다르고 엔드포인트는 같다
   (POST /connect/auth/email-verifications, .../confirm) — src/api/index.js 의
   sendPasswordResetCode/confirmPasswordResetCode 참고. */

import { useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../../api";
import AuthLayout from "../../layouts/AuthLayout";
import { Button, Icon, Input } from "../../components/ui";

function EmailStep({ onSent }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !value.includes("@")) {
      setError("가입한 학교 이메일을 입력해 주세요.");
      return;
    }
    setError("");
    setSending(true);
    try {
      await api.sendPasswordResetCode(value);
      onSent(value);
    } catch {
      setError("인증코드 발송에 실패했습니다. 이메일을 확인해 주세요.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "var(--text-strong)" }}>비밀번호 찾기</h2>
      <p style={{ margin: "0 0 22px", fontSize: 13.5, color: "var(--text-muted)" }}>가입하신 학교 이메일로 인증코드를 보내드려요.</p>

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

      <p style={{ textAlign: "center", fontSize: 13, marginTop: 20 }}>
        <Link to="/login" style={{ color: "var(--text-muted)", fontWeight: 600 }}>로그인으로 돌아가기</Link>
      </p>
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
      const verificationToken = await api.confirmPasswordResetCode(email, value);
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
      await api.sendPasswordResetCode(email);
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

function NewPasswordStep({ verificationToken, onDone, onBack }) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "").trim();
    const passwordConfirm = String(form.get("passwordConfirm") ?? "").trim();
    if (!password) {
      setError("새 비밀번호를 입력해 주세요.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 서로 다릅니다.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await api.resetPassword(verificationToken, password);
      onDone();
    } catch {
      setError("비밀번호 재설정에 실패했습니다. 처음부터 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button type="button" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontWeight: 600, fontSize: 13, marginBottom: 14, fontFamily: "var(--font-sans)", padding: 0 }}>
        <Icon name="arrowLeft" size={16} /> 이전
      </button>
      <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "var(--text-strong)" }}>새 비밀번호 설정</h2>
      <p style={{ margin: "0 0 22px", fontSize: 13.5, color: "var(--text-muted)" }}>인증 완료</p>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input label="새 비밀번호" name="password" type="password" placeholder="••••••••" prefix={<Icon name="lock" size={16} />} required />
        <Input label="새 비밀번호 확인" name="passwordConfirm" type="password" placeholder="••••••••" prefix={<Icon name="lock" size={16} />} required />
        {error && (
          <p role="alert" style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--danger-500)" }}>{error}</p>
        )}
        <Button type="submit" variant="primary" size="lg" block disabled={saving} style={{ marginTop: 4 }}>
          {saving ? "변경 중…" : "비밀번호 변경"}
        </Button>
      </form>
    </>
  );
}

function DoneStep() {
  return (
    <>
      <h2 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 800, color: "var(--text-strong)" }}>비밀번호가 변경되었습니다</h2>
      <p style={{ margin: "0 0 22px", fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
        새 비밀번호로 다시 로그인해 주세요.
      </p>
      <Link to="/login">
        <Button type="button" variant="primary" size="lg" block>로그인하러 가기</Button>
      </Link>
    </>
  );
}

export default function FindPasswordScreen() {
  const [step, setStep] = useState("email"); // email → code → password → done
  const [email, setEmail] = useState("");
  const [verificationToken, setVerificationToken] = useState("");

  return (
    <AuthLayout>
      {step === "email" && (
        <EmailStep
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
            setStep("password");
          }}
        />
      )}
      {step === "password" && (
        <NewPasswordStep
          verificationToken={verificationToken}
          onBack={() => setStep("code")}
          onDone={() => setStep("done")}
        />
      )}
      {step === "done" && <DoneStep />}
    </AuthLayout>
  );
}
