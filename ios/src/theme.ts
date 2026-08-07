/* 앱 코드가 쓰는 토큰 진입점. 값은 전부 tokens.js 에 있다 (tailwind.config.js 와 공유하려고 .js 다).
   여기서 하는 일은 그 JS 값에 RN 타입을 입히는 것뿐이다. */
import type { LinearGradientProps } from "expo-linear-gradient";
import { colors, gradient as rawGradient } from "./tokens";

export { colors, font, radius, shadow } from "./tokens";

/* expo-linear-gradient 는 colors 를 최소 2색 튜플로 요구하는데, 순수 JS 객체는 string[] 로 추론된다. */
export const gradient = rawGradient as unknown as Record<"hero" | "mileage", LinearGradientProps>;

/* 인증 화면(영상 배경) 전용 팔레트 — 웹 AuthLayout 의 LIGHT_ON_VIDEO 토큰 교체와 같다.
   ui.tsx(DS 프리미티브)와 authShell·Login·Signup(일반 텍스트)이 같은 값을 쓰도록 여기 하나에 둔다
   — authShell 에 두면 ui.tsx 가 그걸 import 할 때 순환 참조가 생긴다(ui.tsx 는 authShell 이 쓰는
   LogoMark 를 내보낸다). muted 는 .72 로는 사진 위 AA 대비가 안 나와 .84 로 올린 값(웹과 동일 근거). */
export const onVideo = {
  text: "#fff",
  muted: "rgba(255,255,255,.84)",
  border: "rgba(255,255,255,.42)",
  borderFocus: "#fff",
  surface: "rgba(255,255,255,.16)",
  link: colors.indigo[200],
  danger: "#ff8a92",
};
