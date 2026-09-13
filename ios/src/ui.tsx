/* 디자인 시스템 프리미티브 RN 이식.
   값의 원본은 웹 이식본 `src/components/ui/index.jsx` + `src/index.css` 의 `.ds-*` 클래스다(이슈 #100).
   웹은 크기·간격을 인라인 style 에, 색·상태를 CSS 클래스에 둔다. RN 에는 클래스가 없으므로
   두 층을 여기서 하나로 합쳐 인라인으로 박는다 — 유틸리티 클래스로 반올림하면 값이 드리프트한다. */
import { useRef, useState, type ReactNode } from "react";
import {
  Dimensions,
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
import { Icon, type IconName } from "./icons";
import { CAT_LABEL, type CategoryKey } from "./data";
import type { BadgeStatus } from "./logic";
import { colors, font, fs, onVideo, radius, shadow } from "./theme";

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

/** 연보라 원·링은 뺐다 — 익명 서비스에서 아바타는 정보가 아니라 자리 표시다(웹과 같은 판단).
    ponytail: `ring` 은 받기만 하고 그리지 않는다. 지금 지우면 아직 `ring` 을 넘기는 MY 화면이
    타입 오류로 이 회차에 끌려온다 — MY 를 옮기는 회차에서 호출부와 함께 지운다. */
export function Avatar({ name = "", size = 44, ring: _ring = false }: { name?: string; size?: number; ring?: boolean }) {
  const initials = name.trim().slice(0, 2);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.sunken,
        borderWidth: 1,
        borderColor: colors.subtle,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {initials ? (
        <Text style={[base, { color: colors.muted, fontWeight: "600", fontSize: size * 0.4 }]}>{initials}</Text>
      ) : (
        <Icon name="user" size={size * 0.5} color={colors.muted} />
      )}
    </View>
  );
}

type ButtonVariant = "primary" | "outline";
type ButtonSize = "sm" | "md" | "lg";

/* 웹 BUTTON_SIZES 와 같은 값이다(높이 36·44·52). */
const BUTTON_SIZES: Record<ButtonSize, { padH: number; fontSize: number; height: number }> = {
  sm: { padH: 14, fontSize: fs.sm, height: 36 },
  md: { padH: 18, fontSize: fs.body, height: 44 },
  lg: { padH: 22, fontSize: fs.md, height: 52 },
};

/** variant: primary · outline. 그라데이션 변형은 없앴다 — 새 규칙에 그라데이션이 없다. */
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

  /* 비활성은 흐리게 만든 인디고(연보라)가 아니라 중립 회색 면이다 — 웹 `.ds-btn:disabled` 와 같다.
     opacity 로 흐리게 만들면 variant 마다 다른 연한 색이 나와 "못 누른다"가 색으로 안 읽힌다. */
  const fill: ViewStyle = disabled
    ? { backgroundColor: colors.sunken, borderWidth: 1, borderColor: colors.subtle }
    : variant === "outline"
      ? { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line }
      : { backgroundColor: colors.indigo[600], borderWidth: 1, borderColor: "transparent" };

  const fg = disabled ? colors.muted : variant === "outline" ? colors.strong : "#fff";

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      {...press}
      style={[
        {
          height: s.height,
          paddingHorizontal: s.padH,
          borderRadius: radius.md,
          alignItems: "center",
          justifyContent: "center",
          alignSelf: block ? "stretch" : "flex-start",
        },
        fill,
        pressed && !disabled ? PRESS_98 : null,
      ]}
    >
      <Text style={[base, { fontSize: s.fontSize, fontWeight: "600", color: fg }]}>{children}</Text>
    </Pressable>
  );
}

/* ───────────────────────── forms ───────────────────────── */

function Label({ children, dark }: { children: string; dark?: boolean }) {
  /* --text-label = 600 14/1.5 → lineHeight 는 절대값(14×1.5)으로 환산한다(M0-7 규칙). */
  return (
    <Text style={[base, { fontSize: fs.sm, lineHeight: 21, fontWeight: "600", color: dark ? onVideo.text : colors.strong, marginBottom: 6 }]}>
      {children}
    </Text>
  );
}

/* 웹 `.ds-field` 는 1px --border-strong 이고 포커스에 --focus-border(indigo-500)로 바뀐다.
   포커스 링(box-shadow 3px)은 RN 에 대응이 없어 테두리 색 전환만 남겼다.
   ponytail: 테두리 색 전환으로 충분 — 링이 필요해지면 겹 View 로 올린다.
   dark 는 인증 화면의 영상 배경 위(웹 AuthLayout의 LIGHT_ON_VIDEO 토큰 교체와 같다) 전용이다. */
