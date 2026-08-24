/* 디자인 시스템 프리미티브 RN 이식.
   스펙 원본: design-handoff 의 _ds_bundle.js (웹 이식본은 ../../src/components/ui/index.jsx).
   원본이 픽셀을 인라인으로 정의하므로 수치를 그대로 옮긴다 — 유틸리티 클래스로 반올림하면 값이 드리프트한다. */
import { useEffect, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Path } from "react-native-svg";
import { Icon, type IconName } from "./icons";
import { CAT_LABEL, type CategoryKey, type StatusKey } from "./data";
import { colors, font, gradient, onVideo, radius, shadow } from "./theme";

/* Hermes 의 Intl 유무에 기대지 않는 천단위 구분. */
export function fmt(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const base: TextStyle = { fontFamily: font };

/* 원본의 press 축소. 터치에는 hover 가 없으므로 이식하는 인터랙션은 이것뿐이다.
   Pressable 의 style 콜백은 쓰지 않는다 — NativeWind 의 interop 이 style prop 을 규칙으로
   다시 조립하면서 함수를 버려 스타일이 통째로 사라진다(로그인 버튼이 안 보였던 원인).
   눌림 상태를 state 로 들고 평범한 객체를 넘긴다. */
const PRESS_98: ViewStyle = { transform: [{ scale: 0.98 }] };
const PRESS_95: ViewStyle = { transform: [{ scale: 0.95 }] };

function usePressed() {
  const [pressed, setPressed] = useState(false);
  return { pressed, onPressIn: () => setPressed(true), onPressOut: () => setPressed(false) };
}

/* 로고 마크 — 앱 아이콘과 같은 브랜드 마크다. 화면마다 다르게 그리지 않는다.
   assets/icon.png(1024px) 이 아니라 별도 256px 에셋을 쓴다 — 66pt 뷰에 1024px 을 넣으면
   4MB 로 디코드된다. 코너는 투명이라 borderRadius 가 그대로 먹는다. */
export function LogoMark({ size = 66 }: { size?: number }) {
  return (
    <Image
      source={require("../assets/logo-mark.png")}
      style={{ width: size, height: size, borderRadius: 20 * (size / 66) }}
      accessibilityIgnoresInvertColors
    />
  );
}

/* ───────────────────────── core ───────────────────────── */

export function Avatar({ name = "", size = 44, ring = false }: { name?: string; size?: number; ring?: boolean }) {
  const circle = (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.indigo[100], alignItems: "center", justifyContent: "center" }}>
      <Text style={[base, { color: colors.indigo[700], fontWeight: "700", fontSize: size * 0.4 }]}>{name.trim().slice(0, 2)}</Text>
    </View>
  );
  if (!ring) return circle;
  // 원본은 box-shadow 두 겹(흰 3px + indigo-200 2px)으로 링을 그린다. RN 은 겹 View 로 같은 결과를 낸다.
  return (
    <View style={{ padding: 2, borderRadius: (size + 10) / 2, backgroundColor: colors.indigo[200] }}>
      <View style={{ padding: 3, borderRadius: (size + 6) / 2, backgroundColor: "#fff" }}>{circle}</View>
    </View>
  );
}

type ButtonVariant = "primary" | "outline" | "gradient";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_SIZES: Record<ButtonSize, { padV: number; padH: number; fontSize: number; height: number }> = {
  sm: { padV: 8, padH: 16, fontSize: 13, height: 36 },
  md: { padV: 11, padH: 22, fontSize: 14, height: 44 },
  lg: { padV: 15, padH: 28, fontSize: 16, height: 52 },
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  block = false,
  disabled = false,
  onPress,
}: {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}) {
  const s = BUTTON_SIZES[size];
  const { pressed, ...press } = usePressed();
  const layout: ViewStyle = {
    height: s.height,
    paddingHorizontal: s.padH,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: block ? "stretch" : "flex-start",
    opacity: disabled ? 0.5 : 1,
  };
  const label = (color: string) => <Text style={[base, { fontSize: s.fontSize, fontWeight: "600", color }]}>{children}</Text>;

  if (variant === "gradient") {
    return (
      <Pressable
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        accessibilityRole="button"
        {...press}
        style={[{ alignSelf: block ? "stretch" : "flex-start" }, shadow.magenta, pressed && !disabled ? PRESS_98 : null]}
      >
        <LinearGradient {...gradient.mileage} style={layout}>
          {label("#fff")}
        </LinearGradient>
      </Pressable>
    );
  }

  const fill =
    variant === "outline"
      ? { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.indigo[200] }
      : { backgroundColor: colors.indigo[600] };

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      {...press}
      style={[layout, fill, pressed && !disabled ? PRESS_98 : null]}
    >
      {label(variant === "outline" ? colors.indigo[600] : "#fff")}
    </Pressable>
  );
}

