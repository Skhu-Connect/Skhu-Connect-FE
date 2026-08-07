/* 로그인·회원가입 공용 배경 — 웹(src/layouts/AuthLayout.jsx)의 캠퍼스 영상 배경을 그대로 옮긴다.
   RN 에 <video> 대응이 없어 expo-video 로 재생한다. 접근성: OS 의 "동작 줄이기"가 켜져 있으면
   자동재생 영상 대신 포스터 정지 이미지를 보여준다(웹의 prefers-reduced-motion 분기와 같다). */
import { type ReactNode, useEffect, useState } from "react";
import { AccessibilityInfo, Image, KeyboardAvoidingView, ScrollView, Text, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { LogoMark } from "./ui";
import { font } from "./theme";

const FILL = { position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0 };

export function AuthShell({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  const player = useVideoPlayer(require("../assets/campus-hero.mp4"), (p) => {
    p.loop = true;
    p.muted = true;
  });
  useEffect(() => {
    if (reduceMotion) player.pause();
    else player.play();
  }, [player, reduceMotion]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0a1a" }}>
      {reduceMotion ? (
        <Image source={require("../assets/campus-hero.jpg")} style={FILL} resizeMode="cover" />
      ) : (
        <VideoView player={player} nativeControls={false} contentFit="cover" style={FILL} pointerEvents="none" />
      )}
      {/* 영상 위 스크림 — 웹과 같은 톤(rgba(8,8,22,.6) 근처)으로 흰 카드 없이도 글자 대비를 낸다. */}
      <View style={[FILL, { backgroundColor: "rgba(10,10,26,.55)" }]} />

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 22, paddingVertical: 20 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={{ alignItems: "center", gap: 10, marginBottom: 22 }}>
            <LogoMark />
            <View style={{ alignItems: "center" }}>
              <Text style={[{ fontFamily: font }, { color: "#fff", fontWeight: "800", fontSize: 22, letterSpacing: -0.22 }]}>성공잇다</Text>
              <Text style={[{ fontFamily: font }, { color: "rgba(255,255,255,.72)", fontSize: 10.5, fontWeight: "700", letterSpacing: 1.68, marginTop: 4 }]}>성공회대학교</Text>
            </View>
          </View>

          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
