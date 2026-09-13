import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { type MyComment, type Notification, type Petition } from "../data";
import { ApiError, listDepartments } from "../api";
import { Icon, type IconName } from "../icons";
import { PRIVACY_POLICY_URL, TERMS_URL } from "../legal";
import { Avatar, Button, Input, Select, Sheet } from "../ui";
import { type Tab, ymd } from "../logic";
import { colors, font, fs, radius } from "../theme";
import { PASSWORD_HINT, validatePassword } from "../credentials";

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
  onOpenNotifSettings: () => void;
  /** 통계 타일 → 하단 탭바의 같은 목록(내 건의·답변 완료). App.tsx 의 onTab 과 같은 것이다. */
  onOpenTab: (t: Tab) => void;
  /** "누른 요청"·"받은 답변" 타일이 띄우는 목록. 탭바에 자리가 없어 시트로 뺐다(웹은 각각 /voted, /my-answered 화면). */
  votedPetitions: Petition[];
  answeredPetitions: Petition[];
  onOpenPetition: (id: number) => void;
  onOpenNotification: (n: Notification) => void;
  onMarkAllNotifRead: () => void;
  onLogout: () => void;
  onDeleteAccount: (password: string) => Promise<void>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onUpdateDepartment: (departmentId: number, departmentName: string) => Promise<void>;
};

