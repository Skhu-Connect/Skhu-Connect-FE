/* 화면 위에 공통으로 얹히는 것들 — 하단 탭바, 공유 바텀시트, 토스트. */
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconName } from "./icons";
import { Button, Sheet } from "./ui";
import { colors, font, fs, radius, shadow } from "./theme";
import type { Tab } from "./logic";

const t = { fontFamily: font };

export function TabBar({
  tab,
  screen,
  onTab,
  onCompose,
}: {
  tab: Tab;
  screen: string;
  onTab: (t: Tab) => void;
  onCompose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const active = (k: Tab) => (k === "my" ? screen === "my" : screen === "feed" && tab === k);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", height: 64 + insets.bottom, paddingBottom: insets.bottom + 6, borderTopWidth: 1, borderTopColor: colors.subtle, backgroundColor: colors.card }}>
      <TabItem icon="home" label="홈" active={active("home")} onPress={() => onTab("home")} />
      <TabItem icon="checkCircle" label="답변 완료" active={active("answered")} onPress={() => onTab("answered")} />

      <View style={{ flex: 1, alignItems: "center" }}>
        {/* 마젠타 그라데이션 + 색 그림자 + 원형이던 자리. 새 규칙은 액센트를 인디고 하나로 모으고
            원형을 아바타에만 허용하므로 단색 + 컨트롤 라운드로 간다.
            48×48 과 marginTop:-12 는 그대로다 — 탭바 높이 64 와 물려 있는 값이다. */}
        <Pressable onPress={onCompose} accessibilityRole="button" accessibilityLabel="건의 등록" style={{ marginTop: -12 }}>
          <View style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.indigo[600], alignItems: "center", justifyContent: "center" }}>
            <Icon name="plus" size={24} color="#fff" />
          </View>
        </Pressable>
      </View>

      <TabItem icon="inbox" label="내 건의" active={active("mine")} onPress={() => onTab("mine")} />
      <TabItem icon="user" label="MY" active={active("my")} onPress={() => onTab("my")} />
    </View>
  );
}

function TabItem({ icon, label, active, onPress }: { icon: IconName; label: string; active: boolean; onPress: () => void }) {
  const color = active ? colors.indigo[600] : colors.gray[400];
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: active }} style={{ flex: 1, alignItems: "center", gap: 3 }}>
      <Icon name={icon} size={21} color={color} />
      <Text style={[t, { fontWeight: "700", fontSize: fs.caption, color }]}>{label}</Text>
    </Pressable>
  );
}

export function ShareSheet({ open, url, copied, onCopy, onClose }: { open: boolean; url: string; copied: boolean; onCopy: () => void; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="링크 공유">
      <Text style={[t, { fontSize: fs.caption, color: colors.muted, marginTop: 5, lineHeight: 19.5 }]}>링크를 받은 학생은 로그인 후 바로 이 건의에 요청할 수 있습니다.</Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: colors.sunken, borderWidth: 1, borderColor: colors.subtle, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 14, marginTop: 14 }}>
        <Text numberOfLines={1} style={[t, { flex: 1, fontSize: fs.caption, fontWeight: "600", color: colors.body }]}>
          {url}
        </Text>
      </View>

      <View style={{ gap: 9, marginTop: 14 }}>
        <Button size="lg" block onPress={onCopy}>
          {copied ? "링크가 복사되었습니다" : "링크 복사"}
        </Button>
        <Button variant="outline" block onPress={onClose}>
          닫기
        </Button>
      </View>
    </Sheet>
  );
}

export function Toast({ message, bottom }: { message: string; bottom: number }) {
  if (!message) return null;
  return (
    <View
      accessibilityLiveRegion="polite"
      /* 떠 있는 면이라 라운드는 lg 다(알약이던 자리). 체크는 흰색 — 새 규칙에 teal 이 없고,
         성공 초록(#1A7F53)은 gray-900 면 위에서 대비가 안 나온다. */
      style={[{ position: "absolute", left: 20, right: 20, bottom, backgroundColor: colors.gray[900], borderRadius: radius.lg, paddingVertical: 12, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 9, pointerEvents: "none" }, shadow.lg]}
    >
      <Icon name="check" size={16} color="#fff" strokeWidth={2.6} />
      <Text style={[t, { fontSize: fs.caption, fontWeight: "700", color: "#fff" }]}>{message}</Text>
    </View>
  );
}
