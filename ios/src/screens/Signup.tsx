/* 회원가입. 웹(src/pages/web/SignupScreen.jsx)과 단계·필드·문구·이동 링크를 맞춘다.
   2단계: ① 학교 이메일 인증(발송 → 6자리 코드 확인) ② 아이디·소속 학부·비밀번호 입력.
   실제 SignupRequest 에는 이름 필드가 없다(웹도 이름을 받지 않는다) — 입력 안 받는다.
   흰 카드는 웹과 같이 뺐다 — 폼이 영상 배경 위에 직접 앉는다(theme 의 onVideo 팔레트). */
import { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { AuthShell } from "../authShell";
import { Icon } from "../icons";
import { Button, Input, Select } from "../ui";
import { font, onVideo } from "../theme";
import { confirmSignupCode, listDepartments, sendSignupCode, signup } from "../api";

const PORTAL_URL = "https://portal.skhu.ac.kr/html/main/index.html?portalPage=portal_main";
const TERMS_URL = "https://petition-system-two.vercel.app/terms-of-service.html";
const PRIVACY_POLICY_URL = "https://petition-system-two.vercel.app/privacy-policy.html";
const TERMS_VERSION = "1.0";

function ErrorText({ children }: { children: string }) {
  return <Text accessibilityRole="alert" style={[{ fontFamily: font }, { fontSize: 13, fontWeight: "600", color: onVideo.danger }]}>{children}</Text>;
}

function EmailStep({ onBack, onVerified }: { onBack: () => void; onVerified: (email: string, verificationToken: string) => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const value = email.trim();
    if (!value || !value.includes("@")) {
      setError("학교 이메일을 입력해 주세요.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await sendSignupCode(value);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "인증번호 발송에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!code.trim()) {
      setError("인증번호를 입력해 주세요.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const token = await confirmSignupCode(email.trim(), code.trim());
      onVerified(email.trim(), token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "인증번호가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Text style={[{ fontFamily: font }, { fontSize: 22, fontWeight: "800", color: onVideo.text }]}>학교 인증</Text>
      <Text style={[{ fontFamily: font }, { fontSize: 13.5, color: onVideo.muted }]}>학교 이메일로 재학생 여부를 확인해요.</Text>

      <Input dark label="학교 이메일" value={email} onChangeText={setEmail} placeholder="예: 20260000@office.skhu.ac.kr" keyboardType="email-address" />

      {sent ? <Input dark label="인증번호" value={code} onChangeText={setCode} placeholder="6자리 숫자" keyboardType="number-pad" /> : null}
      {error ? <ErrorText>{error}</ErrorText> : null}

      {sent ? (
        <>
          <Button variant="primary" size="lg" block disabled={loading} onPress={confirm}>
            {loading ? "확인 중…" : "인증 확인"}
          </Button>
          <Pressable onPress={send} disabled={loading} accessibilityRole="button" style={{ alignItems: "center" }}>
            <Text style={[{ fontFamily: font }, { fontSize: 13, fontWeight: "600", color: onVideo.muted }]}>인증번호 다시 받기</Text>
          </Pressable>
        </>
      ) : (
        <Button variant="primary" size="lg" block disabled={loading} onPress={send}>
          {loading ? "발송 중…" : "인증번호 발송"}
        </Button>
      )}

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

function AccountStep({ email, verificationToken, onBack, onSignup }: { email: string; verificationToken: string; onBack: () => void; onSignup: () => void | Promise<void> }) {
  const [sid, setSid] = useState("");
  const [dept, setDept] = useState("");
  const [pw, setPw] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  useEffect(() => {
    listDepartments()
      .then(setDepartments)
      .catch(() => setError("학부 목록을 불러오지 못했습니다."));
  }, []);

  const submit = async () => {
    if (!sid.trim() || !pw.trim()) {
      setError("아이디·비밀번호를 입력해 주세요.");
      return;
    }
    const department = departments.find((d) => d.name === dept);
    if (!department) {
      setError("소속 학부를 선택해 주세요.");
      return;
    }
    if (pw !== pwConfirm) {
      setError("비밀번호가 서로 다릅니다.");
      return;
    }
    if (!termsAgreed) {
      setError("회원가입을 진행하려면 이용약관에 동의해주세요.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await signup({ loginId: sid.trim(), password: pw, departmentId: department.id, verificationToken, termsAgreed: true, termsVersion: TERMS_VERSION });
      await onSignup();
    } catch (e) {
      setError(e instanceof Error ? e.message : "회원가입에 실패했습니다.");
    } finally {
      setSaving(false);
    }
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
      <Select dark label="소속 학부" options={departments.map((d) => d.name)} value={dept} onChange={setDept} placeholder="학부를 선택하세요" />
      <Input dark label="비밀번호" value={pw} onChangeText={setPw} placeholder="••••••••" secureTextEntry />
      <Input dark label="비밀번호 확인" value={pwConfirm} onChangeText={setPwConfirm} placeholder="••••••••" secureTextEntry />
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable onPress={() => setTermsAgreed((agreed) => !agreed)} accessibilityRole="checkbox" accessibilityState={{ checked: termsAgreed }} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 18, height: 18, borderWidth: 1.5, borderColor: onVideo.border, borderRadius: 3, alignItems: "center", justifyContent: "center", backgroundColor: termsAgreed ? onVideo.link : "transparent" }}>
              {termsAgreed ? <Text style={[{ fontFamily: font }, { color: "#fff", fontSize: 12, fontWeight: "800" }]}>✓</Text> : null}
            </View>
            <Text style={[{ fontFamily: font }, { flex: 1, color: onVideo.text, fontSize: 13, fontWeight: "700" }]}>[필수] 이용약관에 동의합니다.</Text>
          </Pressable>
          <Pressable
            onPress={() => setTermsOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityState={{ expanded: termsOpen }}
            accessibilityLabel={termsOpen ? "약관 및 개인정보 처리 안내 접기" : "약관 및 개인정보 처리 안내 펼치기"}
            hitSlop={8}
            style={{ padding: 4, transform: [{ rotate: termsOpen ? "180deg" : "0deg" }] }}
          >
            <Icon name="chevronDown" size={16} color={onVideo.muted} />
          </Pressable>
        </View>
        {termsOpen ? (
          <View style={{ gap: 8 }}>
            <Pressable onPress={() => Linking.openURL(TERMS_URL)} accessibilityRole="link">
              <Text style={[{ fontFamily: font }, { color: onVideo.link, fontSize: 13, fontWeight: "700", textDecorationLine: "underline" }]}>이용약관 보기</Text>
            </Pressable>
            <View style={{ gap: 4 }}>
              <Text style={[{ fontFamily: font }, { color: onVideo.text, fontSize: 13, fontWeight: "700" }]}>개인정보 처리 안내</Text>
              <Text style={[{ fontFamily: font }, { color: onVideo.muted, fontSize: 12.5, lineHeight: 19 }]}>성공잇다는 회원가입 및 서비스 제공을 위해 학교 이메일, 로그인 ID, 소속 학과 등의 정보를 처리합니다.</Text>
              <Text style={[{ fontFamily: font }, { color: onVideo.muted, fontSize: 12.5, lineHeight: 19 }]}>해당 정보는 학교 구성원 확인, 계정 생성·관리 및 서비스 제공을 위해 이용됩니다.</Text>
              <Text style={[{ fontFamily: font }, { color: onVideo.muted, fontSize: 12.5, lineHeight: 19 }]}>자세한 개인정보 처리 항목, 이용 목적 및 보유 정책은 개인정보처리방침에서 확인할 수 있습니다.</Text>
              <Pressable onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} accessibilityRole="link">
                <Text style={[{ fontFamily: font }, { color: onVideo.link, fontSize: 13, fontWeight: "700", textDecorationLine: "underline" }]}>개인정보처리방침 보기</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button variant="primary" size="lg" block disabled={saving} onPress={submit}>
        {saving ? "가입 중…" : "회원가입"}
      </Button>
    </>
  );
}

export function SignupScreen({ onBack, onSignup }: { onBack: () => void; onSignup: () => void }) {
  const [verified, setVerified] = useState<{ email: string; token: string } | null>(null);

  return (
    <AuthShell>
      <View style={{ gap: 14 }}>
        {verified == null ? (
          <EmailStep onBack={onBack} onVerified={(email, token) => setVerified({ email, token })} />
        ) : (
          <AccountStep email={verified.email} verificationToken={verified.token} onBack={() => setVerified(null)} onSignup={onSignup} />
        )}
      </View>
    </AuthShell>
  );
}