export function MyScreen(p: MyProps) {
  const [notifExpanded, setNotifExpanded] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [sheet, setSheet] = useState<"voted" | "answered" | null>(null);
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

  /* 통계는 그 숫자를 만든 목록으로 가는 지름길이다. "등록한 건의"만 하단 탭바에 같은 목록이
     있어 그리로 보내고, 나머지 둘은 탭바에 자리가 없어 시트로 띄운다(사용자 지시).
     "받은 답변"을 탭바의 "답변 완료"로 보내지 않는 이유: 그 탭은 전체 답변 완료 건의라 내 건의만
     세는 이 숫자와 목록이 어긋난다. */
  const stats: { value: number; label: string; tab?: Tab; sheet?: "voted" | "answered" }[] = [
    { value: p.mineCount, label: "등록한 건의", tab: "mine" },
    { value: p.voteCount, label: "누른 요청", sheet: "voted" },
    { value: p.answeredCount, label: "받은 답변", sheet: "answered" },
  ];

  return (
    <View className="flex-1 bg-page">
      <View className="justify-center px-[16px] bg-card border-b border-subtle" style={{ height: 52 }}>
        <Text style={[t, { fontWeight: "700", fontSize: fs.lg, color: colors.strong }]}>MY</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 그라데이션 머리와 장식 원, 링 아바타를 걷었다. 서버가 이름을 주지 않으므로 학부를
            주 정보로 올리고 아이디를 보조로 내린다(웹과 같은 판단). */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.subtle, paddingVertical: 24, paddingHorizontal: 16 }}>
          <Avatar name={p.me?.loginId ?? ""} size={56} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={[t, { fontSize: fs.xxl, fontWeight: "700", color: colors.strong, letterSpacing: -0.48 }]}>{p.me?.departmentName ?? ""}</Text>
            <Text numberOfLines={1} style={[t, { fontSize: fs.sm, color: colors.muted, marginTop: 4 }]}>{p.me?.loginId ?? ""}</Text>
          </View>
        </View>

        {/* 테두리 + 그림자 카드 세 장이던 자리 — 색 면을 깔지 않고 숫자 크기로만 세운다. */}
        <View style={{ flexDirection: "row", backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.subtle, paddingVertical: 20, paddingHorizontal: 16 }}>
          {stats.map((s) => {
            const face = (
              <>
                <Text style={[t, { fontSize: fs.xxl, fontWeight: "700", color: colors.strong, letterSpacing: -0.48, fontVariant: ["tabular-nums"] }]}>{s.value}</Text>
                <Text style={[t, { fontSize: fs.caption, color: colors.muted, marginTop: 4 }]}>{s.label}</Text>
              </>
            );
            const tab = s.tab;
            const sheetKey = s.sheet;
            const go = tab ? () => p.onOpenTab(tab) : sheetKey ? () => setSheet(sheetKey) : null;
            if (!go) return <View key={s.label} style={{ flex: 1 }}>{face}</View>;
            return (
              <Pressable key={s.label} onPress={go} accessibilityRole="button" accessibilityLabel={`${s.label} ${s.value}건 보기`} style={{ flex: 1 }}>
                {face}
              </Pressable>
            );
          })}
        </View>

        <Section title="소속 학부 수정">
          <View style={{ gap: 12, paddingTop: 12 }}>
            <Select label="소속 학부" options={departments.map((item) => item.name)} value={department} onChange={setDepartment} placeholder="학부를 선택하세요" />
            {departmentError ? <Text style={[t, { fontSize: fs.caption, color: colors.danger }]}>{departmentError}</Text> : null}
            <Button block disabled={savingDepartment || !departments.some((item) => item.name === department)} onPress={saveDepartment}>
              {savingDepartment ? "저장 중…" : "저장"}
            </Button>
          </View>
        </Section>

        <Section title="계정 정보 변경">
          <List>
            <Row icon="lock" label="비밀번호 변경" onPress={() => setChangePwOpen(true)} />
          </List>
        </Section>

        <Section
          title={unread > 0 ? `${unread}건 안 읽음` : "알림"}
          action={p.notifications.length > 0 ? { label: "전체 읽음", onPress: p.onMarkAllNotifRead } : undefined}
        >
          <List>
            {p.notifications.length === 0 ? (
              <Empty>받은 알림이 없습니다.</Empty>
            ) : (
              shownNotifications.map((n) => <NotifRow key={n.id} n={n} onPress={() => p.onOpenNotification(n)} />)
            )}
            {!notifExpanded && p.notifications.length > PAGE_SIZE ? <MoreButton onPress={() => setNotifExpanded(true)} /> : null}
          </List>
        </Section>

        <Section title="북마크한 건의">
          <List>
            {p.bookmarks.length === 0 ? (
              <Empty>북마크한 건의가 없습니다.</Empty>
            ) : (
              p.bookmarks.map((b) => (
                <Pressable key={b.id} onPress={() => p.onOpenPetition(b.id)} accessibilityRole="button" style={rowStyle}>
                  <Text numberOfLines={1} style={[t, { flex: 1, fontSize: fs.sm, fontWeight: "600", color: colors.strong }]}>{b.title}</Text>
                </Pressable>
              ))
            )}
          </List>
        </Section>

        {/* 저장할 곳이 없던 토글(도달률·답변)을 걷어내고, 백엔드가 실제로 알림을 보내는 5개 지점을
            보여주는 화면으로 넘긴다 — NotifSettings.tsx. */}
        <Section title="알림 설정">
          <List>
            <Row icon="bell" label="알림 종류" onPress={p.onOpenNotifSettings} />
          </List>
        </Section>

        <Section title="내가 쓴 댓글">
          <List>
            {p.myComments.length === 0 ? (
              <Empty>아직 작성한 댓글이 없습니다.</Empty>
            ) : (
              shownComments.map((c) => (
                <Pressable key={c.id} onPress={() => p.onOpenPetition(c.petitionId)} accessibilityRole="button" style={{ ...rowStyle, flexDirection: "column", alignItems: "flex-start" }}>
                  <Text numberOfLines={2} style={[t, { fontSize: fs.sm, color: colors.body, lineHeight: fs.sm * 1.5 }]}>{c.body}</Text>
                  <Text style={[t, { fontSize: fs.caption, color: colors.muted, marginTop: 4 }]}>{c.date}</Text>
                </Pressable>
              ))
            )}
            {!commentsExpanded && p.myComments.length > PAGE_SIZE ? <MoreButton onPress={() => setCommentsExpanded(true)} /> : null}
          </List>
        </Section>

        <Section title="도움말">
          <List>
            <HelpLinkRow label="이용약관 및 커뮤니티 정책" url={TERMS_URL} />
            <HelpLinkRow label="개인정보처리방침" url={PRIVACY_POLICY_URL} />
          </List>
        </Section>

        <View style={{ paddingTop: 28, paddingHorizontal: 16, paddingBottom: 40, gap: 16 }}>
          <Button variant="outline" block onPress={p.onLogout}>
            로그아웃
          </Button>
          <Pressable onPress={() => setDeleteOpen(true)} accessibilityRole="button" style={{ alignSelf: "flex-start" }}>
            <Text style={[t, { fontSize: fs.caption, color: colors.muted, textDecorationLine: "underline" }]}>회원탈퇴</Text>
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
      {changePwOpen ? <ChangePasswordSheet onClose={() => setChangePwOpen(false)} onSubmit={p.onChangePassword} /> : null}

      <PetitionSheet
        open={sheet === "voted"}
        onClose={() => setSheet(null)}
        badge="누른 요청"
        icon="heart"
        empty="요청을 누른 건의가 없습니다."
        list={p.votedPetitions}
        onOpenPetition={p.onOpenPetition}
      />
      <PetitionSheet
        open={sheet === "answered"}
        onClose={() => setSheet(null)}
        badge="받은 답변"
        icon="checkCircle"
        empty="답변을 받은 건의가 없습니다."
        list={p.answeredPetitions}
        onOpenPetition={p.onOpenPetition}
      />
    </View>
  );
}

