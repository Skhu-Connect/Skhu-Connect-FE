/* 아이디 찾기. 백엔드에 loginId 조회/변경 엔드포인트가 없어(docs/api-spec.md) 화면만 먼저 만든다 —
   ponytail: 학교 이메일 인증·비밀번호 확인 두 방식 모두 화면만 두고, 엔드포인트가 생기면 각 단계의
   제출을 실제 API 호출로 바꾼다. 웹 FindIdScreen.jsx 와 단계·문구를 맞춘다. */
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
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

  const submit = () => {
    const value = email.trim();
    if (!value || !value.includes("@")) {
      setError("가입한 학교 이메일을 입력해 주세요.");
      return;
    }
    setError("");
    onSent(value);
  };

  return (
    <>
      <Input dark label="학교 이메일" value={email} onChangeText={setEmail} placeholder="예: 20260000@office.skhu.ac.kr" keyboardType="email-address" />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button variant="primary" size="lg" block onPress={submit}>인증코드 받기</Button>
    </>
  );
}

function CodeStep({ email, onBack, onVerified }: { email: string; onBack: () => void; onVerified: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const confirm = () => {
    if (!/^\d{6}$/.test(code.trim())) {
      setError("6자리 인증코드를 입력해 주세요.");
      return;
    }
    setError("");
    onVerified();
  };

  return (
    <>
      <BackRow onBack={onBack} />
      <Text style={[{ fontFamily: font }, { fontSize: 22, fontWeight: "800", color: onVideo.text }]}>인증코드 확인</Text>
      <Text style={[{ fontFamily: font }, { fontSize: 13.5, color: onVideo.muted }]}>{email} 로 보낸 6자리 코드를 입력하세요.</Text>

      <Input dark label="인증코드" value={code} onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))} placeholder="123456" keyboardType="number-pad" />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button variant="primary" size="lg" block onPress={confirm}>확인</Button>
    </>
  );
}

function PasswordStep({ onVerified }: { onVerified: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!email.trim() || !email.includes("@")) {
      setError("가입한 학교 이메일을 입력해 주세요.");
      return;
    }
    if (!password.trim()) {
      setError("비밀번호를 입력해 주세요.");
      return;
    }
    setError("");
    onVerified();
  };

  return (
    <>
      <Input dark label="학교 이메일" value={email} onChangeText={setEmail} placeholder="예: 20260000@office.skhu.ac.kr" keyboardType="email-address" />
      <Input dark label="비밀번호" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button variant="primary" size="lg" block onPress={submit}>확인</Button>
    </>
  );
}

function NoticeStep({ onBack }: { onBack: () => void }) {
  return (
    <>
      <Text style={[{ fontFamily: font }, { fontSize: 22, fontWeight: "800", color: onVideo.text }]}>확인해 드릴게요</Text>
      <Text style={[{ fontFamily: font }, { fontSize: 13.5, color: onVideo.muted, lineHeight: 20 }]}>
        본인 확인이 완료됐어요. 아이디 안내 기능은 아직 준비 중입니다 — 빠른 시일 내 제공하겠습니다.
      </Text>
      <Button variant="primary" size="lg" block onPress={onBack}>로그인으로 돌아가기</Button>
    </>
  );
}

export function FindIdScreen({ onBack }: { onBack: () => void }) {
  const [method, setMethod] = useState<Method>("email");
  const [step, setStep] = useState<"input" | "code" | "done">("input");
  const [email, setEmail] = useState("");

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
              <PasswordStep onVerified={() => setStep("done")} />
            )}

            <Pressable onPress={onBack} accessibilityRole="button" style={{ alignItems: "center" }}>
              <Text style={[{ fontFamily: font }, { fontSize: 13, fontWeight: "600", color: onVideo.muted }]}>로그인으로 돌아가기</Text>
            </Pressable>
          </>
        ) : null}
        {step === "code" ? (
          <CodeStep email={email} onBack={() => setStep("input")} onVerified={() => setStep("done")} />
        ) : null}
        {step === "done" ? <NoticeStep onBack={onBack} /> : null}
      </View>
    </AuthShell>
  );
}