/* ───────────────────────── forms ───────────────────────── */

function Label({ children, dark }: { children: string; dark?: boolean }) {
  /* --text-label = 600 13/1.5 → lineHeight 는 절대값(13×1.5)으로 환산한다(M0-7 규칙). */
  return <Text style={[base, { fontSize: 13, lineHeight: 19.5, fontWeight: "600", color: dark ? onVideo.text : colors.strong, marginBottom: 6 }]}>{children}</Text>;
}

/* 원본의 focus 링은 box-shadow 다. RN 에 대응이 없어 테두리 색 전환만 남겼다.
   ponytail: 테두리 색 전환으로 충분 — 링이 필요해지면 겹 View 로 올린다.
   dark 는 인증 화면의 영상 배경 위(웹 AuthLayout의 LIGHT_ON_VIDEO 토큰 교체와 같다) 전용이다. */
const fieldBox = (focused: boolean, dark?: boolean): ViewStyle => ({
  borderWidth: 1.5,
  borderColor: dark ? (focused ? onVideo.borderFocus : onVideo.border) : focused ? colors.indigo[400] : colors.line,
  borderRadius: radius.md,
  backgroundColor: dark ? onVideo.surface : colors.card,
});

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  dark,
}: {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  /** 영상 배경 위(인증 화면)에서 흰 글자·반투명 테두리로 그린다. */
  dark?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      {label ? <Label dark={dark}>{label}</Label> : null}
      <View style={[fieldBox(focused, dark), { paddingHorizontal: 14 }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={dark ? onVideo.muted : colors.muted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[base, { paddingVertical: 12, fontSize: 14, color: dark ? onVideo.text : colors.strong }]}
        />
      </View>
    </View>
  );
}

/* 하단 시트 표면. 공유 시트와 Select 가 같은 표면을 쓴다 — 두 곳에서 따로 만들면
   라운드·핸들바·스크림이 어긋난다.
   높이는 화면의 80% 로 묶고 내용은 스크롤시킨다. 묶지 않으면 큰 글씨 설정에서 표면이 화면
   밖으로 밀려 스크림도 닫기 버튼도 사라진다 — iOS 는 onRequestClose 가 안 오므로 갇힌다.
   ponytail: 원본 cwUp(translateY 20 → 0)은 Modal 의 native slide 로 대신한다. Animated 로 20px
   만 띄우려면 표면을 직접 애니메이트해야 하는데, 눈에 보이는 차이가 그만큼은 아니다. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(24,24,54,.45)" }} />
      <View style={[{ maxHeight: "80%", backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 20, paddingBottom: 26 + insets.bottom }, shadow.lg]}>
        <View style={{ width: 38, height: 4, borderRadius: 99, backgroundColor: colors.gray[150], alignSelf: "center", marginBottom: 16 }} />
        {title ? <Text style={[base, { fontSize: 16.5, fontWeight: "800", color: colors.strong }]}>{title}</Text> : null}
        <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false} bounces={false}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

/* 웹의 <select> 대응. 공용 Sheet 로 띄운다 — 피커 라이브러리를 새로 들이지 않는다. */
export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = "선택하세요",
  dark,
}: {
  label?: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** 영상 배경 위(인증 화면)에서 흰 글자·반투명 테두리로 그린다. 펼쳐지는 시트는 그대로 밝게 유지한다. */
  dark?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      {label ? <Label dark={dark}>{label}</Label> : null}
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value || placeholder }}
        style={[fieldBox(false, dark), { flexDirection: "row", alignItems: "center", paddingLeft: 15, paddingRight: 14, paddingVertical: 12 }]}
      >
        <Text style={[base, { flex: 1, fontSize: 14, color: dark ? (value ? onVideo.text : onVideo.muted) : value ? colors.strong : colors.muted }]}>{value || placeholder}</Text>
        <Icon name="chevronDown" size={16} color={dark ? onVideo.muted : colors.muted} />
      </Pressable>

      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        {options.map((o, i) => (
          <Pressable
            key={o}
            onPress={() => {
              onChange(o);
              setOpen(false);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: o === value }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 15,
              borderBottomWidth: i === options.length - 1 ? 0 : 1,
              borderBottomColor: colors.subtle,
            }}
          >
            <Text style={[base, { flex: 1, fontSize: 15, fontWeight: o === value ? "700" : "400", color: o === value ? colors.indigo[600] : colors.strong }]}>{o}</Text>
            {o === value ? <Icon name="check" size={17} color={colors.indigo[600]} /> : null}
          </Pressable>
        ))}
      </Sheet>
    </View>
  );
}