/* 카드 상자 여섯 개가 쌓여 있던 것을 제목 + 머리선 목록으로 바꿨다(웹 .mypage-section-head / .mypage-list).
   제목·동작이 한 줄이다 — 동작을 제목 아래 따로 두면 붕 뜬 요소로 읽힌다. */
function Section({ title, action, children }: { title: string; action?: { label: string; onPress: () => void }; children: React.ReactNode }) {
  return (
    <View style={{ paddingTop: 28, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
        <Text style={[t, { fontSize: fs.lg, fontWeight: "700", color: colors.strong, letterSpacing: -0.34 }]}>{title}</Text>
        {action ? (
          <Pressable onPress={action.onPress} accessibilityRole="button" style={{ marginLeft: "auto" }} hitSlop={8}>
            <Text style={[t, { fontSize: fs.caption, fontWeight: "600", color: colors.indigo[600] }]}>{action.label}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: colors.subtle }}>{children}</View>;
}

const rowStyle = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  gap: 12,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: colors.subtle,
};

function Empty({ children }: { children: string }) {
  return <Text style={[t, { fontSize: fs.sm, color: colors.muted, paddingVertical: 24 }]}>{children}</Text>;
}

/* 화면 안 이동을 뜻하는 아이콘만 왼쪽에 둔다 — 밖으로 나가는 HelpLinkRow 와 구분된다. */
function Row({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={rowStyle}>
      <Icon name={icon} size={16} color={colors.muted} />
      <Text style={[t, { flex: 1, fontSize: fs.sm, fontWeight: "600", color: colors.strong }]}>{label}</Text>
      <Icon name="chevronRight" size={15} color={colors.muted} />
    </Pressable>
  );
}

/** 알림 한 줄. 피드 벨 시트의 행과 같은 모양이다 — 같은 알림을 두 곳에서 다르게 그리지 않는다.
    종류별 파스텔 타일을 걷고 중립 면 + 종류 아이콘으로 간다(웹 .notif-tile 과 같은 34px). */
function NotifRow({ n, onPress }: { n: Notification; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ ...rowStyle, alignItems: "flex-start" }}>
      <View style={{ width: 34, height: 34, borderRadius: radius.md, backgroundColor: colors.sunken, alignItems: "center", justifyContent: "center" }}>
        <Icon name={n.icon} size={17} color={colors.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[t, { fontSize: fs.caption, color: colors.body, lineHeight: 21.5 }]}>
          <Text style={{ fontWeight: "600", color: n.read ? colors.strong : colors.indigo[600] }}>{n.title}</Text> · {n.body}
        </Text>
        <Text style={[t, { fontSize: fs.caption, color: colors.muted, marginTop: 4 }]}>{n.date}</Text>
      </View>
    </Pressable>
  );
}

