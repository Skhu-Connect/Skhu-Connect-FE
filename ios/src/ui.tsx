/* 디자인 시스템 프리미티브 RN 이식.
   스펙 원본: design-handoff 의 _ds_bundle.js (웹 이식본은 ../../src/components/ui/index.jsx).
   원본이 픽셀을 인라인으로 정의하므로 수치를 그대로 옮긴다 — 유틸리티 클래스로 반올림하면 값이 드리프트한다. */
import { useState, type ReactNode } from "react";
import { Modal, Pressable, Text, TouchableOpacity, TextInput, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Icon } from "./icons";
import { CAT_LABEL, type CategoryKey, type StatusKey } from "./data";
import { colors, font, gradient, radius, shadow } from "./theme";

/* Hermes 의 Intl 유무에 기대지 않는 천단위 구분. */
export function fmt(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/* CSS 의 color-mix(in srgb, C 14%, #fff) 를 그대로 계산한다. CategoryTag soft 배경에 쓴다. */
function mixWhite(hex: string, ratio: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(c * ratio + 255 * (1 - ratio)));
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

const base: TextStyle = { fontFamily: font };

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
      <TouchableOpacity
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        accessibilityRole="button"
        activeOpacity={0.9}
        style={[{ alignSelf: block ? "stretch" : "flex-start" }, shadow.magenta]}
      >
        <LinearGradient {...gradient.mileage} style={layout}>
          {label("#fff")}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const fill =
    variant === "outline"
      ? { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.indigo[200] }
      : { backgroundColor: colors.indigo[600] };

  return (
    <TouchableOpacity onPress={disabled ? undefined : onPress} disabled={disabled} accessibilityRole="button" activeOpacity={0.9} style={[layout, fill]}>
      {label(variant === "outline" ? colors.indigo[600] : "#fff")}
    </TouchableOpacity>
  );
}

/* ───────────────────────── forms ───────────────────────── */

function Label({ children }: { children: string }) {
  return <Text style={[base, { fontSize: 13, fontWeight: "600", color: colors.strong, marginBottom: 6 }]}>{children}</Text>;
}

/* 원본의 focus 링은 box-shadow 다. RN 에 대응이 없어 테두리 색 전환만 남겼다.
   ponytail: 테두리 색 전환으로 충분 — 링이 필요해지면 겹 View 로 올린다. */
const fieldBox = (focused: boolean): ViewStyle => ({
  borderWidth: 1.5,
  borderColor: focused ? colors.indigo[400] : colors.line,
  borderRadius: radius.md,
  backgroundColor: colors.card,
});

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
}: {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      {label ? <Label>{label}</Label> : null}
      <View style={[fieldBox(focused), { paddingHorizontal: 14 }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[base, { paddingVertical: 12, fontSize: 14, color: colors.strong }]}
        />
      </View>
    </View>
  );
}

/* 웹의 <select> 대응. iOS 네이티브 액션시트를 쓴다 — 피커 라이브러리를 새로 들이지 않는다. */
/* 하단 시트 표면. 공유 시트와 Select 가 같은 표면을 쓴다 — 두 곳에서 따로 만들면
   라운드·핸들바·스크림이 어긋난다.
   ponytail: 원본 cwUp(translateY 20 → 0)은 Modal 의 native slide 로 대신한다. Animated 로 20px
   만 띄우려면 표면을 직접 애니메이트해야 하는데, 눈에 보이는 차이가 그만큼은 아니다. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(24,24,54,.45)" }} />
      <View style={[{ backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 20, paddingBottom: 26 + insets.bottom }, shadow.lg]}>
        <View style={{ width: 38, height: 4, borderRadius: 99, backgroundColor: colors.gray[150], alignSelf: "center", marginBottom: 16 }} />
        {title ? <Text style={[base, { fontSize: 16.5, fontWeight: "800", color: colors.strong, marginBottom: 4 }]}>{title}</Text> : null}
        {children}
      </View>
    </Modal>
  );
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = "선택하세요",
}: {
  label?: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      {label ? <Label>{label}</Label> : null}
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value || placeholder }}
        style={[fieldBox(false), { flexDirection: "row", alignItems: "center", paddingLeft: 15, paddingRight: 14, paddingVertical: 12 }]}
      >
        <Text style={[base, { flex: 1, fontSize: 14, color: value ? colors.strong : colors.muted }]}>{value || placeholder}</Text>
        <Icon name="chevronDown" size={16} color={colors.muted} />
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
        <Text style={[base, { alignSelf: "flex-end", marginTop: 6, fontSize: 12, color: colors.muted }]}>
          {value.length} / {maxLength}
        </Text>
      ) : null}
    </View>
  );
}

/* ───────────────────────── petition ───────────────────────── */

