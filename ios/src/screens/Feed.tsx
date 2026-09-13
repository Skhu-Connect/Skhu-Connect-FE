import { useEffect, useRef, useState } from "react";
import { Alert, Image, type LayoutChangeEvent, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Icon } from "../icons";
import { CAT_CHIPS, CAT_LABEL, type CategoryKey, type Notice, type Notification, type Petition } from "../data";
import { badgeStatus, count, daysLeft, ddayLabel, type Filter, type Sort, type Tab } from "../logic";
import { ActionMenu, CategoryTag, EmpathyButton, LogoMark, Sheet, StatusBadge, fmt } from "../ui";
import { ReportSheet } from "../reportSheet";
import type { ReportReasonType } from "../api";
import { colors, font, fs, radius } from "../theme";
import type { Votes } from "../logic";

const t = { fontFamily: font };

/* 벨 시트에 한 번에 보여줄 알림 수. 시트는 화면 80% 까지 자라므로 그냥 다 그리면 알림이 몇 건만
   쌓여도 피드를 통째로 덮는다 — 3건만 펼치고 나머지는 "더보기"로 넘긴다(MY 화면의 PAGE_SIZE 와
   같은 패턴, 시트는 더 좁으니 5 대신 3). */
const NOTIF_PREVIEW = 3;

/* 요청 버튼이 쓰는 고정 폭. 누른 행은 체크 아이콘이 하나 더 붙고 요청 수 자릿수에 따라서도
   폭이 달라져, 그냥 두면 행마다 버튼 왼쪽 끝이 흩어진다(웹이 같은 자리에서 고친 문제).
   웹은 140px 인데 폰은 본문이 그만큼 좁아지면 제목이 두 줄로 접혀 112 로 줄였다. */
const ACTION_W = 112;

