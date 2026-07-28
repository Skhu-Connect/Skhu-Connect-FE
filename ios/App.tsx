import "./global.css";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";
import { gradient, shadow } from "./src/theme";

/* 배선 확인용 화면. NativeWind 클래스 · 디자인 토큰 · 그라데이션 · 그림자가
   시뮬레이터에서 실제로 적용되는지 본다. 화면이 붙으면 앱 셸로 교체된다. */
export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-page gap-4">
      <LinearGradient {...gradient.hero} style={{ width: 256, height: 96, borderRadius: 24, alignItems: "center", justifyContent: "center" }}>
        <Text className="text-white font-extrabold text-xl">청원시스템</Text>
      </LinearGradient>
      <View className="bg-card rounded-lg px-5 py-4" style={shadow.sm}>
        <Text className="text-strong font-bold">디자인 토큰 적용 확인</Text>
      </View>
    </View>
  );
}