export function Textarea({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength,
}: {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      {label ? <Label>{label}</Label> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        maxLength={maxLength}
        multiline
        textAlignVertical="top"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[base, fieldBox(focused), { minHeight: 128, paddingHorizontal: 15, paddingVertical: 13, fontSize: 14, lineHeight: 23, color: colors.strong }]}
      />
      {maxLength != null ? (
        <Text style={[base, { alignSelf: "flex-end", marginTop: 6, fontSize: 12, lineHeight: 18, color: colors.muted }]}>
          {value.length} / {maxLength}
        </Text>
      ) : null}
    </View>
  );
}

/* ───────────────────────── petition ───────────────────────── */

type TagSize = "sm" | "md";

/* 분류는 색이 아니라 아이콘 모양으로 구분한다 — 웹 CATEGORIES 와 같은 짝이다
   (원본 태그 에셋이 전부 무채색 선 아이콘 + 텍스트다). */
export const CAT_ICON: Record<CategoryKey, IconName> = {
  scholarship: "graduationCap",
  facility: "facilityBuilding",
  dorm: "dormHouse",
  library: "bookOpen",
  department: "peopleGroup",
};

export function CategoryTag({ category, size = "md" }: { category: CategoryKey; size?: TagSize }) {
  const d = size === "sm" ? { icon: 15, fontSize: 12.5 } : { icon: 18, fontSize: 14 };
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start" }}>
      <Icon name={CAT_ICON[category]} size={d.icon} color={colors.strong} strokeWidth={2.2} />
      <Text style={[base, { fontSize: d.fontSize, lineHeight: d.fontSize * 1.3, fontWeight: "600", color: colors.strong }]}>{CAT_LABEL[category]}</Text>
    </View>
  );
}

/* 상태는 색을 채운 원 안의 흰 글리프로 구분한다(웹 StatusDot 과 같은 지오메트리).
   received 라벨이 "진행중" 인 것도 웹을 따른다 — 원본 에셋의 in_progress 에 대응한다. */
const STATUS: Record<StatusKey, { label: string; dot: string }> = {
  received: { label: "진행중", dot: colors.status["dot-received"] },
  reviewing: { label: "검토중", dot: colors.status["dot-reviewing"] },
  answered: { label: "답변 완료", dot: colors.status["dot-answered"] },
};

function StatusDot({ status, size }: { status: StatusKey; size: number }) {
  const glyph = {
    stroke: "#fff",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} fill={STATUS[status].dot} />
      {status === "received" ? <Path d="m10 8 6 4-6 4Z" fill="#fff" stroke="none" /> : null}
      {status === "reviewing" ? (
        <>
          <Circle cx={12} cy={12} r={7} {...glyph} />
          <Path d="M12 8v4l3 2" {...glyph} />
        </>
      ) : null}
      {status === "answered" ? <Path d="m7.5 12.2 3 3.1 6-7" {...glyph} /> : null}
    </Svg>
  );
}

export function StatusBadge({ status, size = "md" }: { status: StatusKey; size?: TagSize }) {
  const d = size === "sm" ? { dot: 18, fontSize: 12.5 } : { dot: 22, fontSize: 14 };
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" }}>
      <StatusDot status={status} size={d.dot} />
      <Text style={[base, { fontSize: d.fontSize, lineHeight: d.fontSize * 1.3, fontWeight: "600", color: colors.strong }]}>{STATUS[status].label}</Text>
    </View>
  );
}