type TagSize = "sm" | "md";

export function CategoryTag({ category, size = "md" }: { category: CategoryKey; size?: TagSize }) {
  const color = colors.cat[category];
  const d = size === "sm" ? { padV: 3, padH: 10, fontSize: 11, dot: 5 } : { padV: 5, padH: 12, fontSize: 13, dot: 6 };
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        alignSelf: "flex-start",
        paddingVertical: d.padV,
        paddingHorizontal: d.padH,
        borderRadius: radius.pill,
        backgroundColor: mixWhite(color, 0.14),
      }}
    >
      <View style={{ width: d.dot, height: d.dot, borderRadius: d.dot / 2, backgroundColor: color }} />
      <Text style={[base, { fontSize: d.fontSize, fontWeight: "600", color }]}>{CAT_LABEL[category]}</Text>
    </View>
  );
}

const STATUS: Record<StatusKey, { label: string; fg: string; bg: string; dot: string }> = {
  received: { label: "접수", fg: colors.status["received-fg"], bg: colors.status["received-bg"], dot: colors.indigo[500] },
  reviewing: { label: "검토중", fg: colors.status["review-fg"], bg: colors.status["review-bg"], dot: colors.warning },
  answered: { label: "답변 완료", fg: colors.status["answered-fg"], bg: colors.status["answered-bg"], dot: colors.success },
};

export function StatusBadge({ status, size = "md" }: { status: StatusKey; size?: TagSize }) {
  const s = STATUS[status];
  const d = size === "sm" ? { padV: 3, padH: 10, fontSize: 11, dot: 5 } : { padV: 5, padH: 13, fontSize: 13, dot: 6 };
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        alignSelf: "flex-start",
        paddingVertical: d.padV,
        paddingHorizontal: d.padH,
        borderRadius: radius.pill,
        backgroundColor: s.bg,
      }}
    >
      <View style={{ width: d.dot, height: d.dot, borderRadius: d.dot / 2, backgroundColor: s.dot }} />
      <Text style={[base, { fontSize: d.fontSize, fontWeight: "700", color: s.fg }]}>{s.label}</Text>
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

  const inner = (color: string) => (
    <>
      <Icon name={active ? "heartSolid" : "heart"} size={d.icon} color={color} />
      <Text style={[base, { fontSize: d.fontSize, fontWeight: "700", color }]}>공감</Text>
      <Text style={[base, { fontSize: d.fontSize, fontWeight: "700", color, opacity: active ? 1 : 0.85 }]}>{fmt(count)}</Text>
    </>
  );

  const layout: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: d.padV,
    paddingHorizontal: d.padH,
    borderRadius: radius.pill,
  };

  return (
    <TouchableOpacity
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`공감 ${fmt(count)}`}
      activeOpacity={0.85}
      style={[{ flex: block ? 1 : undefined }, active ? shadow.magenta : null]}
    >
      {active ? (
        <LinearGradient {...gradient.mileage} style={layout}>
          {inner("#fff")}
        </LinearGradient>
      ) : (
        <View style={[layout, { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.coral[400] }]}>{inner(colors.coral[600])}</View>
      )}
    </TouchableOpacity>
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

  return (
    <View style={[{ gap: 8 }, style]}>
      {showMeta ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
          <Text style={[base, { fontSize: 12, color: colors.muted }]}>{basisLabel} 대비 임계치</Text>
          <Text style={[base, { fontSize: 13, fontWeight: "700", color: reached ? colors.success : colors.indigo[600] }]}>
            {fmt(current)} / {fmt(threshold)}
            <Text style={[base, { fontSize: 13, fontWeight: "500", color: colors.muted }]}> · {Math.round(pct)}%</Text>
          </Text>
        </View>
      ) : null}

      <View style={{ height: h, borderRadius: radius.pill, backgroundColor: colors.gray[150], overflow: "hidden" }}>
        {reached ? (
          <View style={{ width: `${pct}%`, height: "100%", borderRadius: radius.pill, backgroundColor: colors.success }} />
        ) : (
          <LinearGradient {...gradient.hero} style={{ width: `${pct}%`, height: "100%", borderRadius: radius.pill }} />
        )}
      </View>

      {showMeta && reached ? <Text style={[base, { fontSize: 12, fontWeight: "600", color: colors.success }]}>임계치 도달 · 담당자 검토 요청됨</Text> : null}
    </View>
  );
}

/* 화면들이 공통으로 쓰는 카드 셸. */
export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.subtle, padding: 16 }, shadow.sm, style]}>{children}</View>
  );
}
