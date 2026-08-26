/* 알림 설정 (이슈 #86). MY > 알림 설정 행에서 들어온다. 웹 NotificationSettingsScreen.jsx 와 짝이다.

   백엔드 NotificationEventService 가 알림을 만드는 지점 5곳(data.ts NOTIF_POINTS)을 보여주고,
   각 포인트로 실제 받은 알림을 그 자리에서 걸러 볼 수 있게 한다.

   종류별 on/off 토글은 PATCH /connect/users/me/notification-settings로 변경하고,
   서버가 돌려준 5개 전체 설정으로 상태를 덮는다.

   기기 단위 on/off 는 iOS 알림 권한이 담당한다: 아직 안 물어봤으면 여기서 묻고(권한 허용 →
   FCM 토큰 등록까지), 이미 껐으면 설정 앱으로 보낸다. */
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { NOTIF_POINTS, pointOf, type NotifPoint, type Notification, type NotificationSettingKey } from "../data";
import type { NotificationSettings } from "../api";
import { Icon } from "../icons";
import { openSystemNotificationSettings, pushPermissionStatus, registerForPush, type PushStatus } from "../push";
import { Button } from "../ui";
import { colors, font, radius, shadow } from "../theme";

const t = { fontFamily: font };
const card = { marginHorizontal: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.subtle, borderRadius: radius.lg } as const;

export type NotifSettingsProps = {
  notifications: Notification[];
  /** 서버가 아직 안 내려주면 null — 토글을 잠근다. */
  settings: NotificationSettings | null;
  onBack: () => void;
  onOpenNotification: (n: Notification) => void;
  onMarkAllNotifRead: () => void;
  onToggleSetting: (key: NotificationSettingKey, next: boolean) => Promise<void>;
};

/* MY 에서 옮겨온 토글. 이제 여기서만 쓴다. */
function Toggle({ on, label, disabled, onPress }: { on: boolean; label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: on, disabled }}
      style={{ width: 44, height: 26, borderRadius: 99, backgroundColor: on ? colors.indigo[600] : colors.gray[150], opacity: disabled ? 0.45 : 1 }}
    >
      <View style={[{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" }, shadow.sm]} />
    </Pressable>
  );
}

const PUSH_COPY: Record<PushStatus, { title: string; desc: string; action: string | null }> = {
  granted: {
    title: "푸시 알림 켜짐",
    desc: "아래에서 켜 둔 종류의 알림을 이 기기로 보내드려요.",
    action: null,
  },
  undetermined: {
    title: "푸시 알림 꺼짐",
    desc: "켜두면 내 건의와 댓글에 생긴 일을 바로 알려드려요.",
    action: "알림 켜기",
  },
  denied: {
    title: "푸시 알림 꺼짐",
    desc: "기기 설정에서 성공잇다 알림을 허용하면 다시 받을 수 있어요. 앱 안 알림함은 그대로 쌓여요.",
    action: "기기 설정 열기",
  },
};

function PointRow({
  point,
  total,
  unread,
  selected,
  enabled,
  pending,
  onPress,
  onToggle,
}: {
  point: NotifPoint;
  total: number;
  unread: number;
  selected: boolean;
  enabled: boolean;
  pending: boolean;
  onPress: () => void;
  onToggle: () => void;
}) {
  return (
    <View
      style={[
        { marginHorizontal: 16, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12, padding: 15, borderRadius: radius.lg, borderWidth: 1 },
        selected
          ? { backgroundColor: colors.indigo[50], borderColor: colors.indigo[200] }
          : { backgroundColor: "#fff", borderColor: colors.subtle },
        shadow.sm,
      ]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={{ flex: 1, flexDirection: "row", gap: 12 }}
      >
        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: point.iconBg, alignItems: "center", justifyContent: "center", opacity: enabled ? 1 : 0.45 }}>
          <Icon name={point.icon} size={17} color={point.iconFg} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <Text style={[t, { fontSize: 13.5, fontWeight: "800", color: enabled ? colors.strong : colors.muted }]}>{point.title}</Text>
            {unread > 0 ? (
              <View style={{ backgroundColor: colors.coral[600], borderRadius: 99, paddingHorizontal: 7, paddingVertical: 1 }}>
                <Text style={[t, { fontSize: 10.5, fontWeight: "800", color: "#fff" }]}>{unread}</Text>
              </View>
            ) : null}
            {!enabled && !pending ? (
              <View style={{ backgroundColor: colors.gray[150], borderRadius: 99, paddingHorizontal: 7, paddingVertical: 1 }}>
                <Text style={[t, { fontSize: 10.5, fontWeight: "800", color: colors.gray[600] }]}>꺼짐</Text>
              </View>
            ) : null}
          </View>
          <Text style={[t, { fontSize: 11.5, color: colors.muted, marginTop: 4, lineHeight: 17.3 }]}>{point.desc}</Text>
          <Text style={[t, { fontSize: 11, fontWeight: "700", color: colors.muted, marginTop: 6 }]}>
            {total > 0 ? `지금까지 ${total}건 받음` : "아직 받은 알림 없음"}
          </Text>
        </View>
      </Pressable>
      <Toggle on={enabled} disabled={pending} label={`${point.title} 알림`} onPress={onToggle} />
    </View>
  );
}

