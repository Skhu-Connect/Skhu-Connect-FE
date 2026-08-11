import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PREF_ROWS, type MyComment, type Notification, type Petition, type PrefKey } from "../data";
import { listDepartments } from "../api";
import { Avatar, Button, Input, Select } from "../ui";
import { colors, font, gradient, radius, shadow } from "../theme";

const t = { fontFamily: font };
const PAGE_SIZE = 5;

export type MyProps = {
  me: { loginId: string; departmentName: string } | null;
  mineCount: number;
  voteCount: number;
  answeredCount: number;
  notifications: Notification[];
  bookmarks: Petition[];
  myComments: MyComment[];
  prefs: Record<PrefKey, boolean>;
  onTogglePref: (k: PrefKey) => void;
  onOpenPetition: (id: number) => void;
  onOpenNotification: (n: Notification) => void;
  onMarkAllNotifRead: () => void;
  onLogout: () => void;
  onDeleteAccount: (password: string) => Promise<void>;
  onUpdateDepartment: (departmentId: number, departmentName: string) => Promise<void>;
};

export function MyScreen(p: MyProps) {
  const [notifExpanded, setNotifExpanded] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [department, setDepartment] = useState(p.me?.departmentName ?? "");
  const [departmentError, setDepartmentError] = useState("");
  const [savingDepartment, setSavingDepartment] = useState(false);
  const shownNotifications = notifExpanded ? p.notifications : p.notifications.slice(0, PAGE_SIZE);
  const shownComments = commentsExpanded ? p.myComments : p.myComments.slice(0, PAGE_SIZE);
  const unread = p.notifications.filter((n) => !n.read).length;

  useEffect(() => {
    listDepartments().then(setDepartments).catch(() => setDepartmentError("학부 목록을 불러오지 못했습니다."));
  }, []);
  useEffect(() => setDepartment(p.me?.departmentName ?? ""), [p.me?.departmentName]);

  const saveDepartment = async () => {
    const selected = departments.find((item) => item.name === department);
    if (!selected) return setDepartmentError("학부를 선택해 주세요.");
    setSavingDepartment(true);
    setDepartmentError("");
    try {
      await p.onUpdateDepartment(selected.id, selected.name);
    } catch (e) {
      setDepartment(p.me?.departmentName ?? "");
      setDepartmentError(e instanceof TypeError ? "네트워크 연결을 확인해 주세요." : e instanceof Error ? e.message : "학부 정보 수정에 실패했습니다.");
    } finally {
      setSavingDepartment(false);
    }
  };

  const stats = [
    { value: p.mineCount, label: "등록한 건의" },
    { value: p.voteCount, label: "누른 공감" },
    { value: p.answeredCount, label: "받은 답변" },
  ];

  return (
    <View className="flex-1 bg-page">
      <View className="justify-center px-[18px] bg-card border-b border-subtle" style={{ height: 52 }}>
        <Text style={[t, { fontWeight: "800", fontSize: 17, color: colors.strong }]}>MY</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient {...gradient.hero} style={{ paddingTop: 20, paddingHorizontal: 18, paddingBottom: 24, flexDirection: "row", alignItems: "center", gap: 14, overflow: "hidden" }}>
          <View style={{ position: "absolute", right: -40, bottom: -70, width: 170, height: 170, borderRadius: 85, backgroundColor: "rgba(255,255,255,.06)" }} />
          <Avatar name={p.me?.loginId ?? ""} size={56} ring />
          <View>
            <Text style={[t, { fontSize: 18, fontWeight: "800", color: "#fff" }]}>{p.me?.loginId ?? ""}</Text>
            <Text style={[t, { fontSize: 12.5, color: "rgba(255,255,255,.85)", marginTop: 3 }]}>{p.me?.departmentName ?? ""}</Text>
          </View>
        </LinearGradient>

        <View style={{ flexDirection: "row", gap: 10, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 4 }}>
          {stats.map((s) => (
            <View key={s.label} style={[{ flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.subtle, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 12, alignItems: "center" }, shadow.sm]}>
              <Text style={[t, { fontSize: 19, fontWeight: "800", color: colors.indigo[600] }]}>{s.value}</Text>
              <Text style={[t, { fontSize: 11, color: colors.muted, fontWeight: "600", marginTop: 3 }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <SectionTitle style={{ paddingTop: 18 }}>소속 학부 수정</SectionTitle>
        <View style={[{ marginHorizontal: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.subtle, borderRadius: radius.lg, padding: 15, gap: 12 }, shadow.sm]}>
          <Select label="소속 학부" options={departments.map((item) => item.name)} value={department} onChange={setDepartment} placeholder="학부를 선택하세요" />
          {departmentError ? <Text style={[t, { fontSize: 12, color: colors.danger }]}>{departmentError}</Text> : null}
          <Button block disabled={savingDepartment || !departments.some((item) => item.name === department)} onPress={saveDepartment}>{savingDepartment ? "저장 중…" : "저장"}</Button>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 14, paddingHorizontal: 16, paddingBottom: 6 }}>
          <Text style={[t, { fontSize: 13, fontWeight: "800", color: colors.strong }]}>{unread > 0 ? `${unread}건 안 읽음` : "알림"}</Text>
          {p.notifications.length > 0 ? (
            <Pressable onPress={p.onMarkAllNotifRead} accessibilityRole="button" style={{ marginLeft: "auto" }}>
              <Text style={[t, { fontSize: 12.5, fontWeight: "600", color: colors.indigo[600] }]}>전체 읽음</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={[{ marginHorizontal: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.subtle, borderRadius: radius.lg, overflow: "hidden" }, shadow.sm]}>
          {p.notifications.length === 0 ? (
            <Text style={[t, { fontSize: 12.5, color: colors.muted, paddingVertical: 18, paddingHorizontal: 15 }]}>받은 알림이 없습니다.</Text>
          ) : (
            shownNotifications.map((n, i) => (
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
                <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: n.iconBg, alignItems: "center", justifyContent: "center" }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: n.iconFg }} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[t, { fontSize: 13, color: colors.body, lineHeight: 20.2 }]}>
                    <Text style={{ fontWeight: "700", color: colors.strong }}>{n.title}</Text> · {n.body}
                  </Text>
                  <Text style={[t, { fontSize: 11, color: colors.muted, marginTop: 3 }]}>{n.date}</Text>
                </View>
              </Pressable>
            ))
          )}
          {!notifExpanded && p.notifications.length > PAGE_SIZE ? <MoreButton onPress={() => setNotifExpanded(true)} /> : null}
        </View>

        <SectionTitle style={{ paddingTop: 18 }}>북마크한 건의</SectionTitle>
        <View style={[{ marginHorizontal: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.subtle, borderRadius: radius.lg, overflow: "hidden" }, shadow.sm]}>
          {p.bookmarks.length === 0 ? (
            <Text style={[t, { fontSize: 12.5, color: colors.muted, paddingVertical: 18, paddingHorizontal: 15 }]}>북마크한 건의가 없습니다.</Text>
          ) : (
            p.bookmarks.map((b, i) => (
              <Pressable
                key={b.id}
                onPress={() => p.onOpenPetition(b.id)}
                accessibilityRole="button"
                style={{ paddingVertical: 13, paddingHorizontal: 15, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.subtle }}
              >
                <Text numberOfLines={1} style={[t, { fontSize: 13, fontWeight: "700", color: colors.strong }]}>{b.title}</Text>
              </Pressable>
            ))
          )}
        </View>

        <SectionTitle style={{ paddingTop: 18 }}>알림 설정</SectionTitle>
        <View style={[{ marginHorizontal: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.subtle, borderRadius: radius.lg, paddingVertical: 6, paddingHorizontal: 15 }, shadow.sm]}>
          {PREF_ROWS.map((r, i) => (
            <View key={r.key} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.subtle }}>
              <View style={{ flex: 1 }}>
                <Text style={[t, { fontSize: 13.5, fontWeight: "700", color: colors.strong }]}>{r.title}</Text>
                <Text style={[t, { fontSize: 11.5, color: colors.muted, marginTop: 2, lineHeight: 17.3 }]}>{r.desc}</Text>
              </View>
              <Toggle on={p.prefs[r.key]} label={r.title} onPress={() => p.onTogglePref(r.key)} />
            </View>
          ))}
        </View>

        <SectionTitle style={{ paddingTop: 18 }}>내가 쓴 댓글</SectionTitle>
        <View style={[{ marginHorizontal: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.subtle, borderRadius: radius.lg, overflow: "hidden" }, shadow.sm]}>
          {p.myComments.length === 0 ? (
            <Text style={[t, { fontSize: 12.5, color: colors.muted, paddingVertical: 18, paddingHorizontal: 15 }]}>아직 작성한 댓글이 없습니다.</Text>
          ) : (
            shownComments.map((c, i) => (
              <Pressable
                key={c.id}
                onPress={() => p.onOpenPetition(c.petitionId)}
                accessibilityRole="button"
                style={{ paddingVertical: 13, paddingHorizontal: 15, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.subtle }}
              >
                <Text numberOfLines={2} style={[t, { fontSize: 13, color: colors.body, lineHeight: 19 }]}>{c.body}</Text>
                <Text style={[t, { fontSize: 11, color: colors.muted, marginTop: 3 }]}>{c.date}</Text>
              </Pressable>
            ))
          )}
          {!commentsExpanded && p.myComments.length > PAGE_SIZE ? <MoreButton onPress={() => setCommentsExpanded(true)} /> : null}
        </View>

        <View style={{ paddingTop: 20, paddingHorizontal: 16, paddingBottom: 32, gap: 14 }}>
          <Button variant="outline" block onPress={p.onLogout}>
            로그아웃
          </Button>
          <Pressable onPress={() => setDeleteOpen(true)} accessibilityRole="button" style={{ alignItems: "center", paddingVertical: 4 }}>
            <Text style={[t, { fontSize: 12.5, fontWeight: "600", color: colors.muted }]}>회원탈퇴</Text>
          </Pressable>
        </View>
      </ScrollView>

      {deleteOpen ? (
        <DeleteAccountSheet
          onClose={() => setDeleteOpen(false)}
          onSubmit={async (password) => {
            await p.onDeleteAccount(password);
            setDeleteOpen(false);
          }}
        />
      ) : null}
    </View>
  );
}

