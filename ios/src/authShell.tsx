/* 로그인·회원가입 공용 배경 — 웹(src/layouts/AuthLayout.jsx)의 캠퍼스 영상 배경을 그대로 옮긴다.
   RN 에 <video> 대응이 없어 expo-video 로 재생한다. 접근성: OS 의 "동작 줄이기"가 켜져 있으면
   자동재생 영상 대신 포스터 정지 이미지를 보여준다(웹의 prefers-reduced-motion 분기와 같다).
   isReduceMotionEnabled() 는 비동기라 응답 전까지는(reduceMotion === null) 포스터만 보여주고
   재생하지 않는다 — 안 그러면 동작 줄이기 기기에서도 응답이 오기 전 한 프레임 영상이 재생된다. */
import { type ReactNode, useEffect, useState } from "react";
import { AccessibilityInfo, Image, KeyboardAvoidingView, Pressable, ScrollView, Text, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import Svg, { Path, Rect } from "react-native-svg";
import { LogoMark } from "./ui";
import { font } from "./theme";

const FILL = { position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0 };

export function AuthShell({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  // WCAG 2.2.2 — 5초 넘게 저절로 움직이는 배경은 멈출 수단이 있어야 한다(웹과 같은 요건).
  const [paused, setPaused] = useState(false);
  const showVideo = reduceMotion === false;

  const player = useVideoPlayer(require("../assets/campus-hero.mp4"), (p) => {
    p.loop = true;
    p.muted = true;
  });
  useEffect(() => {
    if (showVideo && !paused) player.play();
    else player.pause();
  }, [player, showVideo, paused]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0a1a" }}>
      {showVideo ? (
        <VideoView player={player} nativeControls={false} contentFit="cover" style={[FILL, { pointerEvents: "none" }]} />
      ) : (
        <Image source={require("../assets/campus-hero.jpg")} style={FILL} resizeMode="cover" />
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

      {showVideo ? (
        <Pressable
          onPress={() => setPaused((p) => !p)}
          accessibilityRole="button"
          accessibilityLabel={paused ? "배경 영상 재생" : "배경 영상 멈추기"}
          style={{
            position: "absolute",
            right: 24,
            bottom: 24,
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,.55)",
            backgroundColor: "rgba(0,0,0,.42)",
          }}
        >
          <Svg width={12} height={12} viewBox="0 0 12 12" fill="rgba(255,255,255,.9)">
            {paused ? (
              <Path d="M3 1l8 5-8 5z" />
            ) : (
              <>
                <Rect x={2} y={1} width={3} height={10} />
                <Rect x={7} y={1} width={3} height={10} />
              </>
            )}
          </Svg>
        </Pressable>
      ) : null}
    </View>
  );
}
