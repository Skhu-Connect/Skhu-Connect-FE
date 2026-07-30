import { useState } from "react";
import { Image, KeyboardAvoidingView, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Button, Input } from "../ui";
import { colors, font, gradient, radius, shadow } from "../theme";

/* 로고 마크 — 앱 아이콘과 같은 브랜드 마크다. 화면마다 다르게 그리지 않는다.
   assets/icon.png(1024px) 이 아니라 별도 256px 에셋을 쓴다 — 66pt 뷰에 1024px 을 넣으면
   4MB 로 디코드된다. 코너는 투명이라 borderRadius 가 그대로 먹는다. */
export function LogoMark({ size = 66 }: { size?: number }) {
  return (
    <Image
      source={require("../../assets/logo-mark.png")}
      style={{ width: size, height: size, borderRadius: 20 * (size / 66) }}
      accessibilityIgnoresInvertColors
    />
  );
}

export function LoginScreen({ deepTitle, onLogin }: { deepTitle?: string; onLogin: () => void }) {
  const [sid, setSid] = useState("202214139");
  const [pw, setPw] = useState("password");

  return (
    /* LinearGradient 는 서드파티라 NativeWind 의 className 이 닿지 않는다 — style 로 준다. */
    <LinearGradient {...gradient.hero} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        {/* 학번 필드는 number-pad 라 return 키가 없다. 빈 곳 탭(keyboardShouldPersistTaps="handled")에 더해 드래그로도 닫는다. */}
        <ScrollView contentContainerClassName="flex-grow justify-center px-[22px] py-5" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View className="items-center gap-[10px] mb-[22px]">
            <LogoMark />
            <View className="items-center">
              <Text style={[{ fontFamily: font }, { color: "#fff", fontWeight: "800", fontSize: 22, letterSpacing: -0.22 }]}>청원시스템</Text>
              <Text style={[{ fontFamily: font }, { color: "rgba(255,255,255,.72)", fontSize: 10.5, fontWeight: "700", letterSpacing: 1.68, marginTop: 4 }]}>SKHU PETITION</Text>
            </View>
          </View>

          <View style={[{ backgroundColor: "#fff", borderRadius: 24, paddingVertical: 22, paddingHorizontal: 20, gap: 14 }, shadow.lg]}>
            {deepTitle ? (
              <View style={{ backgroundColor: colors.indigo[50], borderWidth: 1, borderStyle: "dashed", borderColor: colors.indigo[200], borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: 14, gap: 6 }}>
                <Text style={[{ fontFamily: font }, { fontSize: 11, fontWeight: "800", color: colors.indigo[600], letterSpacing: 0.44 }]}>에타 공유 링크로 접속</Text>
                <Text style={[{ fontFamily: font }, { fontSize: 13.5, fontWeight: "700", color: colors.strong, lineHeight: 19.6 }]}>{deepTitle}</Text>
                <Text style={[{ fontFamily: font }, { fontSize: 12, color: colors.indigo[700], fontWeight: "600", lineHeight: 18 }]}>로그인하면 이 청원에 바로 공감할 수 있습니다.</Text>
              </View>
            ) : null}

            <Input label="학번" value={sid} onChangeText={setSid} placeholder="202214139" keyboardType="number-pad" />
            <Input label="비밀번호" value={pw} onChangeText={setPw} placeholder="••••••••" secureTextEntry />
            <Button variant="primary" size="lg" block onPress={onLogin}>
              {deepTitle ? "로그인하고 공감하기" : "로그인"}
            </Button>

            <Text style={[{ fontFamily: font }, { textAlign: "center", fontSize: 11.5, color: colors.muted, lineHeight: 18.4 }]}>
              종합정보시스템 계정으로 로그인합니다.{"\n"}개인정보는 인증에만 사용되며 청원은 익명 처리됩니다.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
