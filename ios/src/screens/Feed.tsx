import { useRef, useState } from "react";
import { Alert, type LayoutChangeEvent, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Icon } from "../icons";
import { CAT_CHIPS, type CategoryKey, type Petition } from "../data";
import { count, daysLeft, ddayLabel, type Filter, type Sort, type Tab } from "../logic";
import { CAT_ICON, Card, CategoryTag, EmpathyButton, LogoMark, StatusBadge, ThresholdBar, fmt } from "../ui";
import { ReportSheet } from "../reportSheet";
import type { ReportReasonType } from "../api";
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
  onBlock: (id: number) => void;
  onReport: (petitionId: number, reasonType: ReportReasonType, reasonDetail: string) => Promise<void>;
  onOpenMy: () => void;
};

export function FeedScreen(p: FeedProps) {
  const { tab } = p.filter;
  /* 상세까지 안 들어가고도 신고할 수 있게 카드 메뉴에 신고를 넣었다 — 시트는 상세와 같은 것을 쓴다. */
  const [reportId, setReportId] = useState<number | null>(null);

  /* 급상승 카드의 "더보기" 는 TOP 5 너머를 보여줄 별도 화면 대신 아래 목록을 전체·공감순으로
     맞춰 준다(사용자 지시). 스크롤까지 옮기지 않으면 화면 밖에서 정렬만 바뀌어 아무 일도 안 일어난
     것처럼 보인다 — 고정되는 FilterBar 의 y 로 옮겨 필터바가 상단에 붙고 목록이 바로 아래 오게 한다. */
  const scrollRef = useRef<ScrollView>(null);
  const filterY = useRef(0);
  const showAllByEmpathy = () => {
    p.onCategory("all");
    p.onSort("hot");
    scrollRef.current?.scrollTo({ y: filterY.current, animated: true });
  };

  return (
    <View className="flex-1 bg-page">
      {/* 제목은 탭과 무관하게 서비스 이름으로 고정한다 — 무슨 목록인지는 아래 머리말이 말한다. */}
      <Header title="성공잇다" hasUnread={p.hasUnread} onToggleSearch={p.onToggleSearch} onOpenMy={p.onOpenMy} />
      {/* 본문(건의 목록)이 먼저, 급상승·기간요약은 그 아래 보조 위젯으로 둔다 — 에브리타임 홈처럼
          목록에 바로 닿게 하려는 것(사용자 지시). 대시보드를 위에 두면 건의를 보려고 매번 그만큼
          스크롤해야 한다. */}
      <ScrollView ref={scrollRef} stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false}>
        <Banner tab={tab} petitions={p.petitions} mineCount={p.mineCount} answeredCount={p.answeredCount} />
        <FilterBar {...p} onLayout={(e) => { filterY.current = e.nativeEvent.layout.y; }} />
        <View style={{ gap: 12, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
          {p.list.map((item) => (
            <PetitionCard key={item.id} p={item} votes={p.votes} onOpen={p.onOpen} onVote={p.onVote} onBlock={p.onBlock} onReport={setReportId} />
          ))}
          {p.list.length === 0 ? <Empty tab={tab} /> : null}
        </View>
        <Dashboard tab={tab} petitions={p.petitions} query={p.filter.query} onOpen={p.onOpen} onMore={showAllByEmpathy} />
      </ScrollView>

      {reportId != null ? (
        <ReportSheet
          target="게시글"
          onClose={() => setReportId(null)}
          onSubmit={(reasonType, reasonDetail) => p.onReport(reportId, reasonType, reasonDetail)}
        />
      ) : null}
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

type PeriodKey = "day" | "week" | "month" | "all";

/* 급상승·기간요약이 공유하는 기간 정의. 웹 FeedScreen.jsx 와 같은 근사치를 쓴다 —
   ponytail: 백엔드 AgreementResponse 가 누적 agreementCount 만 주고 공감 이벤트 타임스탬프가
   없어(docs/api-spec.md), "그 기간에 새로 등록된 건의"만 걸러 그 건의들의 누적 공감 수를
   더하는 걸로 근사한다. 오래된 건의가 그 기간에 새로 받은 공감은 못 잡는다. */
const PERIODS: { key: PeriodKey; label: string; ms: number | null }[] = [
  { key: "day", label: "일간", ms: 86400000 },
  { key: "week", label: "주간", ms: 7 * 86400000 },
  { key: "month", label: "월간", ms: 30 * 86400000 },
  { key: "all", label: "전체", ms: null },
];

/* 제목 줄 오른쪽에 들어가므로 폭이 빠듯하다 — 웹(13/16pad)보다 촘촘한 값을 쓴다. */
function PeriodTabs({ period, onChange }: { period: PeriodKey; onChange: (k: PeriodKey) => void }) {
  return (
    <View style={{ flexDirection: "row", backgroundColor: colors.gray[100], borderRadius: radius.pill, padding: 3 }}>
      {PERIODS.map((per) => {
        const active = per.key === period;
        return (
          <Pressable
            key={per.key}
            onPress={() => onChange(per.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{ paddingVertical: 6, paddingHorizontal: 9, borderRadius: radius.pill, backgroundColor: active ? colors.indigo[600] : "transparent" }}
          >
            <Text style={[t, { fontSize: 11.5, fontWeight: "700", color: active ? "#fff" : colors.muted }]}>{per.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 급상승 건의 TOP 5 — 선택 기간에 새로 등록된 건의 중 공감순 상위 5건. */
function TrendingCard({
  list,
  period,
  onPeriod,
  onOpen,
  onMore,
}: {
  list: Petition[];
  period: PeriodKey;
  onPeriod: (k: PeriodKey) => void;
  onOpen: (id: number) => void;
  onMore: () => void;
}) {
  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
        <Icon name="trending" size={16} color={colors.indigo[600]} />
        {/* 기간 탭이 같은 줄을 나눠 쓰므로 제목은 줄어들 수 있게 둔다 — 좁은 기기에서 말줄임. */}
        <Text numberOfLines={1} style={[t, { flexShrink: 1, fontSize: 14, fontWeight: "800", color: colors.strong }]}>급상승 건의 TOP 5</Text>
        <View style={{ marginLeft: "auto" }}>
          <PeriodTabs period={period} onChange={onPeriod} />
        </View>
      </View>
      {list.length === 0 ? (
        <Text style={[t, { fontSize: 12.5, color: colors.muted }]}>선택한 기간에 새로 등록된 건의가 없어요.</Text>
      ) : (
        <View>
          {list.map((item, i) => (
            <Pressable
              key={item.id}
              onPress={() => onOpen(item.id)}
              accessibilityRole="button"
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingVertical: 9,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: colors.subtle,
              }}
            >
              <Text style={[t, { width: 14, fontSize: 13, fontWeight: "800", color: i < 3 ? colors.indigo[600] : colors.muted }]}>{i + 1}</Text>
              <CategoryTag category={item.category} size="sm" />
              <Text numberOfLines={1} style={[t, { flex: 1, fontSize: 13.5, fontWeight: "600", color: colors.body }]}>{item.title}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Icon name="heart" size={12} color={colors.indigo[600]} />
                <Text style={[t, { fontSize: 12.5, fontWeight: "700", color: colors.indigo[600] }]}>{fmt(item.current)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
      <Pressable
        onPress={onMore}
        accessibilityRole="button"
        accessibilityLabel="전체 건의를 공감순으로 보기"
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.subtle }}
      >
        <Text style={[t, { fontSize: 12.5, fontWeight: "700", color: colors.muted }]}>더보기</Text>
        <Icon name="chevronRight" size={13} color={colors.muted} />
      </Pressable>
    </Card>
  );
}

function StatRow({
  icon,
  iconBg,
  iconFg,
  valueColor,
  label,
  value,
  unit,
  desc,
}: {
  icon: "fileText" | "heart";
  iconBg: string;
  iconFg: string;
  valueColor: string;
  label: string;
  value: number;
  unit: string;
  desc: string;
}) {
  /* 두 타일이 한 줄을 반씩 나눠 쓴다 — 아이콘을 위에 올리고 글자를 아래 세로로 쌓아야 좁은 폭에서
     라벨이 두 줄로 깨지지 않는다(가로 배치는 폰 화면에서 글자 자리가 안 나온다). */
  return (
    <View style={{ flex: 1, gap: 7, padding: 13, borderRadius: radius.md, backgroundColor: iconBg }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={16} color={iconFg} />
      </View>
      <Text style={[t, { fontSize: 11.5, fontWeight: "700", color: colors.muted }]}>{label}</Text>
      <Text style={[t, { fontSize: 20, fontWeight: "800", color: valueColor }]}>{fmt(value)}{unit}</Text>
      <Text style={[t, { fontSize: 10.5, color: colors.muted, lineHeight: 14 }]}>{desc}</Text>
    </View>
  );
}

/* 부제는 기간마다 다른 문장을 쓴다 — "선택한 기간" 이라고만 하면 위 탭을 다시 봐야 뭘 세는지 안다. */
const PERIOD_NOTE: Record<PeriodKey, string> = {
  day: "오늘 기준 새로운 활동을 보여드려요.",
  week: "최근 7일 기준 새로운 활동을 보여드려요.",
  month: "최근 30일 기준 새로운 활동을 보여드려요.",
  all: "전체 기간의 활동을 보여드려요.",
};

/** 기간 요약 — TrendingCard 와 같은 period 를 공유해 같은 기간의 신규 건의/공감을 센다. */
function SummaryCard({ newCount, newEmpathy, period }: { newCount: number; newEmpathy: number; period: PeriodKey }) {
  const label = (PERIODS.find((per) => per.key === period) ?? PERIODS[0]).label;
  return (
    <Card style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
        <Icon name="calendar" size={15} color={colors.indigo[600]} />
        <Text style={[t, { fontSize: 14.5, fontWeight: "800", color: colors.strong }]}>기간 요약</Text>
        <Text style={[t, { fontSize: 13, fontWeight: "700", color: colors.muted }]}>({label})</Text>
      </View>
      <Text style={[t, { fontSize: 12, color: colors.muted, marginTop: -4 }]}>{PERIOD_NOTE[period]}</Text>
      <View style={{ flexDirection: "row", alignItems: "stretch", gap: 10 }}>
        <StatRow icon="fileText" iconBg={colors.indigo[50]} iconFg={colors.indigo[600]} valueColor={colors.indigo[600]} label="총 신규 건의 수" value={newCount} unit="건" desc="새로 등록된 건의 수" />
        {/* 누적 공감이라 "새로 발생한" 이라고는 못 쓴다 — PERIODS 주석의 근사치 한계 참고. */}
        <StatRow icon="heart" iconBg="rgba(240,128,138,.16)" iconFg={colors.danger} valueColor={colors.danger} label="총 신규 공감 수" value={newEmpathy} unit="회" desc="신규 건의에 모인 공감" />
      </View>
    </Card>
  );
}

/** 홈 탭 · 검색 중이 아닐 때만 보인다 — 웹 FeedScreen.jsx 의 nav==='feed' && !q 와 같은 조건. */
function Dashboard({ tab, petitions, query, onOpen, onMore }: { tab: Tab; petitions: Petition[]; query: string; onOpen: (id: number) => void; onMore: () => void }) {
  const [period, setPeriod] = useState<PeriodKey>("day");
  if (tab !== "home" || query.trim()) return null;

  const periodDef = PERIODS.find((per) => per.key === period) ?? PERIODS[0];
  const periodStart = periodDef.ms == null ? 0 : Date.now() - periodDef.ms;
  const periodPetitions = petitions.filter((item) => daysLeft(item) > 0 && new Date(item.createdAt).getTime() >= periodStart);
  const trending = [...periodPetitions].sort((a, b) => b.current - a.current).slice(0, 5);
  const newCount = periodPetitions.length;
  const newEmpathy = periodPetitions.reduce((sum, item) => sum + item.current, 0);

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 26, gap: 12 }}>
      <TrendingCard list={trending} period={period} onPeriod={setPeriod} onOpen={onOpen} onMore={onMore} />
      <SummaryCard newCount={newCount} newEmpathy={newEmpathy} period={period} />
    </View>
  );
}

function FilterBar(p: FeedProps & { onLayout?: (e: LayoutChangeEvent) => void }) {
  const { category, sort, query } = p.filter;
  const resultLabel = `${p.list.length}건`;

  return (
    /* 원본은 rgba(255,255,255,.94) + backdrop-filter 다. RN 에 blur 가 없어 반투명만 남기면
       밑을 지나가는 카드가 비쳐 고장처럼 보인다. ponytail: expo-blur 대신 불투명 흰색. */
    <View onLayout={p.onLayout} style={{ backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.subtle, paddingTop: 12, paddingBottom: 10, gap: 9 }}>
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

      {/* 분류 칩 한 줄. 아이콘은 CategoryTag 와 같은 무채색 선아이콘이다(사용자 지시 — 분류는 색이
          아니라 아이콘 모양으로 구분한다). */}
      <ChipRow>
        {CAT_CHIPS.map((c) => {
          const active = category === c.key;
          const icon = c.key === "all" ? null : CAT_ICON[c.key];
          return (
            <Pressable
              key={c.key}
              onPress={() => p.onCategory(c.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingVertical: 8,
                paddingHorizontal: 15,
                borderRadius: radius.pill,
                borderWidth: 1.5,
                backgroundColor: active ? colors.indigo[600] : "#fff",
                borderColor: active ? colors.indigo[600] : colors.line,
              }}
            >
              {icon ? <Icon name={icon} size={14} color={active ? "#fff" : colors.strong} strokeWidth={2.2} /> : null}
              <Text style={[t, { fontSize: 14, fontWeight: "600", color: active ? "#fff" : colors.body }]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </ChipRow>

      {/* 건수와 정렬은 같은 줄에 둔다 — 정렬만 따로 한 줄을 차지하면 왼쪽이 비어 어색하다(사용자 지적). */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 17 }}>
        <Text style={[t, { fontSize: 12, fontWeight: "600", color: colors.muted }]}>{resultLabel}</Text>
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

/* askSort 와 같은 이유로 Alert.alert 를 쓴다 — 상세 화면의 askPetitionAction 과 같은 구성이다. */
function askPetitionAction(onReport: () => void, onBlock: () => void) {
  Alert.alert("게시글", undefined, [
    { text: "신고", onPress: onReport },
    { text: "차단", style: "destructive", onPress: onBlock },
    { text: "취소", style: "cancel" },
  ]);
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 14 }}>
      {children}
    </ScrollView>
  );
}

function PetitionCard({
  p,
  votes,
  onOpen,
  onVote,
  onBlock,
  onReport,
}: {
  p: Petition;
  votes: Votes;
  onOpen: (id: number) => void;
  onVote: (id: number) => void;
  onBlock: (id: number) => void;
  onReport: (id: number) => void;
}) {
  const c = count(p, votes);

  return (
    <Pressable onPress={() => onOpen(p.id)} accessibilityRole="button">
      {/* 웹 PetitionCard 와 같은 구성이다 — 분류·상태 / 제목만 / 도달률 / 작성자·D-day·댓글 + 공감. */}
      <Card style={{ gap: 11 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <CategoryTag category={p.category} size="sm" />
          <StatusBadge status={p.status} size="sm" />
          {/* 내 글엔 안 보인다 — 서버가 본인 차단을 400 으로 막는다(자기 자신 차단 방지). */}
          {!p.mine ? (
            <Pressable
              onPress={() => askPetitionAction(() => onReport(p.id), () => onBlock(p.id))}
              accessibilityRole="button"
              accessibilityLabel="게시글 메뉴"
              hitSlop={8}
              style={{ marginLeft: "auto", width: 26, height: 26, alignItems: "center", justifyContent: "center" }}
            >
              {/* 상세·댓글과 같은 ⋮ 다 — 신고·차단은 메뉴 안으로 들어갔다. */}
              <Icon name="moreVertical" size={17} color={colors.muted} />
            </Pressable>
          ) : null}
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