export type FeedProps = {
  petitions: Petition[];
  votes: Votes;
  filter: Filter;
  list: Petition[];
  mineCount: number;
  answeredCount: number;
  hasUnread: boolean;
  /* 벨을 누르면 MY 로 넘어가는 대신 그 자리에서 목록을 펼친다(웹 헤더 NotifBell 드롭다운과 같은
     기능). 웹의 앵커 드롭다운 대신 iOS 는 공용 Sheet 를 쓴다 — 폰에서 52pt 헤더 밑에 340px
     패널을 띄우는 것보다 하단 시트가 맞고, 공유 시트·Select 가 이미 쓰는 표면이다. */
  notifications: Notification[];
  onOpenNotification: (n: Notification) => void;
  onMarkAllNotifRead: () => void;
  /* 공지·닫힘 상태는 App.tsx 가 들고 있다 — 이 화면은 상세·MY 로 갈 때마다 언마운트되므로
     여기에 두면 화면을 오갈 때마다 닫은 배너가 되살아나고 공지를 매번 다시 읽는다. */
  notices: Notice[];
  noticeClosed: boolean;
  onCloseNotice: () => void;
  onOpenNotice: () => void;
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
  /* 상세까지 안 들어가고도 신고할 수 있게 행 메뉴에 신고를 넣었다 — 시트는 상세와 같은 것을 쓴다. */
  const [reportId, setReportId] = useState<number | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);

  // 공지가 없거나 못 읽으면(App.tsx 가 빈 배열로 둔다) 배너도 헤더 확성기도 안 그린다.
  const showNotice = tab === "home" && p.notices.length > 0;

  /* 급상승의 "더보기" 는 TOP 5 너머를 보여줄 별도 화면 대신 아래 목록을 전체·요청순으로
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
      <Header
        title="성공잇다"
        hasUnread={p.hasUnread}
        onToggleSearch={p.onToggleSearch}
        onOpenNotifs={() => setNotifOpen(true)}
        onOpenNotice={showNotice && p.noticeClosed ? p.onOpenNotice : undefined}
      />
      <NotifSheet
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={p.notifications}
        onOpenNotification={p.onOpenNotification}
        onMarkAllNotifRead={p.onMarkAllNotifRead}
        onOpenMy={p.onOpenMy}
      />
      {/* 본문(건의 목록)이 먼저, 급상승·기간요약은 그 아래 보조 위젯으로 둔다 — 에브리타임 홈처럼
          목록에 바로 닿게 하려는 것(사용자 지시). 대시보드를 위에 두면 건의를 보려고 매번 그만큼
          스크롤해야 한다. */}
      {/* 공지 줄이 머리말 위에 하나 더 붙으므로 고정 대상 인덱스가 하나 밀린다([1]→[2]) — 계속 FilterBar 를 가리켜야 한다.
          공지가 없을 때도 빈 View 를 자리에 둔다: stickyHeaderIndices 는 위치로 세므로 자식을 빼면 다시 밀린다(높이 0). */}
      <ScrollView ref={scrollRef} stickyHeaderIndices={[2]} showsVerticalScrollIndicator={false}>
        {showNotice && !p.noticeClosed ? <NoticeBanner notices={p.notices} onClose={p.onCloseNotice} /> : <View />}
        <Banner tab={tab} mineCount={p.mineCount} answeredCount={p.answeredCount} />
        <FilterBar {...p} onLayout={(e) => { filterY.current = e.nativeEvent.layout.y; }} />
        <View style={{ paddingHorizontal: 16 }}>
          {p.list.map((item) => (
            <PetitionRow key={item.id} p={item} votes={p.votes} onOpen={p.onOpen} onVote={p.onVote} onBlock={p.onBlock} onReport={setReportId} />
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

/** onOpenNotice 는 "공지가 있고 + 배너가 닫혀 있을 때"만 넘어온다 — 그때만 확성기를 띄운다(웹 Header.jsx 와 같다). */
function Header({
  title,
  hasUnread,
  onToggleSearch,
  onOpenNotifs,
  onOpenNotice,
}: {
  title: string;
  hasUnread: boolean;
  onToggleSearch: () => void;
  onOpenNotifs: () => void;
  onOpenNotice?: () => void;
}) {
  return (
    <View className="flex-row items-center gap-[10px] px-[14px] bg-card border-b border-subtle" style={{ height: 52 }}>
      <LogoMark size={32} />
      <Text style={[t, { fontWeight: "700", fontSize: fs.lg, color: colors.strong, letterSpacing: -0.17 }]}>{title}</Text>

      <View className="ml-auto flex-row items-center">
        <IconBtn label="건의 검색" icon="search" onPress={onToggleSearch} />
        {onOpenNotice ? <IconBtn label="공지사항 다시 보기" icon="megaphone" onPress={onOpenNotice} /> : null}
        <View>
          <IconBtn label="알림" icon="bell" onPress={onOpenNotifs} />
          {/* 미읽음 표시도 인디고다 — 액센트를 하나로 모은다(코랄을 쓰면 강조가 둘이 된다). */}
          {hasUnread ? (
            <View style={{ position: "absolute", top: 5, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.indigo[600], borderWidth: 1.5, borderColor: colors.card }} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

/** 헤더의 아이콘 버튼. 원형이던 자리 — 새 규칙은 원을 아바타에만 허용한다. */
function IconBtn({ label, icon, onPress }: { label: string; icon: "search" | "megaphone" | "bell"; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: radius.md }}
    >
      <Icon name={icon} size={19} color={colors.body} />
    </Pressable>
  );
}

/** 알림 한 줄. 종류별 파스텔 타일을 걷고 중립 면 + 종류 아이콘으로 간다 — 아이콘이 이미 종류를
    말해 주므로 색까지 종류마다 다를 이유가 없다(웹 .notif-tile 과 같은 34px · 중립 면).
    MY 화면의 알림함과 같은 모양을 쓴다 — 같은 알림을 두 곳에서 다르게 그리지 않는다. */
function NotifRow({ n, onPress, first }: { n: Notification; onPress: () => void; first: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flexDirection: "row",
        gap: 12,
        paddingVertical: 13,
        paddingHorizontal: 12,
        marginHorizontal: -12,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.subtle,
        backgroundColor: n.read ? "transparent" : colors.indigo[50],
      }}
    >
      <View style={{ width: 34, height: 34, borderRadius: radius.md, backgroundColor: colors.sunken, alignItems: "center", justifyContent: "center" }}>
        <Icon name={n.icon} size={17} color={colors.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[t, { fontSize: fs.caption, color: colors.body, lineHeight: 21.5 }]}>
          <Text style={{ fontWeight: "600", color: colors.strong }}>{n.title}</Text> · {n.body}
        </Text>
        <Text style={[t, { fontSize: fs.caption, color: colors.muted, marginTop: 3 }]}>{n.date}</Text>
      </View>
    </Pressable>
  );
}

/** 헤더 벨의 알림 목록. 웹 Header.jsx 의 NotifBell 드롭다운과 같은 구성이다 —
    "N건 안 읽음 + 전체 읽음" 머리줄, 목록, 맨 아래 "전체 알림 보기"(MY 진입). */
function NotifSheet({
  open,
  onClose,
  notifications,
  onOpenNotification,
  onMarkAllNotifRead,
  onOpenMy,
}: {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  onOpenNotification: (n: Notification) => void;
  onMarkAllNotifRead: () => void;
  onOpenMy: () => void;
}) {
  const unread = notifications.filter((n) => !n.read).length;
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? notifications : notifications.slice(0, NOTIF_PREVIEW);
  /* 닫으면 다시 3건으로 되돌린다 — 시트는 계속 마운트돼 있어서, 지난번에 펼쳐 둔 상태가 남아
     있으면 다음에 열자마자 또 화면을 덮는다. */
  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingBottom: 12 }}>
        <Text style={[t, { fontSize: fs.lg, fontWeight: "700", color: colors.strong }]}>{unread > 0 ? `${unread}건 안 읽음` : "알림"}</Text>
        {notifications.length > 0 ? (
          <Pressable onPress={onMarkAllNotifRead} accessibilityRole="button" style={{ marginLeft: "auto" }} hitSlop={8}>
            <Text style={[t, { fontSize: fs.caption, fontWeight: "600", color: colors.indigo[600] }]}>전체 읽음</Text>
          </Pressable>
        ) : null}
      </View>

      {notifications.length === 0 ? (
        <Text style={[t, { fontSize: fs.caption, color: colors.muted, paddingVertical: 18 }]}>받은 알림이 없습니다.</Text>
      ) : (
        shown.map((n, i) => (
          <NotifRow
            key={n.id}
            n={n}
            first={i === 0}
            onPress={() => {
              onClose();
              onOpenNotification(n);
            }}
          />
        ))
      )}

      {!expanded && notifications.length > NOTIF_PREVIEW ? (
        <Pressable
          onPress={() => setExpanded(true)}
          accessibilityRole="button"
          style={{ paddingVertical: 12, alignItems: "center", borderTopWidth: 1, borderTopColor: colors.subtle }}
        >
          <Text style={[t, { fontSize: fs.caption, fontWeight: "600", color: colors.indigo[600] }]}>더보기 {notifications.length - NOTIF_PREVIEW}건</Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={() => {
          onClose();
          onOpenMy();
        }}
        accessibilityRole="button"
        style={{ paddingVertical: 13, alignItems: "center", borderTopWidth: 1, borderTopColor: colors.subtle }}
      >
        <Text style={[t, { fontSize: fs.caption, fontWeight: "600", color: colors.indigo[600] }]}>전체 알림 보기</Text>
      </Pressable>
    </Sheet>
  );
}

/* 카카오톡 채팅방 상단 공지처럼 — 기본은 현재 공지 제목 한 줄(처음엔 최신 것), 펼치면 그 한 건만
   본문까지 보이고 오른쪽 버튼으로 다음 공지로 넘어간다. 마지막 다음은 처음으로 돈다.
   인디고 면 + 알약 개수 배지였던 것을 한 줄 띠로 낮췄다 — 공지는 본문이 아니라 알림이다(웹과 같다). */
function NoticeBanner({ notices, onClose }: { notices: Notice[]; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const current = notices[idx] ?? notices[0];
  const many = notices.length > 1;
  return (
    <View style={{ backgroundColor: colors.sunken, borderBottomWidth: 1, borderBottomColor: colors.subtle, paddingHorizontal: 14, paddingVertical: 10 }}>
      <View className="flex-row items-center" style={{ gap: 10 }}>
        <Icon name="megaphone" size={17} color={colors.indigo[600]} />
        <Pressable
          onPress={() => setOpen((o) => !o)}
          accessibilityRole="button"
          accessibilityLabel={open ? "공지사항 접기" : "공지사항 펼치기"}
          accessibilityState={{ expanded: open }}
          className="flex-1 flex-row items-center"
          style={{ gap: 10, minWidth: 0 }}
        >
          {/* 접혔을 때만 한 줄로 자른다 — 펼치면 이 줄이 제목 역할을 그대로 해서 본문 위에 제목을 또 쓰지 않는다. */}
          <Text numberOfLines={open ? undefined : 1} style={[t, { flex: 1, fontSize: fs.sm, fontWeight: "600", color: colors.strong }]}>
            {current.title}
          </Text>
          {/* 접힌 줄에서 "더 있다"를 알리는 건 이 숫자뿐이다 — 한 건이면 알릴 것이 없어 안 그린다. */}
          {many ? <Text style={[t, { fontSize: fs.caption, fontWeight: "600", color: colors.muted }]}>{idx + 1} / {notices.length}</Text> : null}
          <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
            <Icon name="chevronDown" size={17} color={colors.muted} />
          </View>
        </Pressable>
        {many ? (
          <Pressable onPress={() => setIdx((i) => (i + 1) % notices.length)} accessibilityRole="button" accessibilityLabel="다음 공지" style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: radius.md }}>
            <Icon name="chevronRight" size={16} color={colors.body} />
          </Pressable>
        ) : null}
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="공지사항 닫기" style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: radius.md }}>
          <Icon name="x" size={15} color={colors.muted} />
        </Pressable>
      </View>
      {open ? (
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.subtle }}>
          <Text style={[t, { fontSize: fs.caption, lineHeight: 21.5, color: colors.body }]}>{current.content}</Text>
          <Text style={[t, { fontSize: fs.caption, color: colors.muted, marginTop: 4 }]}>{current.date}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** 머리말. 그라데이션 히어로와 장식 원을 걷고 얕은 안내 면 + 이미 있던 캠퍼스 사진으로 바꿨다(웹과 같다).
    문구는 그대로다 — 바꾼 것은 크기와 배경뿐이다.
    주의: 이 자리를 비우면 안 된다. 위 ScrollView 의 stickyHeaderIndices 가 위치로 세기 때문에
    자식을 빼면 필터바 대신 목록이 고정된다. */
function Banner({ tab, mineCount, answeredCount }: { tab: Tab; mineCount: number; answeredCount: number }) {
  /* 답변 완료·내 건의 머리말은 웹 PageIntro 와 같은 문구다.
     건수는 카테고리·검색 필터 전 전체 기준이다 — 필터된 목록 길이를 쓰면 카테고리를 바꿀 때마다
     이 숫자가 요동친다(웹 PageIntro 도 base.length 를 쓴다). */
  if (tab === "answered" || tab === "mine") {
    const answered = tab === "answered";
    return (
      <View className="bg-card border-b border-subtle" style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
        <Text style={[t, { fontSize: fs.xl, fontWeight: "700", color: colors.strong, letterSpacing: -0.4 }]}>
          {answered ? "답변 완료" : "내 건의"} <Text style={{ fontSize: fs.caption, fontWeight: "400", color: colors.muted }}>{answered ? answeredCount : mineCount}건</Text>
        </Text>
        <Text style={[t, { fontSize: fs.caption, color: colors.muted, marginTop: 4, lineHeight: 19.5 }]}>
          {answered ? "학교가 공식 답변을 등록한 건의입니다." : "이 목록은 본인에게만 보입니다. 다른 학생에게는 익명으로 표시됩니다."}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: colors.sunken, borderBottomWidth: 1, borderBottomColor: colors.subtle, paddingTop: 18, paddingHorizontal: 16, paddingBottom: 18 }}>
      <Text style={[t, { fontSize: fs.xl, fontWeight: "700", color: colors.strong, lineHeight: fs.xl * 1.3, letterSpacing: -0.4 }]}>당신의 목소리를 들려주세요</Text>
      <Text style={[t, { fontSize: fs.caption, color: colors.muted, lineHeight: 19.5, marginTop: 6 }]}>
        요청 수가 학과 정원 또는 전체 학생 대비 기준을 넘으면 담당 부서로 자동 전달됩니다.
      </Text>
      <Image
        source={require("../../assets/campus-hero.jpg")}
        style={{ width: "100%", height: 132, borderRadius: radius.md, marginTop: 14 }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        accessible
        accessibilityLabel="성공회대학교 캠퍼스"
      />
    </View>
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

/** 기간 선택. 인디고로 채운 알약이던 자리 — 가라앉은 트랙 위의 흰 면으로 바꿨다(웹 .feed-period). */
function PeriodTabs({ period, onChange }: { period: PeriodKey; onChange: (k: PeriodKey) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 2, backgroundColor: colors.sunken, borderRadius: radius.md, padding: 3, marginTop: 12 }}>
      {PERIODS.map((per) => {
        const active = per.key === period;
        return (
          <Pressable
            key={per.key}
            onPress={() => onChange(per.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{ flex: 1, minHeight: 34, alignItems: "center", justifyContent: "center", borderRadius: radius.xs, backgroundColor: active ? colors.card : "transparent" }}
          >
            <Text style={[t, { fontSize: fs.caption, fontWeight: active ? "700" : "400", color: active ? colors.indigo[600] : colors.muted }]}>{per.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 보조 구역 제목. 카드 상자를 걷고 머리선으로 구역을 나눈다(웹 .feed-side 와 같은 판단). */
function SideHeading({ children, note }: { children: string; note?: string }) {
  return (
    <Text style={[t, { fontSize: fs.lg, fontWeight: "700", color: colors.strong, letterSpacing: -0.34 }]}>
      {children}
      {note ? <Text style={{ fontSize: fs.caption, fontWeight: "400", color: colors.muted }}> {note}</Text> : null}
    </Text>
  );
}

/** 급상승 건의 TOP 5 — 선택 기간에 새로 등록된 건의 중 요청순 상위 5건. */
function TrendingSection({
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
    <View>
      <SideHeading>급상승 건의 TOP 5</SideHeading>
      <PeriodTabs period={period} onChange={onPeriod} />
      {list.length === 0 ? (
        <Text style={[t, { fontSize: fs.caption, color: colors.muted, marginTop: 14 }]}>선택한 기간에 새로 등록된 건의가 없어요.</Text>
      ) : (
        <View style={{ marginTop: 6 }}>
          {list.map((item, i) => (
            <Pressable
              key={item.id}
              onPress={() => onOpen(item.id)}
              accessibilityRole="button"
              style={{ flexDirection: "row", gap: 12, paddingVertical: 14 }}
            >
              <Text style={[t, { width: 12, fontSize: fs.md, fontWeight: "700", color: colors.indigo[600], fontVariant: ["tabular-nums"] }]}>{i + 1}</Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={2} style={[t, { fontSize: fs.sm, lineHeight: fs.sm * 1.5, color: colors.strong }]}>{item.title}</Text>
                <View style={{ flexDirection: "row", gap: 12, marginTop: 6 }}>
                  <Text style={[t, { fontSize: fs.caption, color: colors.muted }]}>{CAT_LABEL[item.category]}</Text>
                  <Text style={[t, { fontSize: fs.caption, color: colors.muted }]}>요청 {fmt(item.current)}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}
      <Pressable
        onPress={onMore}
        accessibilityRole="button"
        accessibilityLabel="전체 건의를 요청순으로 보기"
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44, paddingVertical: 8 }}
      >
        <Text style={[t, { fontSize: fs.caption, color: colors.muted }]}>더보기</Text>
        <Icon name="chevronRight" size={15} color={colors.muted} />
      </Pressable>
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

/** 기간 요약 — 급상승과 같은 period 를 공유해 같은 기간의 신규 건의/요청을 센다.
    분홍·인디고 파스텔 타일이던 자리 — 색 면 없이 숫자만 둔다(웹 .feed-summary). */
function SummarySection({ newCount, newEmpathy, period }: { newCount: number; newEmpathy: number; period: PeriodKey }) {
  const label = (PERIODS.find((per) => per.key === period) ?? PERIODS[0]).label;
  const stat = (dt: string, value: number, unit: string) => (
    <View style={{ flex: 1 }}>
      <Text style={[t, { fontSize: fs.caption, color: colors.muted }]}>{dt}</Text>
      <Text style={[t, { fontSize: fs.xxl, fontWeight: "600", color: colors.strong, marginTop: 8, letterSpacing: -0.48, fontVariant: ["tabular-nums"] }]}>
        {fmt(value)}
        <Text style={{ fontSize: fs.caption, fontWeight: "400", color: colors.muted }}> {unit}</Text>
      </Text>
    </View>
  );

  return (
    <View style={{ marginTop: 20, paddingTop: 24, borderTopWidth: 1, borderTopColor: colors.subtle }}>
      <SideHeading note={`(${label})`}>기간 요약</SideHeading>
      <View style={{ flexDirection: "row", gap: 16, marginTop: 20, marginBottom: 12 }}>
        {stat("총 신규 건의 수", newCount, "건")}
        {/* 누적 요청이라 "새로 발생한" 이라고는 못 쓴다 — PERIODS 주석의 근사치 한계 참고. */}
        {stat("총 신규 요청 수", newEmpathy, "회")}
      </View>
      <Text style={[t, { fontSize: fs.caption, lineHeight: fs.caption * 1.65, color: colors.muted }]}>{PERIOD_NOTE[period]}</Text>
    </View>
  );
}

/** 홈 탭 · 검색 중이 아닐 때만 보인다 — 웹 FeedScreen.jsx 의 isHome 과 같은 조건.
    웹은 이 둘을 오른쪽 보조 열로 내리지만 폰은 한 열이라 목록 아래에 둔다. */
function Dashboard({ tab, petitions, query, onOpen, onMore }: { tab: Tab; petitions: Petition[]; query: string; onOpen: (id: number) => void; onMore: () => void }) {
  /* 기본값이 일간이면 최근 24시간에 등록된 건의가 있어야 두 구역이 차는데, 이 서비스는 등록
     빈도가 그만큼 높지 않아 첫 화면이 거의 늘 비어 보인다. 월간으로 열어 두고 좁히는 건 탭에 맡긴다. */
  const [period, setPeriod] = useState<PeriodKey>("month");
  if (tab !== "home" || query.trim()) return null;

  const periodDef = PERIODS.find((per) => per.key === period) ?? PERIODS[0];
  const periodStart = periodDef.ms == null ? 0 : Date.now() - periodDef.ms;
  const periodPetitions = petitions.filter((item) => daysLeft(item) > 0 && new Date(item.createdAt).getTime() >= periodStart);
  const trending = [...periodPetitions].sort((a, b) => b.current - a.current).slice(0, 5);
  const newCount = periodPetitions.length;
  const newEmpathy = periodPetitions.reduce((sum, item) => sum + item.current, 0);

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32, borderTopWidth: 1, borderTopColor: colors.subtle, marginTop: 8 }}>
      <TrendingSection list={trending} period={period} onPeriod={setPeriod} onOpen={onOpen} onMore={onMore} />
      <SummarySection newCount={newCount} newEmpathy={newEmpathy} period={period} />
    </View>
  );
}

function FilterBar(p: FeedProps & { onLayout?: (e: LayoutChangeEvent) => void }) {
  const { category, sort, query } = p.filter;
  /* autoFocus 는 입력칸이 마운트될 때마다 뛴다. searchOpen 은 App.tsx 가 들고 있는데 FeedScreen
     자체는 MY·상세로 갈 때 언마운트되므로, 검색바를 열어둔 채 다녀오면 사용자가 아무것도 안 눌렀는데
     키보드가 올라온다. 화면의 첫 렌더에서만 autoFocus 를 끄면 "검색 버튼을 눌러서 연" 경우에만
     키보드가 올라온다 — 검색바 자체는 그대로 열려 있고 검색어도 남는다. */
  const firstRender = useRef(true);
  useEffect(() => {
    firstRender.current = false;
  }, []);

  return (
    /* 원본은 rgba(255,255,255,.94) + backdrop-filter 다. RN 에 blur 가 없어 반투명만 남기면
       밑을 지나가는 행이 비쳐 고장처럼 보인다. ponytail: expo-blur 대신 불투명 흰색. */
    <View onLayout={p.onLayout} style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.subtle, paddingTop: 12 }}>
      {p.searchOpen ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingVertical: 9, paddingHorizontal: 12 }}>
          <Icon name="search" size={16} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={p.onQuery}
            placeholder="건의 검색"
            placeholderTextColor={colors.muted}
            autoFocus={!firstRender.current}
            style={[t, { flex: 1, fontSize: fs.sm, color: colors.strong, padding: 0 }]}
          />
        </View>
      ) : null}

      {/* 건수와 정렬은 같은 줄에 둔다 — 정렬만 따로 한 줄을 차지하면 왼쪽이 비어 어색하다(사용자 지적). */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16 }}>
        <Text style={[t, { fontSize: fs.lg, fontWeight: "700", color: colors.strong, letterSpacing: -0.34 }]}>
          건의 목록 <Text style={{ fontSize: fs.caption, fontWeight: "400", color: colors.muted }}>{p.list.length}건</Text>
        </Text>
        {/* 테두리가 있어야 컨트롤로 읽힌다 — 흰 면 위에서 테두리가 없으면 그냥 글자로 보인다(웹 .feed-sort). */}
        <Pressable
          onPress={() => askSort(sort, p.onSort)}
          accessibilityRole="button"
          accessibilityLabel={`정렬 방식 · 현재 ${sortLabel(sort)}`}
          style={{ marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 4, minHeight: 36, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.subtle, borderRadius: radius.md, backgroundColor: colors.card }}
        >
          <Text style={[t, { fontSize: fs.caption, color: colors.body }]}>{sortLabel(sort)}</Text>
          <Icon name="chevronDown" size={14} color={colors.muted} />
        </Pressable>
      </View>

      {/* 분류: 인디고로 채운 알약이던 자리 — 밑줄 탭으로 바꿨다(웹 .feed-cat-tabs).
          채운 칩은 같은 줄의 다른 강조와 다툰다. 가로 스크롤은 그대로 둔다. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 22, paddingHorizontal: 16 }} style={{ marginTop: 12 }}>
        {CAT_CHIPS.map((c) => {
          const active = category === c.key;
          return (
            <Pressable
              key={c.key}
              onPress={() => p.onCategory(c.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={{ minHeight: 48, justifyContent: "center", borderBottomWidth: 2, borderBottomColor: active ? colors.indigo[600] : "transparent" }}
            >
              <Text style={[t, { fontSize: fs.sm, fontWeight: active ? "700" : "400", color: active ? colors.indigo[600] : colors.muted }]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const SORT_OPTIONS: { key: Sort; label: string }[] = [
  { key: "hot", label: "요청순" },
  { key: "new", label: "최신순" },
];

function sortLabel(s: Sort) {
  return (SORT_OPTIONS.find((o) => o.key === s) ?? SORT_OPTIONS[0]).label;
}

/* 웹은 <select> 로 정렬을 고른다. RN 에는 그 부품이 없고, 기본 Alert 의 버튼 목록이
   iOS 에서 액션시트처럼 뜬다 — ponytail: 새 라이브러리 없이 이걸 쓴다. */
function askSort(current: Sort, onSort: (s: Sort) => void) {
  Alert.alert("정렬 방식", undefined, [
    ...SORT_OPTIONS.map((o) => ({ text: o.key === current ? `${o.label} ✓` : o.label, onPress: () => onSort(o.key) })),
    { text: "취소", style: "cancel" as const },
  ]);
}

/** 건의 하나를 나타내는 목록 행. 테두리 카드였던 자리 — 같은 상자가 반복되면서 건의 제목보다
    상자가 먼저 읽혔다(웹이 카드 그리드를 걷어낸 이유와 같다). */
function PetitionRow({
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
  const reached = c >= p.threshold;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.subtle }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <CategoryTag category={p.category} size="sm" />
          {/* 만료된 건의는 진행중이 아니라 만료됨으로 보인다 — 바로 옆 D-day 와 어긋나던 것을 맞춘다. */}
          <StatusBadge status={badgeStatus(p)} size="sm" />
          <Text style={[t, { marginLeft: "auto", fontSize: fs.caption, color: colors.body, fontVariant: ["tabular-nums"] }]}>{ddayLabel(p)}</Text>
          {/* 메뉴 자리는 메뉴가 없을 때도 비워 둔다. 내 글 행에는 메뉴가 통째로 빠지는데, 그러면
              앞의 D-day 가 그 자리까지 밀려나 행마다 위치가 어긋난다(웹이 같은 자리에서 고친 문제). */}
          <View style={{ width: 26, alignItems: "flex-end" }}>
            {!p.mine ? <ActionMenu label="게시글 메뉴" style={{ marginLeft: 0 }} onReport={() => onReport(p.id)} onBlock={() => onBlock(p.id)} /> : null}
          </View>
        </View>

        <Pressable onPress={() => onOpen(p.id)} accessibilityRole="button" style={{ marginVertical: 8 }}>
          <Text style={[t, { fontSize: fs.lg, fontWeight: "600", color: colors.strong, lineHeight: fs.lg * 1.5, letterSpacing: -0.255 }]}>{p.title}</Text>
        </Pressable>

        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 14, rowGap: 4 }}>
          <Text style={[t, { fontSize: fs.caption, color: colors.muted }]}>{p.author}</Text>
          <Text style={[t, { fontSize: fs.caption, color: colors.muted }]}>댓글 {p.comments}</Text>
          <Text style={[t, { fontSize: fs.caption, color: reached ? colors.status["answered-fg"] : colors.muted }]}>
            {reached ? "담당 부서 전달됨" : `${fmt(p.threshold - c)}명 남음`}
          </Text>
        </View>
      </View>

      {/* 폭을 고정한다. 누른 행은 체크 아이콘이 붙고 요청 수 자릿수도 달라져, 그냥 두면 행마다
          버튼 왼쪽 끝이 흩어진다. 버튼은 block 으로 이 폭을 꽉 채운다.
          block 은 flex:1 을 주므로 가로로 자라도록 행 방향 래퍼 안에 둔다 — 세로 컨테이너에
          바로 넣으면 버튼이 위아래로 늘어난다. */}
      <View style={{ width: ACTION_W, alignItems: "center", gap: 8 }}>
        <View style={{ flexDirection: "row", alignSelf: "stretch" }}>
          <EmpathyButton count={c} active={!!votes[p.id]} size="sm" block onToggle={() => onVote(p.id)} />
        </View>
        <Text style={[t, { fontSize: fs.caption, color: colors.muted, fontVariant: ["tabular-nums"] }]}>기준 {fmt(p.threshold)}명</Text>
      </View>
    </View>
  );
}

/** 점선 테두리 상자였던 자리 — 여백과 글자만 남긴다(웹 .feed-empty). */
function Empty({ tab }: { tab: Tab }) {
  const title = tab === "answered" ? "답변 완료된 건의가 없습니다" : "조건에 맞는 건의가 없습니다";
  const body = tab === "answered" ? "학교가 공식 답변을 등록하면 여기에 모입니다." : "다른 분류를 선택해 주세요.";
  return (
    <View style={{ paddingVertical: 64, paddingHorizontal: 20, alignItems: "center" }}>
      <Icon name="inbox" size={24} color={colors.muted} />
      <Text style={[t, { fontSize: fs.lg, fontWeight: "600", color: colors.strong, marginTop: 12 }]}>{title}</Text>
      <Text style={[t, { fontSize: fs.sm, color: colors.muted, marginTop: 6 }]}>{body}</Text>
    </View>
  );
}
