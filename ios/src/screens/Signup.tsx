/* 회원가입. 웹(src/pages/web/SignupScreen.jsx)과 단계·필드·문구·이동 링크를 맞춘다.
   2단계: ① 학교 이메일 인증 ② 아이디·이름·소속 학부·비밀번호 입력. 목 단계라 실제 메일
   발송·검증·중복 학번 확인은 없다 — 웹과 같은 한계다.
   흰 카드는 웹과 같이 뺐다 — 폼이 영상 배경 위에 직접 앉는다(theme 의 onVideo 팔레트). */
import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { AuthShell } from "../authShell";
import { Icon } from "../icons";
import { Button, Input, Select } from "../ui";
import { font, onVideo } from "../theme";
import { DEPARTMENTS } from "../data";

const PORTAL_URL = "https://portal.skhu.ac.kr/html/main/index.html?portalPage=portal_main";

function ErrorText({ children }: { children: string }) {
  return <Text accessibilityRole="alert" style={[{ fontFamily: font }, { fontSize: 13, fontWeight: "600", color: onVideo.danger }]}>{children}</Text>;
}

function EmailStep({ onBack, onVerified }: { onBack: () => void; onVerified: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const submit = () => {
    const value = email.trim();
    if (!value || !value.includes("@")) {
      setError("학교 이메일을 입력해 주세요.");
      return;
    }
    setError("");
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      onVerified(value);
    }, 400);
  };

  return (
    <>
      <Text style={[{ fontFamily: font }, { fontSize: 22, fontWeight: "800", color: onVideo.text }]}>학교 인증</Text>
      <Text style={[{ fontFamily: font }, { fontSize: 13.5, color: onVideo.muted }]}>학교 이메일로 재학생 여부를 확인해요.</Text>

      <Input dark label="학교 이메일" value={email} onChangeText={setEmail} placeholder="예: 20260000@skhu.ac.kr" keyboardType="email-address" />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button variant="primary" size="lg" block disabled={checking} onPress={submit}>
        {checking ? "확인 중…" : "인증하기"}
      </Button>

      <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 12 }}>
        <Pressable onPress={onBack} accessibilityRole="button">
          <Text style={[{ fontFamily: font }, { fontSize: 13, fontWeight: "600", color: onVideo.muted }]}>로그인으로 돌아가기</Text>
        </Pressable>
        <Text style={{ color: onVideo.border }}>|</Text>
        <Pressable onPress={() => Linking.openURL(PORTAL_URL)} accessibilityRole="link">
          <Text style={[{ fontFamily: font }, { fontSize: 13, fontWeight: "700", color: onVideo.link }]}>학교 이메일을 모르시나요?</Text>
        </Pressable>
      </View>
    </>
  );
}

function AccountStep({ email, onBack, onSignup }: { email: string; onBack: () => void; onSignup: () => void }) {
  const [sid, setSid] = useState("");
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [pw, setPw] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = () => {
    if (!sid.trim() || !name.trim() || !pw.trim()) {
      setError("아이디·이름·비밀번호를 입력해 주세요.");
      return;
    }
    if (!dept) {
      setError("소속 학부를 선택해 주세요.");
      return;
    }
    if (pw !== pwConfirm) {
      setError("비밀번호가 서로 다릅니다.");
      return;
    }
    setError("");
    setSaving(true);
    onSignup();
  };

  return (
    <>
      <Pressable onPress={onBack} accessibilityRole="button" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Icon name="arrowLeft" size={16} color={onVideo.muted} />
        <Text style={[{ fontFamily: font }, { fontSize: 13, fontWeight: "600", color: onVideo.muted }]}>이전</Text>
      </Pressable>
      <Text style={[{ fontFamily: font }, { fontSize: 22, fontWeight: "800", color: onVideo.text }]}>계정 정보 입력</Text>
      <Text style={[{ fontFamily: font }, { fontSize: 13.5, color: onVideo.muted }]}>{email} 인증 완료</Text>

      <Input dark label="아이디" value={sid} onChangeText={setSid} placeholder="아이디를 입력하세요" />
      <Input dark label="이름" value={name} onChangeText={setName} placeholder="이름을 입력하세요" />
      <Select dark label="소속 학부" options={DEPARTMENTS} value={dept} onChange={setDept} placeholder="학부를 선택하세요" />
      <Input dark label="비밀번호" value={pw} onChangeText={setPw} placeholder="••••••••" secureTextEntry />
      <Input dark label="비밀번호 확인" value={pwConfirm} onChangeText={setPwConfirm} placeholder="••••••••" secureTextEntry />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button variant="primary" size="lg" block disabled={saving} onPress={submit}>
        회원가입
      </Button>
    </>
  );
}

export function SignupScreen({ onBack, onSignup }: { onBack: () => void; onSignup: () => void }) {
  const [email, setEmail] = useState<string | null>(null);

  return (
    <AuthShell>
      <View style={{ gap: 14 }}>
        {email == null ? (
          <EmailStep onBack={onBack} onVerified={setEmail} />
        ) : (
          <AccountStep email={email} onBack={() => setEmail(null)} onSignup={onSignup} />
        )}
      </View>
    </AuthShell>
  );
}
