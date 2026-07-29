import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Icon } from "../icons";
import { CAT_CHIPS, STATUS_CHIPS, type CategoryKey, type Petition, type StatusKey } from "../data";
import { count, remain, type Filter, type Sort, type Tab } from "../logic";
import { Card, CategoryTag, EmpathyButton, StatusBadge, ThresholdBar, fmt } from "../ui";
import { colors, font, gradient, radius } from "../theme";
import type { Votes } from "../logic";

const t = { fontFamily: font };

/* 상태 칩의 점 색은 StatusBadge 의 점과 다르다 — 원본 STATUS_DOT 을 그대로 따른다. */
const STATUS_DOT: Record<StatusKey | "all", string> = {
  all: colors.gray[300],
  received: colors.gray[400],
  reviewing: colors.status["review-fg"],
  answered: colors.success,
};

export type FeedProps = {
  petitions: Petition[];
  votes: Votes;
  filter: Filter;
  list: Petition[];
  soonCount: number;
  mineCount: number;
  hasUnread: boolean;
  searchOpen: boolean;
  onToggleSearch: () => void;
  onQuery: (q: string) => void;
  onStatus: (s: StatusKey | "all") => void;
  onCategory: (c: CategoryKey | "all") => void;
  onSort: () => void;
  onOpen: (id: number) => void;
  onVote: (id: number) => void;
  onOpenMy: () => void;
};

export function FeedScreen(p: FeedProps) {
  const { tab } = p.filter;
  const title = tab === "soon" ? "임계치 임박" : tab === "mine" ? "내 청원" : "청원시스템";

  return (
    <View className="flex-1 bg-page">
      <Header title={title} hasUnread={p.hasUnread} onToggleSearch={p.onToggleSearch} onOpenMy={p.onOpenMy} />
      <ScrollView stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false}>
        <Banner tab={tab} petitions={p.petitions} mineCount={p.mineCount} />
        <FilterBar {...p} />
        <View style={{ gap: 12, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 26 }}>
          {p.list.map((item) => (
            <PetitionCard key={item.id} p={item} votes={p.votes} tab={tab} onOpen={p.onOpen} onVote={p.onVote} />
          ))}
          {p.list.length === 0 ? <Empty tab={tab} /> : null}
        </View>
      </ScrollView>
    </View>
  );
}

function Header({ title, hasUnread, onToggleSearch, onOpenMy }: { title: string; hasUnread: boolean; onToggleSearch: () => void; onOpenMy: () => void }) {
  return (
    <View className="flex-row items-center gap-[10px] px-[14px] bg-card border-b border-subtle" style={{ height: 52 }}>
      <LinearGradient {...gradient.hero} style={{ width: 32, height: 32, borderRadius: 10, flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 2.5, paddingBottom: 8 }}>
        <View style={{ width: 3.5, height: 7, borderRadius: 2, backgroundColor: "rgba(255,255,255,.55)" }} />
        <View style={{ width: 3.5, height: 11, borderRadius: 2, backgroundColor: "rgba(255,255,255,.8)" }} />
        <View style={{ width: 3.5, height: 15, borderRadius: 2, backgroundColor: "#fff" }} />
      </LinearGradient>
      <Text style={[t, { fontWeight: "800", fontSize: 17, color: colors.strong, letterSpacing: -0.17 }]}>{title}</Text>

      <View className="ml-auto flex-row items-center">
        <Pressable onPress={onToggleSearch} accessibilityRole="button" accessibilityLabel="청원 검색" className="w-9 h-9 items-center justify-center rounded-full">
          <Icon name="search" size={19} color={colors.body} />
        </Pressable>
        <Pressable onPress={onOpenMy} accessibilityRole="button" accessibilityLabel="알림" className="w-9 h-9 items-center justify-center rounded-full">
          <Icon name="bell" size={19} color={colors.body} />
          {hasUnread ? <View style={{ position: "absolute", top: 5, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.coral[500], borderWidth: 1.5, borderColor: "#fff" }} /> : null}
        </Pressable>
      </View>
    </View>
  );
}

