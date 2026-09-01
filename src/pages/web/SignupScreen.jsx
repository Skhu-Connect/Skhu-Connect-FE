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
import { sanitizeNextPath } from "../../utils/nextPath";
import { RESEND_WAIT_SECONDS, sendCodeErrorMessage, useResendCooldown } from "../../utils/useResendCooldown";
import { LOGIN_ID_HINT, PASSWORD_HINT, validateLoginId, validatePassword } from "../../utils/credentials";
import { PRIVACY_POLICY_PATH, TERMS_PATH } from "../../legal";

const TERMS_VERSION = "1.0";
/* 인증코드가 도착하는 학교 메일함(office365). 받은편지함으로 바로 연다. */
const OUTLOOK_URL = "https://outlook.cloud.microsoft/mail/inbox/?culture=ko-kr&country=kr";

/* 각주 링크(13px, "로그인으로 돌아가기" 옆)로 두었더니 아무도 못 눌렀다는 리포트를 받았다.
   입력란과 같은 폭의 버튼으로 세운다 — 채움이 없어 1차 CTA 와 안 겹친다. 두 단계 모두에 둔다:
   메일이 이미 와 있는데 화면을 다시 연 경우가 있다(사용자 요청).
   링크 의미는 유지해야 하므로 Button 이 아니라 버튼처럼 그린 a 다(새 탭·가운데 클릭이 그대로 산다). */
function MailboxButton() {
  return (
    <a
      href={OUTLOOK_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: 52,
        borderRadius: "var(--radius-pill)",
        border: "1.5px solid var(--border-strong)",
        background: "var(--surface-card)",
        color: "var(--text-strong)",
        fontSize: "var(--fs-md)",
        fontWeight: 700,
        textDecoration: "none",
      }}
    >
      <Icon name="inbox" size={18} /> 메일함에서 인증번호 확인하기
    </a>
  );
}

function LoginIdNotice({ onClose }) {
  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="login-id-notice-title" aria-describedby="login-id-notice-body" style={{ position: "fixed", inset: 0, zIndex: 100, display: "grid", placeItems: "center", padding: 20, background: "rgba(15, 23, 42, .45)" }}>
      <div style={{ width: "min(100%, 360px)", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", padding: 22 }}>
        <h2 id="login-id-notice-title" style={{ margin: "0 0 8px", fontSize: 18, color: "var(--text-strong)" }}>아이디를 신중하게 정해 주세요</h2>
        <p id="login-id-notice-body" style={{ margin: "0 0 20px", fontSize: 13.5, lineHeight: 1.6, color: "var(--text-body)" }}>회원가입 후에는 아이디를 변경할 수 없습니다.</p>
        <Button type="button" variant="primary" block autoFocus onClick={onClose}>확인</Button>
      </div>
    </div>
  );
}

/* iOS Signup 의 ConsentRow 와 같은 줄 구성(체크박스 + 보기 링크)이다. */
function ConsentRow({ checked, label, href, onToggle }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "var(--text-strong)", cursor: "pointer" }}>
        <input type="checkbox" checked={checked} onChange={onToggle} />
        <span>{label}</span>
      </label>
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--indigo-200)", textDecoration: "underline", textUnderlineOffset: 3, flexShrink: 0 }}>
        보기
      </a>
    </div>
  );
}

