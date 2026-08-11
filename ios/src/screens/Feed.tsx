import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Icon } from "../icons";
import { CAT_CHIPS, type CategoryKey, type Petition } from "../data";
import { count, ddayLabel, type Filter, type Sort, type Tab } from "../logic";
import { Card, CategoryTag, EmpathyButton, LogoMark, StatusBadge, ThresholdBar } from "../ui";
import { colors, font, gradient, radius } from "../theme";
import type { Votes } from "../logic";

const t = { fontFamily: font };

export type FeedProps = {
  petitions: Petition[];
  votes: Votes;
  filter: Filter;
  list: Petition[];
  mineCount: number;
  answeredCount: number;
  hasUnread: boolean;
  searchOpen: boolean;
  onToggleSearch: () => void;
  onQuery: (q: string) => void;
  onCategory: (c: CategoryKey | "all") => void;
  onSort: (s: Sort) => void;
  onOpen: (id: number) => void;
  onVote: (id: number) => void;
  onOpenMy: () => void;
};

export function FeedScreen(p: FeedProps) {
  const { tab } = p.filter;

  return (
    <View className="flex-1 bg-page">
      {/* 제목은 탭과 무관하게 서비스 이름으로 고정한다 — 무슨 목록인지는 아래 머리말이 말한다. */}
      <Header title="성공잇다" hasUnread={p.hasUnread} onToggleSearch={p.onToggleSearch} onOpenMy={p.onOpenMy} />
      <ScrollView stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false}>
        <Banner tab={tab} petitions={p.petitions} mineCount={p.mineCount} answeredCount={p.answeredCount} />
        <FilterBar {...p} />
        <View style={{ gap: 12, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 26 }}>
          {p.list.map((item) => (
            <PetitionCard key={item.id} p={item} votes={p.votes} onOpen={p.onOpen} onVote={p.onVote} />
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
      <LogoMark size={32} />
      <Text style={[t, { fontWeight: "800", fontSize: 17, color: colors.strong, letterSpacing: -0.17 }]}>{title}</Text>

      <View className="ml-auto flex-row items-center">
        <Pressable onPress={onToggleSearch} accessibilityRole="button" accessibilityLabel="건의 검색" className="w-9 h-9 items-center justify-center rounded-full">
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

function Banner({
  tab,
  petitions,
  mineCount,
  answeredCount,
}: {
  tab: Tab;
  petitions: Petition[];
  mineCount: number;
  answeredCount: number;
}) {
  /* 답변 완료·내 건의 머리말은 웹 PageIntro 와 같은 문구다.
     건수는 카테고리·검색 필터 전 전체 기준이다(mineCount 와 같은 방식) — 웹 PageIntro 의
     count 도 필터 전 base.length 를 쓴다(FeedScreen.jsx:128,130). 필터된 p.list.length 를
     쓰면 카테고리를 바꿀 때마다 이 숫자가 요동친다. */
  if (tab === "answered") {
    return (
      <View className="bg-card border-b border-subtle" style={{ paddingVertical: 16, paddingHorizontal: 18 }}>
        <Text style={[t, { fontSize: 18, fontWeight: "800", color: colors.strong }]}>
          답변 완료 <Text style={{ color: colors.success }}>{answeredCount}건</Text>
        </Text>
        <Text style={[t, { fontSize: 12.5, color: colors.muted, marginTop: 4, lineHeight: 19.4 }]}>학교가 공식 답변을 등록한 건의입니다.</Text>
      </View>
    );
  }

  if (tab === "mine") {
    return (
      <View className="bg-card border-b border-subtle" style={{ paddingVertical: 16, paddingHorizontal: 18 }}>
        <Text style={[t, { fontSize: 18, fontWeight: "800", color: colors.strong }]}>
          내 건의 <Text style={{ color: colors.indigo[600] }}>{mineCount}건</Text>
        </Text>
        <Text style={[t, { fontSize: 12.5, color: colors.muted, marginTop: 4, lineHeight: 19.4 }]}>이 목록은 본인에게만 보입니다. 다른 학생에게는 익명으로 표시됩니다.</Text>
      </View>
    );
  }

  return (
    <LinearGradient {...gradient.hero} style={{ paddingTop: 20, paddingHorizontal: 18, paddingBottom: 22, overflow: "hidden" }}>
      <View style={{ position: "absolute", right: -50, top: -40, width: 190, height: 190, borderRadius: 95, backgroundColor: "rgba(255,255,255,.07)" }} />
      <Text style={[t, { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,.85)" }]}>익명 건의 · 공감으로 움직이는 캠퍼스</Text>
      <Text style={[t, { fontSize: 21, fontWeight: "800", color: "#fff", lineHeight: 27.7, marginTop: 5, letterSpacing: -0.21 }]}>당신의 목소리를 들려주세요</Text>
      <Text style={[t, { fontSize: 12.5, color: "rgba(255,255,255,.9)", lineHeight: 19.5, marginTop: 8 }]}>
        공감 수가 학과 정원 또는 전체 학생 대비 기준을 넘으면{"\n"}담당 부서로 자동 전달됩니다.
      </Text>
    </LinearGradient>
  );
}

function FilterBar(p: FeedProps) {
  const { category, sort, tab, query } = p.filter;
  const resultLabel = `${p.list.length}건`;

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
            placeholder="건의 검색"
            placeholderTextColor={colors.muted}
            autoFocus
            style={[t, { flex: 1, fontSize: 14, color: colors.strong, padding: 0 }]}
          />
        </View>
      ) : null}

      {/* 분류 칩 한 줄만 둔다 — 웹 FilterBar 와 같은 구성이다(상태 필터는 웹에 없다). */}
      <ChipRow>
        {CAT_CHIPS.map((c) => {
          const active = category === c.key;
          return (
            <Pressable
              key={c.key}
              onPress={() => p.onCategory(c.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: radius.pill,
                borderWidth: 1.5,
                backgroundColor: active ? colors.indigo[600] : "#fff",
                borderColor: active ? colors.indigo[600] : colors.line,
              }}
            >
              <Text style={[t, { fontSize: 14, fontWeight: "600", color: active ? "#fff" : colors.body }]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </ChipRow>

      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 17 }}>
        <Text style={[t, { fontSize: 12, color: colors.muted, fontWeight: "600" }]}>{resultLabel}</Text>
        <Pressable
          onPress={() => askSort(sort, p.onSort)}
          accessibilityRole="button"
          accessibilityLabel={`정렬 방식 · 현재 ${sortLabel(sort)}`}
          style={{ marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 5 }}
        >
          <Icon name="sort" size={14} color={colors.indigo[600]} />
          <Text style={[t, { fontSize: 12.5, fontWeight: "700", color: colors.indigo[600] }]}>{sortLabel(sort)}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const SORT_OPTIONS: { key: Sort; label: string }[] = [
  { key: "hot", label: "공감순" },
  { key: "new", label: "최신순" },
];

function sortLabel(s: Sort) {
  return (SORT_OPTIONS.find((o) => o.key === s) ?? SORT_OPTIONS[0]).label;
}

/* 웹은 드롭다운으로 정렬을 고른다. RN 에는 그 부품이 없고, 기본 Alert 의 버튼 목록이
   iOS 에서 액션시트처럼 뜬다 — ponytail: 새 라이브러리 없이 이걸 쓴다. */
function askSort(current: Sort, onSort: (s: Sort) => void) {
  Alert.alert("정렬 방식", undefined, [
    ...SORT_OPTIONS.map((o) => ({ text: o.key === current ? `${o.label} ✓` : o.label, onPress: () => onSort(o.key) })),
    { text: "취소", style: "cancel" as const },
  ]);
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 14 }}>
      {children}
    </ScrollView>
  );
}

function PetitionCard({ p, votes, onOpen, onVote }: { p: Petition; votes: Votes; onOpen: (id: number) => void; onVote: (id: number) => void }) {
  const c = count(p, votes);

  return (
    <Pressable onPress={() => onOpen(p.id)} accessibilityRole="button">
      {/* 웹 PetitionCard 와 같은 구성이다 — 분류·상태 / 제목만 / 도달률 / 작성자·D-day·댓글 + 공감. */}
      <Card style={{ gap: 11 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <CategoryTag category={p.category} size="sm" />
          <StatusBadge status={p.status} size="sm" />
        </View>

        <Text style={[t, { fontWeight: "700", fontSize: 15.5, color: colors.strong, lineHeight: 21.7, letterSpacing: -0.155 }]}>{p.title}</Text>

        <ThresholdBar current={c} threshold={p.threshold} basisLabel={p.basis} size="sm" />

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={[t, { fontSize: 11.5, color: colors.muted }]}>
              {p.author} · {ddayLabel(p)}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Icon name="message" size={14} color={colors.muted} />
              <Text style={[t, { fontSize: 11.5, color: colors.muted }]}>{p.comments}</Text>
            </View>
          </View>
          <EmpathyButton count={c} active={!!votes[p.id]} size="sm" onToggle={() => onVote(p.id)} />
        </View>
      </Card>
    </Pressable>
  );
}

function Empty({ tab }: { tab: Tab }) {
  const title = tab === "answered" ? "답변 완료된 건의가 없습니다" : "조건에 맞는 건의가 없습니다";
  const body = tab === "answered" ? "학교가 공식 답변을 등록하면 여기에 모입니다." : "다른 분류를 선택해 주세요.";
  return (
    <View style={{ backgroundColor: "#fff", borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.line, borderRadius: radius.lg, paddingVertical: 44, paddingHorizontal: 20, alignItems: "center" }}>
      <Text style={[t, { fontSize: 14.5, fontWeight: "700", color: colors.strong }]}>{title}</Text>
      <Text style={[t, { fontSize: 12.5, color: colors.muted, marginTop: 5 }]}>{body}</Text>
    </View>
  );
}