/* 통계가 띄우는 건의 목록. "누른 요청"·"받은 답변" 두 시트가 이름·아이콘·목록만 다르다.
   3건까지만 펼치고 나머지는 더보기로 넘긴다 — 시트는 화면 80% 까지 자라서 몇 건만 쌓여도
   화면을 덮는다(피드 벨 알림 시트와 같은 이유). */
const PETITION_PREVIEW = 3;

function PetitionSheet({
  open,
  onClose,
  badge,
  icon,
  empty,
  list,
  onOpenPetition,
}: {
  open: boolean;
  onClose: () => void;
  badge: string;
  icon: IconName;
  empty: string;
  list: Petition[];
  onOpenPetition: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? list : list.slice(0, PETITION_PREVIEW);
  /* 닫으면 다시 3건으로. 시트는 계속 마운트돼 있어서 펼친 상태가 남으면 다음에 열자마자 또 덮는다. */
  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

  return (
    <Sheet open={open} onClose={onClose} title={`${badge} ${list.length}건`}>
      {list.length === 0 ? (
        <Text style={[t, { fontSize: fs.sm, color: colors.muted, paddingVertical: 24 }]}>{empty}</Text>
      ) : (
        shown.map((item, i) => (
          <Pressable
            key={item.id}
            onPress={() => {
              onClose();
              onOpenPetition(item.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${badge} · ${item.title}`}
            style={{ flexDirection: "row", gap: 12, paddingVertical: 16, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.subtle }}
          >
            <View style={{ width: 34, height: 34, borderRadius: radius.md, backgroundColor: colors.sunken, alignItems: "center", justifyContent: "center" }}>
              <Icon name={icon} size={17} color={colors.muted} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={2} style={[t, { fontSize: fs.sm, fontWeight: "600", color: colors.strong, lineHeight: fs.sm * 1.5 }]}>{item.title}</Text>
              <Text numberOfLines={2} style={[t, { fontSize: fs.caption, color: colors.body, lineHeight: fs.caption * 1.6, marginTop: 6 }]}>{item.excerpt}</Text>
              <Text style={[t, { fontSize: fs.caption, color: colors.muted, marginTop: 6 }]}>{ymd(item.createdAt)}</Text>
            </View>
          </Pressable>
        ))
      )}
      {!expanded && list.length > PETITION_PREVIEW ? <MoreButton onPress={() => setExpanded(true)} /> : null}
    </Sheet>
  );
}

function ChangePasswordSheet({ onClose, onSubmit }: { onClose: () => void; onSubmit: (currentPassword: string, newPassword: string) => Promise<void> }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!current) return setError("현재 비밀번호를 입력해 주세요.");
    const passwordError = validatePassword(next, "새 비밀번호");
    if (passwordError) return setError(passwordError);
    if (next !== confirm) return setError("새 비밀번호가 서로 다릅니다.");
    setError("");
    setBusy(true);
    try {
      await onSubmit(current, next);
      setNotice("비밀번호가 변경되었습니다.");
    } catch (e) {
      setError(e instanceof ApiError && e.status === 400 ? "현재 비밀번호와 다른 새 비밀번호를 입력해 주세요." : e instanceof ApiError && e.status === 401 ? "현재 비밀번호가 올바르지 않습니다." : e instanceof ApiError && e.status === 404 ? "사용자 정보를 찾을 수 없습니다." : e instanceof TypeError ? "네트워크 연결을 확인해 주세요." : "비밀번호를 변경하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormSheet title="비밀번호 변경" desc="현재 비밀번호를 확인한 뒤 새 비밀번호로 바꿔드려요." onClose={onClose}>
      {notice ? (
        <>
          <View style={{ backgroundColor: colors.sunken, borderRadius: radius.md, padding: 12 }}>
            <Text style={[t, { fontSize: fs.caption, color: colors.body, lineHeight: fs.caption * 1.6 }]}>{notice}</Text>
          </View>
          <Button block onPress={onClose}>확인</Button>
        </>
      ) : (
        <>
          <Input label="현재 비밀번호" value={current} onChangeText={(v) => { setCurrent(v); setError(""); }} placeholder="••••••••" secureTextEntry />
          <Input label="새 비밀번호" hint={PASSWORD_HINT} value={next} onChangeText={(v) => { setNext(v); setError(""); }} placeholder="••••••••" secureTextEntry />
          <Input label="새 비밀번호 확인" value={confirm} onChangeText={(v) => { setConfirm(v); setError(""); }} placeholder="••••••••" secureTextEntry />
          {error ? <Text style={[t, { fontSize: fs.caption, color: colors.danger }]}>{error}</Text> : null}
          <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <Button variant="outline" onPress={onClose}>취소</Button>
            <Button disabled={busy} onPress={submit}>{busy ? "변경 중…" : "변경"}</Button>
          </View>
        </>
      )}
    </FormSheet>
  );
}

/* 신고 시트(reportSheet.tsx)와 같은 뼈대(스크림 + 하단 면)를 쓴다.
   공용 Sheet 로 합치지 않는 이유는 키보드 회피다 — 입력칸이 있는 시트만 KeyboardAvoidingView 를 쓴다. */
function FormSheet({ title, desc, onClose, children }: { title: string; desc: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(20,20,24,.45)" }}>
        <View style={{ backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: 20, paddingBottom: 28, gap: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={[t, { fontSize: fs.lg, fontWeight: "700", color: colors.strong }]}>{title}</Text>
              <Text style={[t, { fontSize: fs.caption, color: colors.muted, marginTop: 4, lineHeight: fs.caption * 1.5 }]}>{desc}</Text>
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="닫기" hitSlop={10}>
              <Icon name="x" size={18} color={colors.muted} />
            </Pressable>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

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
    <FormSheet title="회원탈퇴" desc="계정 삭제를 위해 가입한 비밀번호를 입력해 주세요." onClose={onClose}>
      <View style={{ backgroundColor: colors.sunken, borderRadius: radius.md, padding: 12 }}>
        <Text style={[t, { fontSize: fs.caption, color: colors.muted, lineHeight: fs.caption * 1.5 }]}>
          탈퇴하면 계정 정보가 삭제되며, 이후 30일 동안은 같은 정보로 다시 가입할 수 없어요. 신중히 결정해 주세요.
        </Text>
      </View>
      <Input label="비밀번호" value={password} onChangeText={(v) => { setPassword(v); setError(""); }} placeholder="••••••••" secureTextEntry />
      {error ? <Text style={[t, { fontSize: fs.caption, color: colors.danger }]}>{error}</Text> : null}
      <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
        <Button variant="outline" onPress={onClose}>취소</Button>
        {/* 탈퇴는 되돌릴 수 없어 위험색 채움을 쓴다 — 공용 Button 에는 없는 변형이라 여기서 그린다. */}
        <Pressable
          onPress={submit}
          disabled={busy || !password.trim()}
          accessibilityRole="button"
          accessibilityState={{ disabled: busy || !password.trim() }}
          style={{
            height: 44,
            paddingHorizontal: 18,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: radius.md,
            backgroundColor: busy || !password.trim() ? colors.sunken : colors.danger,
          }}
        >
          <Text style={[t, { fontSize: fs.body, fontWeight: "600", color: busy || !password.trim() ? colors.muted : "#fff" }]}>{busy ? "처리 중…" : "탈퇴하기"}</Text>
        </Pressable>
      </View>
    </FormSheet>
  );
}

function MoreButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ paddingVertical: 12, alignItems: "center" }}>
      <Text style={[t, { fontSize: fs.caption, fontWeight: "600", color: colors.muted }]}>더보기</Text>
    </Pressable>
  );
}

/* 회원가입 때 동의받은 약관 두 가지를 마이페이지에서도 다시 볼 수 있게 한다(사용자 지시).
   기기 내 브라우저로 연다 — Signup.tsx 의 "보기" 버튼과 같은 방식. */
function HelpLinkRow({ label, url }: { label: string; url: string }) {
  return (
    <Pressable onPress={() => WebBrowser.openBrowserAsync(url)} accessibilityRole="link" style={rowStyle}>
      <Text style={[t, { flex: 1, fontSize: fs.sm, fontWeight: "600", color: colors.strong }]}>{label}</Text>
      <Icon name="link" size={15} color={colors.muted} />
    </Pressable>
  );
}
