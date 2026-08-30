/* 로그인. 웹(src/pages/web/LoginScreen.jsx)과 필드·문구·이동 링크를 맞춘다 — 아이디+비밀번호만,
   학부 선택은 회원가입에만 있다(이전 버전의 학부 선택 입력은 웹에 없는 필드라 걷어냈다).
   흰 카드는 웹과 같이 뺐다 — 폼이 영상 배경 위에 직접 앉는다(theme 의 onVideo 팔레트). */
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AuthShell } from "../authShell";
import { Button, Input } from "../ui";
import { colors, font, onVideo, radius } from "../theme";
import { ApiError, login } from "../api";

export function LoginScreen({
  deepTitle,
  onLogin,
  onSignup,
  onFindId,
  onFindPassword,
}: {
  deepTitle?: string;
  onLogin: () => void | Promise<void>;
  onSignup: () => void;
  onFindId: () => void;
  onFindPassword: () => void;
}) {
  const [sid, setSid] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!sid.trim() || !pw.trim()) {
      setError("아이디와 비밀번호를 입력해 주세요.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(sid, pw);
      await onLogin();
    } catch (e) {
      // 정지(403)는 아이디·비밀번호가 둘 다 맞아야 나오는 응답이라 사유를 보여줘도
      // 계정 존재 여부가 새지 않는다 - 웹 LoginScreen.jsx 와 같은 예외.
      if (e instanceof ApiError && e.status === 403 && e.body?.detail) {
        setError(`계정이 정지되었습니다: ${e.body.detail}`);
      } else {
        setError(e instanceof Error ? e.message : "로그인에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <View style={{ gap: 14 }}>
        {deepTitle ? (
          <View style={{ backgroundColor: colors.indigo[50], borderWidth: 1, borderStyle: "dashed", borderColor: colors.indigo[200], borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: 14, gap: 6 }}>
            <Text style={[{ fontFamily: font }, { fontSize: 11, fontWeight: "800", color: colors.indigo[600], letterSpacing: 0.44 }]}>에타 공유 링크로 접속</Text>
            <Text style={[{ fontFamily: font }, { fontSize: 13.5, fontWeight: "700", color: colors.strong, lineHeight: 19.6 }]}>{deepTitle}</Text>
            <Text style={[{ fontFamily: font }, { fontSize: 12, color: colors.indigo[700], fontWeight: "600", lineHeight: 18 }]}>로그인하면 이 건의에 바로 공감할 수 있습니다.</Text>
          </View>
        ) : null}

        <Text style={[{ fontFamily: font }, { fontSize: 22, fontWeight: "800", color: onVideo.text }]}>로그인</Text>

        <Input dark label="아이디" value={sid} onChangeText={setSid} placeholder="아이디를 입력하세요" />
        <Input dark label="비밀번호" value={pw} onChangeText={setPw} placeholder="••••••••" secureTextEntry />
        {error ? (
          <Text accessibilityRole="alert" style={[{ fontFamily: font }, { fontSize: 13, fontWeight: "600", color: onVideo.danger }]}>{error}</Text>
        ) : null}
        <Button variant="primary" size="lg" block disabled={loading} onPress={submit}>
          {loading ? "로그인 중…" : deepTitle ? "로그인하고 공감하기" : "로그인"}
        </Button>

        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10 }}>
          <Pressable onPress={onFindId} accessibilityRole="button">
            <Text style={[{ fontFamily: font }, { fontSize: 12.5, fontWeight: "600", color: onVideo.muted }]}>아이디 찾기</Text>
          </Pressable>
          <Text style={{ color: onVideo.border }}>|</Text>
          <Pressable onPress={onFindPassword} accessibilityRole="button">
            <Text style={[{ fontFamily: font }, { fontSize: 12.5, fontWeight: "600", color: onVideo.muted }]}>비밀번호 찾기</Text>
          </Pressable>
        </View>

        <Pressable onPress={onSignup} accessibilityRole="button" style={{ alignItems: "center" }}>
          <Text style={[{ fontFamily: font }, { fontSize: 13.5, color: onVideo.muted }]}>
            아직 계정이 없으신가요? <Text style={{ color: onVideo.link, fontWeight: "700" }}>회원가입</Text>
          </Text>
        </Pressable>

        <Text style={[{ fontFamily: font }, { textAlign: "center", fontSize: 12, color: onVideo.muted, lineHeight: 18 }]}>
          재학생 인증을 통해 당신의 목소리를 들려주세요
        </Text>
      </View>
    </AuthShell>
  );
}
