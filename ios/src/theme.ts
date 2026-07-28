/* 앱 코드가 쓰는 토큰 진입점. 값은 전부 tokens.js 에 있다 (tailwind.config.js 와 공유하려고 .js 다).
   여기서 하는 일은 그 JS 값에 RN 타입을 입히는 것뿐이다. */
import type { LinearGradientProps } from "expo-linear-gradient";
import { gradient as rawGradient } from "./tokens";

export { colors, font, radius, shadow } from "./tokens";

/* expo-linear-gradient 는 colors 를 최소 2색 튜플로 요구하는데, 순수 JS 객체는 string[] 로 추론된다. */
export const gradient = rawGradient as unknown as Record<"hero" | "mileage", LinearGradientProps>;