function EmailStep({ onSent, loginHref }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  /* 약관·개인정보 동의를 여기 둔다 — 이메일 인증을 다 거친 뒤 마지막 단계에서야 보여주면
     "가입 절차를 밟고 나서" 동의를 강요받는 꼴이다. iOS 는 처음부터 이 단계에 있었다. */
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !value.includes("@")) {
      setError("학교 이메일을 입력해 주세요.");
      return;
    }
    if (!termsAgreed || !privacyAgreed) {
      setError("이용약관과 개인정보처리방침에 모두 동의해 주세요.");
      return;
    }
    setError("");
    setSending(true);
    try {
      await api.sendSignupCode(value);
      onSent(value);
    } catch (e) {
      setError(sendCodeErrorMessage(e, "인증코드 발송에 실패했습니다. 이메일을 확인해 주세요."));
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
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <ConsentRow
            checked={termsAgreed}
            label="[필수] 이용약관(EULA) 및 커뮤니티 정책에 동의합니다."
            href={TERMS_PATH}
            onToggle={() => { setTermsAgreed((v) => !v); setError(""); }}
          />
          <ConsentRow
            checked={privacyAgreed}
            label="[필수] 개인정보처리방침에 동의합니다."
            href={PRIVACY_POLICY_PATH}
            onToggle={() => { setPrivacyAgreed((v) => !v); setError(""); }}
          />
        </div>
        {error && (
          <p role="alert" style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--danger-500)" }}>{error}</p>
        )}
        <Button type="submit" variant="primary" size="lg" block disabled={sending} style={{ marginTop: 4 }}>
          {sending ? "발송 중…" : "인증코드 받기"}
        </Button>
      </form>

      <div style={{ marginTop: 14 }}>
        <MailboxButton />
      </div>

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 20, fontSize: 13 }}>
        <Link to={loginHref} style={{ color: "var(--text-muted)", fontWeight: 600 }}>로그인으로 돌아가기</Link>
      </div>
    </>
  );
}

function CodeStep({ email, onVerified, onBack }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  /* 이 화면은 코드를 막 보낸 직후에만 뜬다 — 쿨다운은 60초에서 시작한다. */
  const [cooldown, startCooldown] = useResendCooldown(RESEND_WAIT_SECONDS);

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
    } catch (e) {
      setError(sendCodeErrorMessage(e, "인증코드 재발송에 실패했습니다."));
    } finally {
      /* 성공이든 429 든 서버의 60초 창은 다시 시작한다. */
      startCooldown();
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

      <div style={{ marginTop: 14 }}>
        <MailboxButton />
      </div>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button type="button" onClick={resend} disabled={resending || cooldown > 0} style={{ background: "none", border: "none", cursor: resending || cooldown > 0 ? "default" : "pointer", color: cooldown > 0 ? "var(--text-muted)" : "var(--indigo-200)", fontWeight: 700, fontSize: 13, fontFamily: "var(--font-sans)" }}>
          {resending ? "재발송 중…" : cooldown > 0 ? `${cooldown}초 후 다시 받기` : "인증코드 다시 받기"}
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
    /* ponytail: 비밀번호는 trim 하지 않는다 — 공백은 규칙 위반이라 잘라 삼키면 안 되고,
       "공백은 쓸 수 없습니다"라고 말해 줘야 사용자가 실제로 친 값을 고친다. */
    const password = String(form.get("password") ?? "");
    const passwordConfirm = String(form.get("passwordConfirm") ?? "");
    setError("");
    const loginIdError = validateLoginId(loginId);
    if (loginIdError) {
      setError(loginIdError);
      return;
    }
    if (!dept) {
      setError("소속 학부를 선택해 주세요.");
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 서로 다릅니다.");
      return;
    }
    setSaving(true);
    try {
      await signup({ loginId, password, departmentId: Number(dept), verificationToken, termsAgreed: true, termsVersion: TERMS_VERSION });
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
        <Input label="아이디" name="loginId" hint={LOGIN_ID_HINT} placeholder="아이디를 입력하세요" prefix={<Icon name="user" size={16} />} autoComplete="username" required />
        <Select label="소속 학부" options={departments} value={dept} onChange={(e) => setDept(e.target.value)} placeholder={loadedDepartments ? "학부를 선택하세요" : "불러오는 중…"} />
        <Input label="비밀번호" name="password" type="password" hint={PASSWORD_HINT} placeholder="••••••••" prefix={<Icon name="lock" size={16} />} autoComplete="new-password" required />
        <Input label="비밀번호 확인" name="passwordConfirm" type="password" placeholder="••••••••" prefix={<Icon name="lock" size={16} />} autoComplete="new-password" required />
        {/* 약관 동의는 1단계(EmailStep)로 옮겼다 — 여기선 signup 호출에 termsAgreed 만 실어 보낸다. */}
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
  const [noticeOpen, setNoticeOpen] = useState(true);
  const [step, setStep] = useState("email"); // email → code → account
  const [email, setEmail] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [params] = useSearchParams();
  const next = sanitizeNextPath(params.get("next"));

  if (authed) return <Navigate to={next} replace />;

  return (
    <AuthLayout>
      {noticeOpen && <LoginIdNotice onClose={() => setNoticeOpen(false)} />}
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