const fieldBox = (focused: boolean, dark?: boolean): ViewStyle => ({
  borderWidth: 1,
  borderColor: dark ? (focused ? onVideo.borderFocus : onVideo.border) : focused ? colors.indigo[500] : colors.line,
  borderRadius: radius.md,
  backgroundColor: dark ? onVideo.surface : colors.card,
});

export function Input({
  label,
  hint,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  maxLength,
  dark,
}: {
  label?: string;
  /** 입력 규칙 안내. 웹 Input 의 hint 와 같은 자리(칸 아래 캡션)다. */
  hint?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  /** 영상 배경 위(인증 화면)에서 흰 글자·반투명 테두리로 그린다. */
  dark?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      {label ? <Label dark={dark}>{label}</Label> : null}
      <View style={[fieldBox(focused, dark), { paddingHorizontal: 12 }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={dark ? onVideo.muted : colors.muted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[base, { paddingVertical: 12, fontSize: fs.sm, color: dark ? onVideo.text : colors.strong }]}
        />
      </View>
      {hint ? (
        <Text style={[base, { marginTop: 6, fontSize: fs.caption, lineHeight: 19.5, color: dark ? onVideo.muted : colors.muted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

/* 하단 시트 표면. 공유 시트와 Select 가 같은 표면을 쓴다 — 두 곳에서 따로 만들면
   라운드·핸들바·스크림이 어긋난다.
   높이는 화면의 80% 로 묶고 내용은 스크롤시킨다. 묶지 않으면 큰 글씨 설정에서 표면이 화면
   밖으로 밀려 스크림도 닫기 버튼도 사라진다 — iOS 는 onRequestClose 가 안 오므로 갇힌다.
   ponytail: 원본 cwUp(translateY 20 → 0)은 Modal 의 native slide 로 대신한다. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(20,20,24,.45)" }} />
      <View
        style={[
          {
            maxHeight: "80%",
            backgroundColor: colors.card,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            paddingTop: 20,
            paddingHorizontal: 20,
            paddingBottom: 26 + insets.bottom,
          },
          shadow.lg,
        ]}
      >
        <View style={{ width: 38, height: 4, borderRadius: 99, backgroundColor: colors.gray[150], alignSelf: "center", marginBottom: 16 }} />
        {title ? <Text style={[base, { fontSize: fs.lg, fontWeight: "700", color: colors.strong }]}>{title}</Text> : null}
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
        style={[fieldBox(false, dark), { flexDirection: "row", alignItems: "center", paddingLeft: 12, paddingRight: 12, paddingVertical: 12 }]}
      >
        <Text style={[base, { flex: 1, fontSize: fs.sm, color: dark ? (value ? onVideo.text : onVideo.muted) : value ? colors.strong : colors.muted }]}>
          {value || placeholder}
        </Text>
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
            <Text style={[base, { flex: 1, fontSize: fs.body, fontWeight: o === value ? "700" : "400", color: o === value ? colors.indigo[600] : colors.strong }]}>
              {o}
            </Text>
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
        style={[base, fieldBox(focused), { minHeight: 128, paddingHorizontal: 12, paddingVertical: 12, fontSize: fs.sm, lineHeight: 23, color: colors.strong }]}
      />
      {maxLength != null ? (
        <Text style={[base, { alignSelf: "flex-end", marginTop: 6, fontSize: fs.caption, lineHeight: 19.5, color: colors.muted }]}>
          {value.length} / {maxLength}
        </Text>
      ) : null}
    </View>
  );
}

/* ───────────────────────── petition ───────────────────────── */

type TagSize = "sm" | "md";

/* 분류 칩(피드 필터)이 쓰는 아이콘. 태그 자체는 아래 CategoryTag 처럼 글자만 보인다. */
export const CAT_ICON: Record<CategoryKey, IconName> = {
  scholarship: "graduationCap",
  facility: "facilityBuilding",
  dorm: "dormHouse",
  library: "bookOpen",
  department: "peopleGroup",
};

/** 분류는 글자만 보인다 — 목록 행에서 아이콘까지 붙으면 상태 배지와 강조를 다툰다(웹과 같은 판단).
    아이콘은 피드 필터 칩이 계속 쓴다(CAT_ICON). */
export function CategoryTag({ category, size = "md" }: { category: CategoryKey; size?: TagSize }) {
  const fontSize = size === "sm" ? fs.caption : fs.sm;
  return <Text style={[base, { fontSize, lineHeight: fontSize * 1.3, fontWeight: "600", color: colors.body }]}>{CAT_LABEL[category]}</Text>;
}

/* 건의 라이프사이클: 진행중 → 검토중 → 답변 완료, + 시간에서 파생된 만료됨.
   색 원 안의 흰 글리프는 뺐다 — 뜻은 안 읽히고 색만 늘렸다. 진한 단색 면 + 흰 글자로 간다.
   목록에서 상태가 분류·날짜와 같은 회색 글자로 섞여 안 읽히던 것을 면으로 떼어낸다.
   만료는 상태가 아니라 시간이 지난 것이라 의미색을 주지 않는다 — 중립 회색 면이다. */
const STATUS: Record<BadgeStatus, { label: string; bg: string; fg: string }> = {
  received: { label: "진행중", bg: colors.status["solid-received"], fg: "#fff" },
  reviewing: { label: "검토중", bg: colors.status["solid-reviewing"], fg: "#fff" },
  answered: { label: "답변 완료", bg: colors.status["solid-answered"], fg: "#fff" },
  expired: { label: "만료됨", bg: colors.sunken, fg: colors.muted },
};

export function StatusBadge({ status, size = "md" }: { status: BadgeStatus; size?: TagSize }) {
  const s = STATUS[status] ?? STATUS.received;
  const fontSize = size === "sm" ? fs.caption : fs.sm;
  return (
    <View style={{ alignSelf: "flex-start", paddingVertical: 3, paddingHorizontal: 7, borderRadius: radius.xs, backgroundColor: s.bg }}>
      <Text style={[base, { fontSize, lineHeight: fontSize * 1.3, fontWeight: "600", color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

/* 핵심 인터랙션: 요청을 누르면 청원이 임계치로 다가간다.
   화면 표기는 "요청"이지만 서버·코드의 개념명은 그대로 agreement(공감)다 — 아래 주석들이
   "공감"이라 부르는 것은 전부 그 서버 개념이다(웹 components/ui/index.jsx 와 같은 규칙).
   댓글·답글의 공감(COMMENT_LIKE/REPLY_LIKE)은 별개 동작이라 표기도 "공감" 그대로 둔다.
   하트는 뺐다 — 좋아요 버튼으로 읽히는데 뜻은 청원 동의라 어긋났다. 누른 상태는 채움과 체크로 보인다. */
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
  size?: ButtonSize;
  block?: boolean;
}) {
  const s = BUTTON_SIZES[size];
  const { pressed, ...press } = usePressed();
  const fg = active ? "#fff" : colors.strong;

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`요청 ${fmt(count)}`}
      {...press}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          height: s.height,
          paddingHorizontal: s.padH,
          borderRadius: radius.md,
          borderWidth: 1,
          backgroundColor: active ? colors.indigo[600] : colors.card,
          borderColor: active ? colors.indigo[600] : colors.line,
          alignSelf: block ? "stretch" : "flex-start",
          flex: block ? 1 : undefined,
        },
        pressed ? PRESS_95 : null,
      ]}
    >
      {active ? <Icon name="check" size={size === "sm" ? 15 : 18} color={fg} /> : null}
      <Text style={[base, { fontSize: s.fontSize, fontWeight: "600", color: fg }]}>요청</Text>
      <Text style={[base, { fontSize: s.fontSize, fontWeight: "600", color: fg, fontVariant: ["tabular-nums"] }]}>{fmt(count)}</Text>
    </Pressable>
  );
}

/** 요청이 기준(학과 정원 또는 전체 학생 대비)에 얼마나 다가갔는지.
    막대 대신 숫자와 남은 인원으로 보인다 — 회색 트랙 위 채움 막대는 대시보드 템플릿으로 읽혔다.
    호출부 때문에 이름은 그대로 둔다. size="lg" 는 상세용 두 줄, 나머지는 목록용 한 줄이다. */
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
  size?: ButtonSize;
  showMeta?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const reached = current >= threshold;
  const left = Math.max(0, threshold - current);

  if (size === "lg") {
    return (
      <View style={[{ gap: 4 }, style]}>
        <View style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", columnGap: 6 }}>
          <Text style={[base, { fontSize: fs.title, lineHeight: fs.title * 1.15, fontWeight: "700", color: colors.strong, fontVariant: ["tabular-nums"] }]}>
            {fmt(current)}
          </Text>
          <Text style={[base, { fontSize: fs.lg, color: colors.muted, fontVariant: ["tabular-nums"] }]}>/ {fmt(threshold)}명</Text>
          <Text style={[base, { fontSize: fs.caption, color: colors.muted, marginLeft: 6 }]}>{basisLabel} 기준</Text>
        </View>
        <Text style={[base, { fontSize: fs.sm, lineHeight: fs.sm * 1.5, fontWeight: reached ? "600" : "400", color: reached ? colors.success : colors.body }]}>
          {reached ? "기준 인원을 넘어 담당 부서로 전달되었습니다." : `${fmt(left)}명 더 요청하면 담당 부서로 전달됩니다.`}
        </Text>
      </View>
    );
  }

  if (!showMeta) return null;

  return (
    <View style={[{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 12 }, style]}>
      <Text style={[base, { fontSize: fs.sm, color: colors.muted, fontVariant: ["tabular-nums"] }]}>
        <Text style={[base, { fontSize: fs.sm, fontWeight: "700", color: colors.strong }]}>{fmt(current)}</Text> / {fmt(threshold)}명
      </Text>
      <Text style={[base, { fontSize: fs.sm, fontWeight: reached ? "600" : "400", color: reached ? colors.success : colors.muted }]}>
        {reached ? "담당 부서 전달됨" : `${fmt(left)}명 남음`}
      </Text>
    </View>
  );
}

/* 화면들이 공통으로 쓰는 카드 셸. */
function MenuItem({ icon, label, color, onPress }: { icon: IconName; label: string; color: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      /* style 을 함수로 주면 안 된다 — NativeWind v4 가 Pressable 을 감싸면서 그 형태를 흘려버려
         스타일이 통째로 무시되고 아이콘 아래로 글자가 떨어진다. 이 레포의 다른 Pressable 도
         전부 객체로만 준다. 눌림 표시는 누르는 즉시 메뉴가 닫혀 보이지도 않아 빼둔다. */
      style={{ flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 9, paddingHorizontal: 10, borderRadius: radius.xs }}
    >
      <Icon name={icon} size={15} color={color} />
      <Text style={{ fontFamily: font, fontSize: fs.sm, fontWeight: "600", color }}>{label}</Text>
    </Pressable>
  );
}

/* 신고·차단 오버플로 메뉴. 피드 카드·청원 상세·댓글이 모두 이걸 쓴다 — 웹 components/ui 의 ActionMenu 와 같은 짝이다.
   전에는 Alert.alert(액션시트)로 띄웠는데, 화면 아래에서 올라오는 큰 모달이라 웹의 작은 드롭다운과 모양이 갈렸다.
   ⋮ 버튼 위치를 measureInWindow 로 재서 그 바로 아래에 붙인다 — 앵커가 없으면 어느 항목의 메뉴인지 알 수 없다. */
export function ActionMenu({
  onReport,
  onBlock,
  onDelete,
  label = "메뉴",
  size = 17,
  style,
}: {
  onReport?: () => void;
  onBlock?: () => void;
  onDelete?: () => void;
  label?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);
  const button = useRef<View>(null);

  const open = () => {
    button.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ top: y + height + 4, right: Dimensions.get("window").width - (x + width) });
    });
  };
  const pick = (run: () => void) => {
    setAnchor(null);
    run();
  };

  return (
    <>
      <Pressable
        ref={button}
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={8}
        style={[{ marginLeft: "auto", width: 26, height: 26, alignItems: "center", justifyContent: "center" }, style]}
      >
        <Icon name="moreVertical" size={size} color={colors.muted} />
      </Pressable>
      <Modal visible={anchor != null} transparent animationType="fade" onRequestClose={() => setAnchor(null)}>
        <Pressable style={{ flex: 1 }} accessibilityLabel="메뉴 닫기" onPress={() => setAnchor(null)}>
          {anchor ? (
            <View
              style={[
                {
                  position: "absolute",
                  top: anchor.top,
                  right: anchor.right,
                  minWidth: 128,
                  backgroundColor: colors.card,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.subtle,
                  padding: 6,
                },
                shadow.lg,
              ]}
            >
              {onReport ? <MenuItem icon="flag" label="신고" color={colors.body} onPress={() => pick(onReport)} /> : null}
              {onBlock ? <MenuItem icon="userX" label="차단" color={colors.danger} onPress={() => pick(onBlock)} /> : null}
              {onDelete ? <MenuItem icon="trash" label="삭제" color={colors.danger} onPress={() => pick(onDelete)} /> : null}
            </View>
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
}

/** 떠 있지 않은 면. 그림자는 뺐다 — 카드는 위계가 정말 필요한 곳에만 쓴다(웹과 같은 판단). */
export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.subtle, padding: 16 }, style]}>{children}</View>
  );
}