function Banner({ tab, petitions, mineCount }: { tab: Tab; petitions: Petition[]; mineCount: number }) {
  if (tab === "soon") {
    return (
      <LinearGradient {...gradient.mileage} style={{ padding: 18 }}>
        <Text style={[t, { fontSize: 18, fontWeight: "800", color: "#fff", letterSpacing: -0.18 }]}>임계치 임박 청원</Text>
        <Text style={[t, { fontSize: 12.5, color: "rgba(255,255,255,.88)", marginTop: 5, lineHeight: 19.4 }]}>임계치의 40% 이상 모인 청원입니다. 남은 인원이 적은 순으로 보여드립니다.</Text>
      </LinearGradient>
    );
  }

  if (tab === "mine") {
    return (
      <View className="bg-card border-b border-subtle" style={{ paddingVertical: 16, paddingHorizontal: 18 }}>
        <Text style={[t, { fontSize: 18, fontWeight: "800", color: colors.strong }]}>
          내 청원 <Text style={{ color: colors.indigo[600] }}>{mineCount}건</Text>
        </Text>
        <Text style={[t, { fontSize: 12.5, color: colors.muted, marginTop: 4, lineHeight: 19.4 }]}>이 목록은 본인에게만 보입니다. 다른 학생에게는 익명으로 표시됩니다.</Text>
      </View>
    );
  }

  const stats = [
    { value: `${petitions.length}건`, label: "진행 중 청원" },
    { value: `${petitions.filter((x) => x.status !== "received").length}건`, label: "검토·답변" },
    { value: "88%", label: "답변률" },
  ];

  return (
    <LinearGradient {...gradient.hero} style={{ paddingTop: 20, paddingHorizontal: 18, paddingBottom: 22, overflow: "hidden" }}>
      <View style={{ position: "absolute", right: -50, top: -40, width: 190, height: 190, borderRadius: 95, backgroundColor: "rgba(255,255,255,.07)" }} />
      <Text style={[t, { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,.85)" }]}>익명 건의 · 공감으로 움직이는 캠퍼스</Text>
      <Text style={[t, { fontSize: 21, fontWeight: "800", color: "#fff", lineHeight: 27.7, marginTop: 5, letterSpacing: -0.21 }]}>공감이 임계치를 넘으면{"\n"}학교가 답합니다</Text>
      <View style={{ flexDirection: "row", gap: 26, marginTop: 16 }}>
        {stats.map((s) => (
          <View key={s.label}>
            <Text style={[t, { fontSize: 22, fontWeight: "800", color: "#fff" }]}>{s.value}</Text>
            <Text style={[t, { fontSize: 11.5, color: "rgba(255,255,255,.8)", fontWeight: "500", marginTop: 1 }]}>{s.label}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

function FilterBar(p: FeedProps) {
  const { status, category, sort, tab, query } = p.filter;
  const resultLabel = tab === "soon" ? `${p.list.length}건 · 남은 인원 적은 순` : `${p.list.length}건`;

  return (
    /* 원본은 rgba(255,255,255,.94) + backdrop-filter 다. RN 에 blur 가 없어 반투명만 남기면
       밑을 지나가는 카드가 비쳐 고장처럼 보인다. ponytail: expo-blur 대신 불투명 흰색. */
    <View style={{ backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.subtle, paddingTop: 12, paddingBottom: 10, gap: 9 }}>
      {p.searchOpen ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 14, marginBottom: 2, backgroundColor: colors.gray[100], borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: 14 }}>
          <Icon name="search" size={16} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={p.onQuery}
            placeholder="청원 검색"
            placeholderTextColor={colors.muted}
            autoFocus
            style={[t, { flex: 1, fontSize: 14, color: colors.strong, padding: 0 }]}
          />
        </View>
      ) : null}

      <ChipRow label="상태">
        {STATUS_CHIPS.map((c) => {
          const active = status === c.key;
          return (
            <Pressable
              key={c.key}
              onPress={() => p.onStatus(c.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingVertical: 6,
                paddingHorizontal: 14,
                borderRadius: radius.pill,
                borderWidth: 1.5,
                backgroundColor: active ? colors.indigo[600] : "#fff",
                borderColor: active ? colors.indigo[600] : colors.line,
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: active ? "rgba(255,255,255,.8)" : STATUS_DOT[c.key] }} />
              <Text style={[t, { fontSize: 13, fontWeight: "700", color: active ? "#fff" : colors.body }]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </ChipRow>

      <View style={{ height: 1, backgroundColor: colors.subtle, marginTop: 1, marginHorizontal: 16 }} />

      <ChipRow label="분류">
        {CAT_CHIPS.map((c) => {
          const active = category === c.key;
          return (
            <Pressable
              key={c.key}
              onPress={() => p.onCategory(c.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 14,
                borderRadius: radius.sm,
                borderWidth: 1.5,
                backgroundColor: active ? colors.indigo[50] : colors.gray[100],
                borderColor: active ? colors.indigo[600] : "transparent",
              }}
            >
              <Text style={[t, { fontSize: 13, fontWeight: "700", color: active ? colors.indigo[700] : colors.muted }]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </ChipRow>

      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 17 }}>
        <Text style={[t, { fontSize: 12, color: colors.muted, fontWeight: "600" }]}>{resultLabel}</Text>
        {tab !== "soon" ? (
          <Pressable onPress={p.onSort} accessibilityRole="button" style={{ marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Icon name="sort" size={14} color={colors.indigo[600]} />
            <Text style={[t, { fontSize: 12.5, fontWeight: "700", color: colors.indigo[600] }]}>{sortLabel(sort)}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function sortLabel(s: Sort) {
  return s === "hot" ? "공감순" : "최신순";
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 14 }}>
      <Text style={[t, { width: 26, fontSize: 10.5, fontWeight: "800", color: colors.gray[400] }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
        {children}
      </ScrollView>
    </View>
  );
}

function PetitionCard({ p, votes, tab, onOpen, onVote }: { p: Petition; votes: Votes; tab: Tab; onOpen: (id: number) => void; onVote: (id: number) => void }) {
  const c = count(p, votes);
  const left = remain(p, votes);

  return (
    <Pressable onPress={() => onOpen(p.id)} accessibilityRole="button">
      <Card style={{ gap: 11 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <CategoryTag category={p.category} size="sm" />
          <StatusBadge status={p.status} size="sm" />
          <Text style={[t, { marginLeft: "auto", fontSize: 11.5, color: colors.muted, fontWeight: "600" }]}>{p.date}</Text>
        </View>

        <Text style={[t, { fontWeight: "700", fontSize: 15.5, color: colors.strong, lineHeight: 21.7, letterSpacing: -0.155 }]}>{p.title}</Text>
        <Text style={[t, { fontSize: 13, color: colors.muted, lineHeight: 20.8 }]}>{p.excerpt}</Text>

        <ThresholdBar current={c} threshold={p.threshold} basisLabel={p.basis} size="sm" />

        {tab === "soon" && left > 0 ? <Text style={[t, { fontSize: 11.5, fontWeight: "800", color: colors.magenta[600] }]}>임계치까지 {fmt(left)}명 남음</Text> : null}

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <Text style={[t, { fontSize: 11.5, color: colors.muted }]}>
            {p.author} · 댓글 {p.comments}
          </Text>
          <EmpathyButton count={c} active={!!votes[p.id]} size="sm" onToggle={() => onVote(p.id)} />
        </View>
      </Card>
    </Pressable>
  );
}

function Empty({ tab }: { tab: Tab }) {
  const title = tab === "soon" ? "임박한 청원이 없습니다" : "조건에 맞는 청원이 없습니다";
  const body = tab === "soon" ? "임계치의 40% 이상 모인 청원이 아직 없습니다." : "다른 상태나 카테고리를 선택해 주세요.";
  return (
    <View style={{ backgroundColor: "#fff", borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.line, borderRadius: radius.lg, paddingVertical: 44, paddingHorizontal: 20, alignItems: "center" }}>
      <Text style={[t, { fontSize: 14.5, fontWeight: "700", color: colors.strong }]}>{title}</Text>
      <Text style={[t, { fontSize: 12.5, color: colors.muted, marginTop: 5 }]}>{body}</Text>
    </View>
  );
}
