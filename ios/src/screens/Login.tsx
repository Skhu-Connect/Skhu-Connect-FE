/* 로그인. 웹(src/pages/web/LoginScreen.jsx)과 필드·문구·이동 링크를 맞춘다 — 아이디+비밀번호만,
   학부 선택은 회원가입에만 있다(이전 버전의 학부 선택 입력은 웹에 없는 필드라 걷어냈다). */
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AuthShell } from "../authShell";
import { Button, Input } from "../ui";
import { colors, font, radius, shadow } from "../theme";

export function LoginScreen({ deepTitle, onLogin, onSignup }: { deepTitle?: string; onLogin: () => void; onSignup: () => void }) {
  const [sid, setSid] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!sid.trim() || !pw.trim()) {
      setError("아이디와 비밀번호를 입력해 주세요.");
      return;
    }
    setError("");
    onLogin();
  };

  return (
    <AuthShell>
      <View style={[{ backgroundColor: "#fff", borderRadius: 24, paddingVertical: 22, paddingHorizontal: 20, gap: 14 }, shadow.lg]}>
        {deepTitle ? (
          <View style={{ backgroundColor: colors.indigo[50], borderWidth: 1, borderStyle: "dashed", borderColor: colors.indigo[200], borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: 14, gap: 6 }}>
            <Text style={[{ fontFamily: font }, { fontSize: 11, fontWeight: "800", color: colors.indigo[600], letterSpacing: 0.44 }]}>에타 공유 링크로 접속</Text>
            <Text style={[{ fontFamily: font }, { fontSize: 13.5, fontWeight: "700", color: colors.strong, lineHeight: 19.6 }]}>{deepTitle}</Text>
            <Text style={[{ fontFamily: font }, { fontSize: 12, color: colors.indigo[700], fontWeight: "600", lineHeight: 18 }]}>로그인하면 이 건의에 바로 공감할 수 있습니다.</Text>
          </View>
        ) : null}

        <Text style={[{ fontFamily: font }, { fontSize: 22, fontWeight: "800", color: colors.strong }]}>로그인</Text>

        <Input label="아이디" value={sid} onChangeText={setSid} placeholder="아이디를 입력하세요" />
        <Input label="비밀번호" value={pw} onChangeText={setPw} placeholder="••••••••" secureTextEntry />
        {error ? (
          <Text accessibilityRole="alert" style={[{ fontFamily: font }, { fontSize: 13, fontWeight: "600", color: colors.danger }]}>{error}</Text>
        ) : null}
        <Button variant="primary" size="lg" block onPress={submit}>
          {deepTitle ? "로그인하고 공감하기" : "로그인"}
        </Button>

        <Pressable onPress={onSignup} accessibilityRole="button" style={{ alignItems: "center" }}>
          <Text style={[{ fontFamily: font }, { fontSize: 13.5, color: colors.muted }]}>
            아직 계정이 없으신가요? <Text style={{ color: colors.indigo[600], fontWeight: "700" }}>회원가입</Text>
          </Text>
        </Pressable>

        <Text style={[{ fontFamily: font }, { textAlign: "center", fontSize: 12, color: colors.muted, lineHeight: 18 }]}>
          재학생 인증을 통해 당신의 목소리를 들려주세요
        </Text>
      </View>
    </AuthShell>
  );
}