export function NotifSettingsScreen(p: NotifSettingsProps) {
  const [status, setStatus] = useState<PushStatus>("granted");
  const [selected, setSelected] = useState<NotificationSettingKey | null>(null);
  const [saving, setSaving] = useState<NotificationSettingKey | null>(null);

  /* 응답이 비정상적으로 빠졌다면 전부 켜진 것으로 보이되 토글은 잠근다. */
  const ready = p.settings !== null;
  const isOn = (key: NotificationSettingKey) => (ready ? p.settings![key] !== false : true);

  const toggle = async (key: NotificationSettingKey) => {
    setSaving(key);
    try {
      await p.onToggleSetting(key, !isOn(key));
    } finally {
      setSaving(null);
    }
  };

  const refreshStatus = useCallback(() => {
    pushPermissionStatus().then(setStatus);
  }, []);
  useEffect(refreshStatus, [refreshStatus]);

  const push = PUSH_COPY[status];
  const onPushAction = async () => {
    if (status === "undetermined") {
      await registerForPush();
      refreshStatus();
      return;
    }
    openSystemNotificationSettings();
  };

  const selectedPoint = selected ? (NOTIF_POINTS.find((point) => point.key === selected) ?? null) : null;
  const shown = selectedPoint ? p.notifications.filter((n) => selectedPoint.types.includes(n.type)) : p.notifications;

  return (
    <View style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.subtle }}>
        <Pressable onPress={p.onBack} accessibilityRole="button" accessibilityLabel="뒤로">
          <Icon name="arrowLeft" size={20} color={colors.strong} />
        </Pressable>
        <Text style={[t, { fontSize: 16, fontWeight: "800", color: colors.strong }]}>알림 설정</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: 14, paddingBottom: 40 }}>
        <View style={[card, { flexDirection: "row", alignItems: "center", gap: 12, padding: 15 }, shadow.sm]}>
          <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: status === "granted" ? colors.indigo[50] : colors.gray[150], alignItems: "center", justifyContent: "center" }}>
            <Icon name="bell" size={17} color={status === "granted" ? colors.indigo[600] : colors.gray[600]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[t, { fontSize: 13.5, fontWeight: "800", color: colors.strong }]}>{push.title}</Text>
            <Text style={[t, { fontSize: 11.5, color: colors.muted, marginTop: 4, lineHeight: 17.3 }]}>{push.desc}</Text>
          </View>
        </View>
        {push.action ? (
          <View style={{ marginHorizontal: 16, marginTop: 10 }}>
            <Button block onPress={onPushAction}>{push.action}</Button>
          </View>
        ) : null}

        <Text style={[t, { fontSize: 13, fontWeight: "800", color: colors.strong, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 }]}>알림 종류</Text>
        <Text style={[t, { fontSize: 11.5, color: colors.muted, paddingHorizontal: 16, paddingBottom: 12, lineHeight: 17.3 }]}>
          {ready
            ? "받고 싶은 알림만 골라서 켜고 끌 수 있어요. 항목을 누르면 그 알림만 모아서 볼 수 있어요."
            : "종류별로 끄고 켜는 기능은 준비 중이에요. 지금은 모든 알림을 받고 있어요."}
        </Text>
        {NOTIF_POINTS.map((point) => {
          const mine = p.notifications.filter((n) => point.types.includes(n.type));
          return (
            <PointRow
              key={point.key}
              point={point}
              total={mine.length}
              unread={mine.filter((n) => !n.read).length}
              selected={selected === point.key}
              enabled={isOn(point.key)}
              pending={!ready || saving === point.key}
              onPress={() => setSelected(selected === point.key ? null : point.key)}
              onToggle={() => toggle(point.key)}
            />
          );
        })}

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 }}>
          <Text style={[t, { fontSize: 13, fontWeight: "800", color: colors.strong }]}>
            {selectedPoint ? `${selectedPoint.title} 알림` : "받은 알림 전체"}
          </Text>
          <Text style={[t, { fontSize: 12, fontWeight: "700", color: colors.muted }]}>{shown.length}건</Text>
          {selectedPoint ? (
            <Pressable onPress={() => setSelected(null)} accessibilityRole="button">
              <Text style={[t, { fontSize: 12, fontWeight: "700", color: colors.indigo[600] }]}>전체 보기</Text>
            </Pressable>
          ) : null}
          {p.notifications.length > 0 ? (
            <Pressable onPress={p.onMarkAllNotifRead} accessibilityRole="button" style={{ marginLeft: "auto" }}>
              <Text style={[t, { fontSize: 12, fontWeight: "700", color: colors.indigo[600] }]}>전체 읽음</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={[card, { overflow: "hidden" }, shadow.sm]}>
          {shown.length === 0 ? (
            <Text style={[t, { fontSize: 12.5, color: colors.muted, paddingVertical: 18, paddingHorizontal: 15 }]}>해당하는 알림이 없습니다.</Text>
          ) : (
            shown.map((n, i) => {
              const point = pointOf(n.type);
              return (
                <Pressable
                  key={n.id}
                  onPress={() => p.onOpenNotification(n)}
                  accessibilityRole="button"
                  style={{
                    flexDirection: "row",
                    gap: 11,
                    paddingVertical: 13,
                    paddingHorizontal: 15,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: colors.subtle,
                    backgroundColor: n.read ? "transparent" : colors.indigo[50],
                  }}
                >
                  <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: point.iconBg, alignItems: "center", justifyContent: "center" }}>
                    <Icon name={point.icon} size={15} color={point.iconFg} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[t, { fontSize: 13, color: colors.body, lineHeight: 20.2 }]}>
                      <Text style={{ fontWeight: "700", color: colors.strong }}>{n.title}</Text> · {n.body}
                    </Text>
                    <Text style={[t, { fontSize: 11, color: colors.muted, marginTop: 3 }]}>{n.date}</Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