/* 신고 시트(Detail.tsx ReportSheet)와 같은 뼈대(스크림 + 하단 카드 폼)를 쓴다. */
function DeleteAccountSheet({ onClose, onSubmit }: { onClose: () => void; onSubmit: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!password.trim()) return setError("비밀번호를 입력해 주세요.");
    setBusy(true);
    try {
      await onSubmit(password);
    } catch (e) {
      // 네트워크 실패(fetch 가 던지는 TypeError)는 영어 원문이라 그대로 보여주지 않는다.
      setError(e instanceof TypeError ? "네트워크 연결을 확인해 주세요." : e instanceof Error ? e.message : "탈퇴 처리에 실패했습니다.");
      setBusy(false);
    }
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15, 23, 42, .45)" }}>
        <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28, gap: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={[t, { fontSize: 18, fontWeight: "800", color: colors.strong }]}>회원탈퇴</Text>
              <Text style={[t, { fontSize: 12.5, color: colors.muted, marginTop: 3 }]}>계정 삭제를 위해 가입한 비밀번호를 입력해 주세요.</Text>
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="탈퇴 창 닫기" hitSlop={10}>
              <Text style={[t, { fontSize: 15, fontWeight: "700", color: colors.muted }]}>닫기</Text>
            </Pressable>
          </View>
          <View style={{ backgroundColor: colors.page, borderRadius: 10, padding: 12 }}>
            <Text style={[t, { fontSize: 12, color: colors.muted, lineHeight: 18 }]}>
              탈퇴하면 계정 정보가 삭제되며, 이후 30일 동안은 같은 정보로 다시 가입할 수 없어요. 신중히 결정해 주세요.
            </Text>
          </View>
          <Input label="비밀번호" value={password} onChangeText={(v) => { setPassword(v); setError(""); }} placeholder="••••••••" secureTextEntry />
          {error ? <Text style={[t, { fontSize: 12, color: colors.danger }]}>{error}</Text> : null}
          <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <Pressable onPress={onClose} disabled={busy} accessibilityRole="button" style={{ paddingVertical: 11, paddingHorizontal: 16 }}>
              <Text style={[t, { fontSize: 14, fontWeight: "700", color: colors.body }]}>취소</Text>
            </Pressable>
            <Pressable
              onPress={submit}
              disabled={busy || !password.trim()}
              accessibilityRole="button"
              style={{ backgroundColor: colors.danger, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 16, opacity: busy || !password.trim() ? 0.5 : 1 }}
            >
              <Text style={[t, { fontSize: 14, fontWeight: "700", color: "#fff" }]}>{busy ? "처리 중…" : "탈퇴하기"}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function MoreButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.subtle, alignItems: "center" }}
    >
      <Text style={[t, { fontSize: 12.5, fontWeight: "700", color: colors.indigo[600] }]}>더보기</Text>
    </Pressable>
  );
}

function SectionTitle({ children, style }: { children: string; style?: object }) {
  return <Text style={[t, { paddingTop: 14, paddingHorizontal: 16, paddingBottom: 6, fontSize: 13, fontWeight: "800", color: colors.strong }, style]}>{children}</Text>;
}

function Toggle({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: on }}
      style={{ width: 44, height: 26, borderRadius: radius.pill, backgroundColor: on ? colors.indigo[600] : colors.gray[150] }}
    >
      <View style={[{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" }, shadow.sm]} />
    </Pressable>
  );
}
