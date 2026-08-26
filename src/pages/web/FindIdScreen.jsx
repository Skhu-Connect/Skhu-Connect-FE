/* 아이디 찾기. 학교 이메일 인증 또는 이메일+현재 비밀번호 확인 뒤 loginId를 보여준다. */

import { useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../../api";
import AuthLayout from "../../layouts/AuthLayout";
import { Button, Icon, Input } from "../../components/ui";

function MethodToggle({ method, onChange }) {
  const options = [
    { key: "email", label: "학교 이메일 인증" },
    { key: "password", label: "비밀번호 확인" },
  ];
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
      {options.map((o) => {
        const active = o.key === method;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: "var(--radius-md)",
              border: active ? "1.5px solid var(--indigo-400)" : "1px solid var(--border-strong)",
              background: active ? "rgba(99,102,241,.2)" : "rgba(255,255,255,.08)",
              color: active ? "#fff" : "var(--text-muted)",
              fontWeight: 700,
              fontSize: 13,
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

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
      await api.sendLoginIdFindCode(value);
      onSent(value);
    } catch {
      setError("인증코드 발송에 실패했습니다. 가입한 이메일인지 확인해 주세요.");
    } finally {
      setSending(false);
    }
  };

  return (
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
      <Button type="submit" variant="primary" size="lg" block disabled={sending}>{sending ? "발송 중…" : "인증코드 받기"}</Button>
    </form>
  );
}

function CodeStep({ email, onBack, onVerified }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      setError("6자리 인증코드를 입력해 주세요.");
      return;
    }
    setError("");
    setChecking(true);
    try {
      const token = await api.confirmLoginIdFindCode(email, code.trim());
      onVerified(await api.findLoginIdByEmail(token));
    } catch (e) {
      setError(e?.status === 409 ? "이미 사용한 인증입니다. 인증코드를 다시 받아 주세요." : e?.status === 410 ? "인증이 만료되었습니다. 인증코드를 다시 받아 주세요." : "인증코드가 올바르지 않습니다.");
    } finally {
      setChecking(false);
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
        <Button type="submit" variant="primary" size="lg" block disabled={checking}>{checking ? "확인 중…" : "확인"}</Button>
      </form>
    </>
  );
}

function PasswordStep({ onVerified }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("가입한 학교 이메일을 입력해 주세요.");
      return;
    }
    if (!password.trim()) {
      setError("비밀번호를 입력해 주세요.");
      return;
    }
    setError("");
    setChecking(true);
    try {
      onVerified(await api.findLoginIdByPassword(email.trim(), password));
    } catch (e) {
      setError(e?.status === 401 ? "이메일 또는 비밀번호가 올바르지 않습니다." : "아이디를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setChecking(false);
    }
  };

  return (
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
      <Input
        label="비밀번호"
        type="password"
        placeholder="••••••••"
        prefix={<Icon name="lock" size={16} />}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && (
        <p role="alert" style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--danger-500)" }}>{error}</p>
      )}
      <Button type="submit" variant="primary" size="lg" block disabled={checking}>{checking ? "확인 중…" : "확인"}</Button>
    </form>
  );
}

function NoticeStep({ loginId }) {
  return (
    <>
      <h2 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 800, color: "var(--text-strong)" }}>아이디를 찾았어요</h2>
      <p style={{ margin: "0 0 22px", fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
        회원님의 아이디는 <strong style={{ color: "#fff" }}>{loginId}</strong>입니다.
      </p>
      <Link to="/login">
        <Button type="button" variant="primary" size="lg" block>로그인으로 돌아가기</Button>
      </Link>
    </>
  );
}

export default function FindIdScreen() {
  const [method, setMethod] = useState("email");
  const [step, setStep] = useState("input"); // input → code(이메일 방식만) → done
  const [email, setEmail] = useState("");
  const [loginId, setLoginId] = useState("");

  if (step === "done") {
    return (
      <AuthLayout>
        <NoticeStep loginId={loginId} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {step === "input" && (
        <>
          <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "var(--text-strong)" }}>아이디 찾기</h2>
          <p style={{ margin: "0 0 20px", fontSize: 13.5, color: "var(--text-muted)" }}>
            학교 이메일 인증 또는 비밀번호 확인으로 본인 확인 후 아이디를 알려드려요.
          </p>

          <MethodToggle method={method} onChange={setMethod} />

          {method === "email" ? (
            <EmailStep onSent={(value) => { setEmail(value); setStep("code"); }} />
          ) : (
            <PasswordStep onVerified={(id) => { setLoginId(id); setStep("done"); }} />
          )}

          <p style={{ textAlign: "center", fontSize: 13, marginTop: 20 }}>
            <Link to="/login" style={{ color: "var(--text-muted)", fontWeight: 600 }}>로그인으로 돌아가기</Link>
          </p>
        </>
      )}
      {step === "code" && (
        <CodeStep email={email} onBack={() => setStep("input")} onVerified={(id) => { setLoginId(id); setStep("done"); }} />
      )}
    </AuthLayout>
  );
}