/* 핵심 인터랙션: 공감을 누르면 청원이 임계치로 다가간다. */
export function EmpathyButton({
  count,
  active,
  onToggle,
  size = "md",
  block = false,
}: {
  count: number;
  active: boolean;
  onToggle: () => void;
  size?: "sm" | "md" | "lg";
  block?: boolean;
}) {
  const d =
    size === "lg" ? { padV: 14, padH: 26, fontSize: 16, icon: 22 } : size === "sm" ? { padV: 7, padH: 14, fontSize: 13, icon: 16 } : { padV: 11, padH: 20, fontSize: 14, icon: 19 };
  const { pressed, ...press } = usePressed();

  const inner = (color: string) => (
    <>
      <Icon name={active ? "heartSolid" : "heart"} size={d.icon} color={color} />
      <Text style={[base, { fontSize: d.fontSize, fontWeight: "700", color }]}>공감</Text>
      <Text style={[base, { fontSize: d.fontSize, fontWeight: "700", color, opacity: active ? 1 : 0.85, fontVariant: ["tabular-nums"] }]}>{fmt(count)}</Text>
    </>
  );

  /* 테두리는 활성일 때도 1.5px 로 남는다(원본은 투명색). 빼면 공감을 누를 때마다 버튼이 3px 씩 줄어든다. */
  const layout: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: d.padV,
    paddingHorizontal: d.padH,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: "transparent",
  };

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`공감 ${fmt(count)}`}
      {...press}
      style={[{ flex: block ? 1 : undefined }, active ? shadow.magenta : null, pressed ? PRESS_95 : null]}
    >
      {active ? (
        <LinearGradient {...gradient.mileage} style={layout}>
          {inner("#fff")}
        </LinearGradient>
      ) : (
        <View style={[layout, { backgroundColor: colors.card, borderColor: colors.coral[400] }]}>{inner(colors.coral[600])}</View>
      )}
    </Pressable>
  );
}

/* 공감 임계치까지의 진행도. 임계치는 학과 정원 또는 전체 학생 대비 %. */
export function ThresholdBar({
  current,
  threshold,
  basisLabel,
  size = "md",
  showMeta = true,
  style,
}: {
  current: number;
  threshold: number;
  basisLabel: string;
  size?: "sm" | "md" | "lg";
  showMeta?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const pct = Math.min(100, threshold > 0 ? (current / threshold) * 100 : 0);
  const reached = current >= threshold;
  const h = size === "lg" ? 12 : size === "sm" ? 6 : 9;

  /* 원본의 transition: width .5s cubic-bezier(.4,0,.2,1). RN 내장 Animated 로 낸다 —
     폭은 레이아웃 값이라 네이티브 드라이버로 못 넘긴다(useNativeDriver: false). */
  const [anim] = useState(() => new Animated.Value(pct));
  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 500, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: false }).start();
  }, [anim, pct]);
  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });

  return (
    <View style={[{ gap: 8 }, style]}>
      {showMeta ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <Text style={[base, { fontSize: 12, lineHeight: 18, color: colors.muted }]}>{basisLabel} 대비 도달률</Text>
          <Text style={[base, { fontSize: 13, fontWeight: "700", color: reached ? colors.success : colors.indigo[600], fontVariant: ["tabular-nums"] }]}>
            {fmt(current)} / {fmt(threshold)}
            <Text style={[base, { fontSize: 13, fontWeight: "500", color: colors.muted }]}> · {Math.round(pct)}%</Text>
          </Text>
        </View>
      ) : null}

      <View style={{ height: h, borderRadius: radius.pill, backgroundColor: colors.gray[150], overflow: "hidden" }}>
        <Animated.View style={{ width, height: "100%", borderRadius: radius.pill, overflow: "hidden", backgroundColor: reached ? colors.success : undefined }}>
          {reached ? null : <LinearGradient {...gradient.hero} style={{ flex: 1 }} />}
        </Animated.View>
      </View>

      {showMeta && reached ? (
        <Text style={[base, { fontSize: 12, lineHeight: 18, fontWeight: "600", color: colors.success }]}>도달률 100% 달성 · 담당자 검토 요청됨</Text>
      ) : null}
    </View>
  );
}

/* 화면들이 공통으로 쓰는 카드 셸. */
export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.subtle, padding: 16 }, shadow.sm, style]}>{children}</View>
  );
}
