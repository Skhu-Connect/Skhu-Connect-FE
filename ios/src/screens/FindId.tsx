/* 아이디 찾기. 학교 이메일 인증 또는 이메일+현재 비밀번호 확인 뒤 loginId를 보여준다. */
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ApiError, confirmLoginIdFindCode, findLoginIdByEmail, findLoginIdByPassword, sendLoginIdFindCode } from "../api";
import { AuthShell } from "../authShell";
import { Icon } from "../icons";
import { Button, Input } from "../ui";
import { font, onVideo } from "../theme";

type Method = "email" | "password";

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

function MethodToggle({ method, onChange }: { method: Method; onChange: (m: Method) => void }) {
  const options: { key: Method; label: string }[] = [
    { key: "email", label: "학교 이메일 인증" },
    { key: "password", label: "비밀번호 확인" },
  ];
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {options.map((o) => {
        const active = o.key === method;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              borderWidth: active ? 1.5 : 1,
              borderColor: active ? onVideo.borderFocus : onVideo.border,
              backgroundColor: active ? "rgba(99,102,241,.22)" : onVideo.surface,
              alignItems: "center",
            }}
          >
            <Text style={[{ fontFamily: font }, { fontSize: 13, fontWeight: "700", color: active ? "#fff" : onVideo.muted }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const value = email.trim();
    if (!value || !value.includes("@")) {
      setError("가입한 학교 이메일을 입력해 주세요.");
      return;
    }
    setError("");
    setSending(true);
    try {
      await sendLoginIdFindCode(value);
      onSent(value);
    } catch {
      setError("인증코드 발송에 실패했습니다. 가입한 이메일인지 확인해 주세요.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Input dark label="학교 이메일" value={email} onChangeText={setEmail} placeholder="예: 20260000@office.skhu.ac.kr" keyboardType="email-address" />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button variant="primary" size="lg" block disabled={sending} onPress={submit}>{sending ? "발송 중…" : "인증코드 받기"}</Button>
    </>
  );
}

function CodeStep({ email, onBack, onVerified }: { email: string; onBack: () => void; onVerified: (loginId: string) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const confirm = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      setError("6자리 인증코드를 입력해 주세요.");
      return;
    }
    setError("");
    setChecking(true);
    try {
      const token = await confirmLoginIdFindCode(email, code.trim());
      onVerified(await findLoginIdByEmail(token));
    } catch (e) {
      setError(e instanceof ApiError && e.status === 409 ? "이미 사용한 인증입니다. 인증코드를 다시 받아 주세요." : e instanceof ApiError && e.status === 410 ? "인증이 만료되었습니다. 인증코드를 다시 받아 주세요." : "인증코드가 올바르지 않습니다.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <BackRow onBack={onBack} />
      <Text style={[{ fontFamily: font }, { fontSize: 22, fontWeight: "800", color: onVideo.text }]}>인증코드 확인</Text>
      <Text style={[{ fontFamily: font }, { fontSize: 13.5, color: onVideo.muted }]}>{email} 로 보낸 6자리 코드를 입력하세요.</Text>

      <Input dark label="인증코드" value={code} onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))} placeholder="123456" keyboardType="number-pad" />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button variant="primary" size="lg" block disabled={checking} onPress={confirm}>{checking ? "확인 중…" : "확인"}</Button>
    </>
  );
}

function PasswordStep({ onVerified }: { onVerified: (loginId: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const submit = async () => {
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
      onVerified(await findLoginIdByPassword(email.trim(), password));
    } catch (e) {
      setError(e instanceof ApiError && e.status === 401 ? "이메일 또는 비밀번호가 올바르지 않습니다." : "아이디를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <Input dark label="학교 이메일" value={email} onChangeText={setEmail} placeholder="예: 20260000@office.skhu.ac.kr" keyboardType="email-address" />
      <Input dark label="비밀번호" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button variant="primary" size="lg" block disabled={checking} onPress={submit}>{checking ? "확인 중…" : "확인"}</Button>
    </>
  );
}

function NoticeStep({ loginId, onBack }: { loginId: string; onBack: () => void }) {
  return (
    <>
      <Text style={[{ fontFamily: font }, { fontSize: 22, fontWeight: "800", color: onVideo.text }]}>아이디를 찾았어요</Text>
      <Text style={[{ fontFamily: font }, { fontSize: 13.5, color: onVideo.muted, lineHeight: 20 }]}>
        회원님의 아이디는 <Text style={{ color: onVideo.text, fontWeight: "800" }}>{loginId}</Text>입니다.
      </Text>
      <Button variant="primary" size="lg" block onPress={onBack}>로그인으로 돌아가기</Button>
    </>
  );
}

export function FindIdScreen({ onBack }: { onBack: () => void }) {
  const [method, setMethod] = useState<Method>("email");
  const [step, setStep] = useState<"input" | "code" | "done">("input");
  const [email, setEmail] = useState("");
  const [loginId, setLoginId] = useState("");

  return (
    <AuthShell>
      <View style={{ gap: 14 }}>
        {step === "input" ? (
          <>
            <Text style={[{ fontFamily: font }, { fontSize: 22, fontWeight: "800", color: onVideo.text }]}>아이디 찾기</Text>
            <Text style={[{ fontFamily: font }, { fontSize: 13.5, color: onVideo.muted }]}>
              학교 이메일 인증 또는 비밀번호 확인으로 본인 확인 후 아이디를 알려드려요.
            </Text>

            <MethodToggle method={method} onChange={setMethod} />

            {method === "email" ? (
              <EmailStep onSent={(value) => { setEmail(value); setStep("code"); }} />
            ) : (
              <PasswordStep onVerified={(id) => { setLoginId(id); setStep("done"); }} />
            )}

            <Pressable onPress={onBack} accessibilityRole="button" style={{ alignItems: "center" }}>
              <Text style={[{ fontFamily: font }, { fontSize: 13, fontWeight: "600", color: onVideo.muted }]}>로그인으로 돌아가기</Text>
            </Pressable>
          </>
        ) : null}
        {step === "code" ? (
          <CodeStep email={email} onBack={() => setStep("input")} onVerified={(id) => { setLoginId(id); setStep("done"); }} />
        ) : null}
        {step === "done" ? <NoticeStep loginId={loginId} onBack={onBack} /> : null}
      </View>
    </AuthShell>
  );
}
