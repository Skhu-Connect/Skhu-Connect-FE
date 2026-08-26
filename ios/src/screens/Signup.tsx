/* 회원가입. 웹(src/pages/web/SignupScreen.jsx)과 단계·필드·문구·이동 링크를 맞춘다.
   2단계: ① 학교 이메일 인증(발송 → 6자리 코드 확인) ② 아이디·소속 학부·비밀번호 입력.
   실제 SignupRequest 에는 이름 필드가 없다(웹도 이름을 받지 않는다) — 입력 안 받는다.
   흰 카드는 웹과 같이 뺐다 — 폼이 영상 배경 위에 직접 앉는다(theme 의 onVideo 팔레트). */
import { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { AuthShell } from "../authShell";
import { Icon } from "../icons";
import { Button, Input, Select } from "../ui";
import { font, onVideo } from "../theme";
import { confirmSignupCode, listDepartments, sendSignupCode, signup } from "../api";
import { PRIVACY_POLICY_URL, TERMS_URL } from "../legal";

const OUTLOOK_URL = "https://outlook.cloud.microsoft/mail/inbox/?culture=ko-kr&country=kr";
const OUTLOOK_APP_URL = "ms-outlook://emails/inbox";
const TERMS_VERSION = "1.0";

/* 아웃룩 앱이 깔려 있으면 앱의 받은편지함으로, 아니면 인앱 브라우저로 웹 메일함을 연다.
   ponytail: canOpenURL 대신 openURL 실패로 판별한다 — Info.plist 의
   LSApplicationQueriesSchemes 등록이 필요 없다.
   emails/inbox 경로는 MS 공식 문서가 아닌 커뮤니티 확인값이다 — 아웃룩이 경로를
   못 알아들어도 스킴은 등록돼 있어 앱은 열린다(받은편지함 대신 마지막 화면). */
function openOutlook() {
  Linking.openURL(OUTLOOK_APP_URL).catch(() => WebBrowser.openBrowserAsync(OUTLOOK_URL));
}

function ErrorText({ children }: { children: string }) {
  return <Text accessibilityRole="alert" style={[{ fontFamily: font }, { fontSize: 13, fontWeight: "600", color: onVideo.danger }]}>{children}</Text>;
}

function ConsentRow({ checked, label, onToggle, onOpen }: { checked: boolean; label: string; onToggle: () => void; onOpen: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Pressable onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked }} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ width: 18, height: 18, borderWidth: 1.5, borderColor: onVideo.border, borderRadius: 3, alignItems: "center", justifyContent: "center", backgroundColor: checked ? onVideo.link : "transparent" }}>
          {checked ? <Text style={[{ fontFamily: font }, { color: "#fff", fontSize: 12, fontWeight: "800" }]}>✓</Text> : null}
        </View>
        <Text style={[{ fontFamily: font }, { flex: 1, color: onVideo.text, fontSize: 12.5, fontWeight: "700" }]}>{label}</Text>
      </Pressable>
      <Pressable onPress={onOpen} accessibilityRole="link" hitSlop={8}>
        <Text style={[{ fontFamily: font }, { color: onVideo.link, fontSize: 12.5, fontWeight: "700", textDecorationLine: "underline" }]}>보기</Text>
      </Pressable>
    </View>
  );
}

function EmailStep({ onBack, onVerified }: { onBack: () => void; onVerified: (email: string, verificationToken: string) => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const send = async () => {
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
    if (!termsAgreed || !privacyAgreed) {
      setError("이용약관과 개인정보처리방침에 모두 동의해 주세요.");
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
      <View style={{ gap: 10 }}>
        <ConsentRow
          checked={termsAgreed}
          label="[필수] 이용약관(EULA) 및 커뮤니티 정책에 동의합니다."
          onToggle={() => setTermsAgreed((agreed) => !agreed)}
          onOpen={() => WebBrowser.openBrowserAsync(TERMS_URL)}
        />
        <ConsentRow
          checked={privacyAgreed}
          label="[필수] 개인정보처리방침에 동의합니다."
          onToggle={() => setPrivacyAgreed((agreed) => !agreed)}
          onOpen={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
        />
      </View>
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
        <Pressable onPress={openOutlook} accessibilityRole="link">
          <Text style={[{ fontFamily: font }, { fontSize: 13, fontWeight: "700", color: onVideo.link }]}>인증번호 바로 확인하기</Text>
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
