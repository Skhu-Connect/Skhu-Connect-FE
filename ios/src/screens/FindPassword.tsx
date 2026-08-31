/* 비밀번호 찾기. Signup.tsx 의 이메일 인증 단계(EmailStep)와 같은 구조를 재사용하고,
   마지막 단계만 계정 생성 대신 새 비밀번호 입력으로 바꾼다. purpose 만 다르고 엔드포인트는 같다
   (POST /connect/auth/email-verifications, .../confirm) — src/api.ts 의
   sendPasswordResetCode/confirmPasswordResetCode 참고. 웹 FindPasswordScreen.jsx 와 단계·문구를 맞춘다. */
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AuthShell } from "../authShell";
import { Icon } from "../icons";
import { Button, Input } from "../ui";
import { font, onVideo } from "../theme";
import { confirmPasswordResetCode, resetPassword, sendPasswordResetCode } from "../api";
import { RESEND_WAIT_SECONDS, sendCodeErrorMessage, useResendCooldown } from "../useResendCooldown";

function ErrorText({ children }: { children: string }) {
  return <Text accessibilityRole="alert" style={[{ fontFamily: font }, { fontSize: 13, fontWeight: "600", color: onVideo.danger }]}>{children}</Text>;
}

function BackRow({ onBack }: { onBack: () => void }) {
  return (
    <Pressable onPress={onBack} accessibilityRole="button" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Icon name="arrowLeft" size={16} color={onVideo.muted} />
      <Text style={[{ fontFamily: font }, { fontSize: 13, fontWeight: "600", color: onVideo.muted }]}>이전</Text>
    </Pressable>
  );
}

function EmailStep({ onBack, onSent }: { onBack: () => void; onSent: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const value = email.trim();
    if (!value || !value.includes("@")) {
      setError("가입한 학교 이메일을 입력해 주세요.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetCode(value);
      onSent(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : "인증코드 발송에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Text style={[{ fontFamily: font }, { fontSize: 22, fontWeight: "800", color: onVideo.text }]}>비밀번호 찾기</Text>
      <Text style={[{ fontFamily: font }, { fontSize: 13.5, color: onVideo.muted }]}>가입하신 학교 이메일로 인증코드를 보내드려요.</Text>

      <Input dark label="학교 이메일" value={email} onChangeText={setEmail} placeholder="예: 20260000@office.skhu.ac.kr" keyboardType="email-address" />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button variant="primary" size="lg" block disabled={loading} onPress={send}>
        {loading ? "발송 중…" : "인증코드 받기"}
      </Button>

      <Pressable onPress={onBack} accessibilityRole="button" style={{ alignItems: "center" }}>
        <Text style={[{ fontFamily: font }, { fontSize: 13, fontWeight: "600", color: onVideo.muted }]}>로그인으로 돌아가기</Text>
      </Pressable>
    </>
  );
}

function CodeStep({ email, onBack, onVerified }: { email: string; onBack: () => void; onVerified: (token: string) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  /* 이 화면은 코드를 막 보낸 직후에만 뜬다 — 쿨다운은 60초에서 시작한다. */
  const [cooldown, startCooldown] = useResendCooldown(RESEND_WAIT_SECONDS);

  const confirm = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      setError("6자리 인증코드를 입력해 주세요.");
      return;
    }
    setError("");
    setChecking(true);
    try {
      const token = await confirmPasswordResetCode(email, code.trim());
      onVerified(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "인증코드가 올바르지 않거나 만료되었습니다.");
    } finally {
      setChecking(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError("");
    try {
      await sendPasswordResetCode(email);
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
      <BackRow onBack={onBack} />
      <Text style={[{ fontFamily: font }, { fontSize: 22, fontWeight: "800", color: onVideo.text }]}>인증코드 확인</Text>
      <Text style={[{ fontFamily: font }, { fontSize: 13.5, color: onVideo.muted }]}>{email} 로 보낸 6자리 코드를 입력하세요.</Text>

      <Input dark label="인증코드" value={code} onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))} placeholder="123456" keyboardType="number-pad" />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button variant="primary" size="lg" block disabled={checking} onPress={confirm}>
        {checking ? "확인 중…" : "확인"}
      </Button>

      <Pressable onPress={resend} disabled={resending || cooldown > 0} accessibilityRole="button" style={{ alignItems: "center" }}>
        <Text style={[{ fontFamily: font }, { fontSize: 13, fontWeight: "700", color: cooldown > 0 ? onVideo.muted : onVideo.link }]}>
          {resending ? "재발송 중…" : cooldown > 0 ? `${cooldown}초 후 다시 받기` : "인증코드 다시 받기"}
        </Text>
      </Pressable>
    </>
  );
}

function NewPasswordStep({ verificationToken, onBack, onDone }: { verificationToken: string; onBack: () => void; onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!pw.trim()) {
      setError("새 비밀번호를 입력해 주세요.");
      return;
    }
    if (pw !== pwConfirm) {
      setError("비밀번호가 서로 다릅니다.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await resetPassword(verificationToken, pw);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "비밀번호 재설정에 실패했습니다. 처음부터 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <BackRow onBack={onBack} />
      <Text style={[{ fontFamily: font }, { fontSize: 22, fontWeight: "800", color: onVideo.text }]}>새 비밀번호 설정</Text>
      <Text style={[{ fontFamily: font }, { fontSize: 13.5, color: onVideo.muted }]}>인증 완료</Text>

      <Input dark label="새 비밀번호" value={pw} onChangeText={setPw} placeholder="••••••••" secureTextEntry />
      <Input dark label="새 비밀번호 확인" value={pwConfirm} onChangeText={setPwConfirm} placeholder="••••••••" secureTextEntry />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button variant="primary" size="lg" block disabled={saving} onPress={submit}>
        {saving ? "변경 중…" : "비밀번호 변경"}
      </Button>
    </>
  );
}

function DoneStep({ onBack }: { onBack: () => void }) {
  return (
    <>
      <Text style={[{ fontFamily: font }, { fontSize: 22, fontWeight: "800", color: onVideo.text }]}>비밀번호가 변경되었습니다</Text>
      <Text style={[{ fontFamily: font }, { fontSize: 13.5, color: onVideo.muted, lineHeight: 20 }]}>새 비밀번호로 다시 로그인해 주세요.</Text>
      <Button variant="primary" size="lg" block onPress={onBack}>
        로그인하러 가기
      </Button>
    </>
  );
}

export function FindPasswordScreen({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<"email" | "code" | "password" | "done">("email");
  const [email, setEmail] = useState("");
  const [verificationToken, setVerificationToken] = useState("");

  return (
    <AuthShell>
      <View style={{ gap: 14 }}>
        {step === "email" ? (
          <EmailStep
            onBack={onBack}
            onSent={(value) => {
              setEmail(value);
              setStep("code");
            }}
          />
        ) : null}
        {step === "code" ? (
          <CodeStep
            email={email}
            onBack={() => setStep("email")}
            onVerified={(token) => {
              setVerificationToken(token);
              setStep("password");
            }}
          />
        ) : null}
        {step === "password" ? (
          <NewPasswordStep verificationToken={verificationToken} onBack={() => setStep("code")} onDone={() => setStep("done")} />
        ) : null}
        {step === "done" ? <DoneStep onBack={onBack} /> : null}
      </View>
    </AuthShell>
  );
}
