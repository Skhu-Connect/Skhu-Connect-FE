/* 피드 (ROADMAP 1-3). 원본: web-app-v7.jsx 186–292행.
   한 화면이 경로 3개(/ · /answered · /mine)와 검색 상태에 따라 머리말만 갈아 끼운다 —
   쪼개면 그리드·필터가 세 번 중복된다.
   카테고리 칩·정렬 토글은 화면 useState 다(스토어 아님). 검색어는 Header 가 들고
   Outlet context 로 내려온다. */

import { useRef, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { usePetitions } from "../../stores/petitions";
import { Button, CATEGORIES, Icon } from "../../components/ui";
import { EmptyState, PageIntro, PetitionGrid } from "../../components/web/FeedParts";
import { toast } from "../../components/Toast";
import { ReportDialog } from "../../components/web/ReportDialog";

function HeroBanner() {
  return (
    <div style={{ position: "relative", overflow: "hidden", background: "var(--gradient-hero)", borderRadius: "var(--radius-xl)", padding: "48px 44px", color: "#fff", boxShadow: "var(--shadow-md)" }}>
      <div style={{ position: "relative", zIndex: 1, maxWidth: 620 }}>
        <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.85, marginBottom: 10 }}>익명 건의 · 공감으로 움직이는 캠퍼스</div>
        <h1 style={{ margin: 0, fontSize: 42, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.22 }}>당신의 목소리를 들려주세요</h1>
        <p style={{ margin: "16px 0 0", fontSize: 16, opacity: 0.9, lineHeight: 1.65 }}>공감 수가 학과 정원 또는 전체 학생 대비 기준을 넘으면<br />담당 부서로 자동 전달됩니다.</p>
      </div>
      <div style={{ position: "absolute", right: -60, top: -40, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
      <div style={{ position: "absolute", right: 80, bottom: -90, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
    </div>
  );
}

/* 급상승·기간요약이 공유하는 기간 정의. "전체"는 ms:null 로 시작점을 안 걸러 전체 기간을 뜻한다.
   ponytail: 진짜 "그 기간에 새로 발생한 공감 수"를 내려면 공감 이벤트마다 시각이 있어야 하는데
   백엔드 AgreementResponse 는 누적 agreementCount 만 준다(docs/api-spec.md). 그래서 기간별
   집계는 "그 기간에 새로 등록된 건의"만 걸러 그 건의들의 누적 공감 수를 더하는 근사치로 낸다 —
   오래된 건의가 그 기간에 새로 받은 공감은 못 잡는다. 정확한 수치가 필요해지면 백엔드에 공감
   이벤트 타임스탬프부터 요청해야 한다. */
const PERIODS = [
  { key: "day", label: "일간", ms: 86400000 },
  { key: "week", label: "주간", ms: 7 * 86400000 },
  { key: "month", label: "월간", ms: 30 * 86400000 },
  { key: "all", label: "전체", ms: null },
];

function PeriodTabs({ period, onChange }) {
  return (
    <div style={{ display: "inline-flex", padding: 3, background: "var(--surface-sunken)", borderRadius: "var(--radius-pill)", gap: 2 }}>
      {PERIODS.map((p) => {
        const active = p.key === period;
        return (
          <button
            key={p.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(p.key)}
            style={{ padding: "7px 16px", borderRadius: "var(--radius-pill)", border: "none", background: active ? "var(--indigo-600)" : "transparent", color: active ? "#fff" : "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

/** 급상승 건의 TOP 5 — 선택 기간에 새로 등록된 건의 중 공감순 상위 5건. */
function TrendingList({ list, period, onPeriod, onMore }) {
  const navigate = useNavigate();
  return (
    <div style={{ height: "100%", background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="trending" size={18} color="var(--indigo-600)" />
        <h2 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: "var(--text-strong)" }}>급상승 건의 TOP 5</h2>
        <div style={{ marginLeft: "auto" }}>
          <PeriodTabs period={period} onChange={onPeriod} />
        </div>
      </div>
      {list.length === 0 ? (
        <p style={{ margin: "6px 0", fontSize: 13.5, color: "var(--text-muted)" }}>선택한 기간에 새로 등록된 건의가 없어요.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {list.map((p, i) => {
            const meta = CATEGORIES[p.category] ?? CATEGORIES.facility;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => navigate(`/p/${p.id}`)}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: "none", borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)", padding: "11px 4px", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans)" }}
              >
                <span style={{ width: 16, flexShrink: 0, fontSize: 14, fontWeight: 800, color: i < 3 ? "var(--indigo-600)" : "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
                <Icon name={meta.icon} size={15} color="var(--text-strong)" stroke={2.2} />
                <span style={{ flexShrink: 0, fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)" }}>{meta.label}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 600, color: "var(--text-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                <span style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "var(--indigo-600)", fontVariantNumeric: "tabular-nums" }}>
                  <Icon name="heart" size={13} />
                  {p.current}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {/* TOP 5 너머를 보여줄 별도 화면 대신 아래 목록을 전체·공감순으로 맞추고 그리로 스크롤한다(사용자 지시). */}
      <button
        type="button"
        onClick={onMore}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, width: "100%", marginTop: "auto", paddingTop: 12, background: "none", border: "none", borderTop: "1px solid var(--border-subtle)", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}
      >
        더보기
        <Icon name="chevronRight" size={14} />
      </button>
    </div>
  );
}

function StatTile({ icon, iconBg, iconFg, label, value, unit, desc, valueColor }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: "var(--radius-md)", background: iconBg }}>
      <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={icon} size={19} color={iconFg} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)" }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: valueColor, fontVariantNumeric: "tabular-nums" }}>{value}{unit}</div>
        <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  );
}

/* 부제는 기간마다 다른 문장을 쓴다 — "선택한 기간" 이라고만 하면 위 탭을 다시 봐야 뭘 세는지 안다. */
const PERIOD_NOTE = {
  day: "오늘 기준 새로운 활동을 보여드려요.",
  week: "최근 7일 기준 새로운 활동을 보여드려요.",
  month: "최근 30일 기준 새로운 활동을 보여드려요.",
  all: "전체 기간의 활동을 보여드려요.",
};

/** 기간 요약 — TrendingList 와 같은 period 를 공유해 같은 기간의 신규 건의/공감을 센다. */
function PeriodSummary({ newCount, newEmpathy, period }) {
  const label = (PERIODS.find((p) => p.key === period) ?? PERIODS[0]).label;
  return (
    <div style={{ height: "100%", background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="calendar" size={17} color="var(--indigo-600)" />
        <h2 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: "var(--text-strong)" }}>기간 요약</h2>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-muted)" }}>({label})</span>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>{PERIOD_NOTE[period]}</p>
      <StatTile
        icon="fileText"
        iconBg="var(--indigo-50)"
        iconFg="var(--indigo-600)"
        valueColor="var(--indigo-600)"
        label="총 신규 건의 수"
        value={newCount}
        unit="건"
        desc="새로 등록된 건의 수"
      />
      {/* 누적 공감이라 "새로 발생한" 이라고는 못 쓴다 — PERIODS 주석의 근사치 한계 참고. */}
      <StatTile
        icon="heart"
        iconBg="color-mix(in srgb, var(--coral-500) 14%, white)"
        iconFg="var(--danger-500)"
        valueColor="var(--danger-500)"
        label="총 신규 공감 수"
        value={newEmpathy}
        unit="회"
        desc="신규 건의에 모인 공감"
      />
    </div>
  );
}

/* 목록 구역 머리말. 대시보드(급상승·기간요약)만 "아이콘+제목" 머리말을 갖고 그 아래 목록 구역은
   맨몸 칩으로 시작해, 위아래가 서로 다른 화면처럼 보였다(사용자 지적). 같은 리듬의 머리말을 목록에도
   달아 한 페이지의 두 구역으로 읽히게 한다 — 아이콘·크기·색은 대시보드 카드 머리말과 같은 값이다. */
function ListHeading({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--text-strong)" }}>건의 목록</h2>
      {children}
    </div>
  );
}

function SearchIntro({ query, count }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", padding: "18px 24px" }}>
      <Icon name="search" size={18} color="var(--indigo-600)" />
      <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text-strong)" }}>&lsquo;{query}&rsquo; 검색 결과</h1>
      <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--indigo-600)", fontVariantNumeric: "tabular-nums" }}>{count}건</span>
    </div>
  );
}

const SORT_OPTIONS = [
  { key: "hot", label: "공감순" },
  { key: "new", label: "최신순" },
];

/** 헤더의 알림·메뉴 드롭다운과 같은 패턴(트리거+바깥 클릭 닫기) — 정렬 옵션을 리스트로 보여준다. */
function SortMenu({ sort, onChange }) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find((o) => o.key === sort) ?? SORT_OPTIONS[0];
  return (
    <div style={{ marginLeft: "auto", position: "relative" }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: 0, color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
      >
        <Icon name="sliders" size={16} />
        {current.label}
        <Icon name="chevronDown" size={14} />
      </button>
      {open && (
        <>
          <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 30 }} onClick={() => setOpen(false)} />
          <div role="listbox" aria-label="정렬 방식" style={{ position: "absolute", right: 0, top: 26, minWidth: 120, background: "var(--surface-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-lg)", zIndex: 31, overflow: "hidden" }}>
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.key}
                type="button"
                role="option"
                aria-selected={o.key === sort}
                onClick={() => { onChange(o.key); setOpen(false); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", background: o.key === sort ? "var(--indigo-50)" : "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: o.key === sort ? 700 : 500, color: o.key === sort ? "var(--indigo-600)" : "var(--text-body)" }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FilterBar({ categories, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {categories.map((c) => {
        const on = active === c.key;
        const icon = CATEGORIES[c.key]?.icon;
        return (
          <button
            key={c.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(c.key)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: "var(--radius-pill)", border: on ? "1.5px solid transparent" : "1.5px solid var(--border-strong)", background: on ? "var(--indigo-600)" : "var(--surface-card)", color: on ? "#fff" : "var(--text-body)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            {icon && <Icon name={icon} size={15} stroke={2.2} />}
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

export default function FeedScreen({ nav = "feed" }) {
  const petitions = usePetitions((s) => s.petitions);
  const categories = usePetitions((s) => s.categories);
  const { query } = useOutletContext();
  const navigate = useNavigate();
  const [cat, setCat] = useState("all");
  // 청원 등록 직후에는 최신순으로 연다 — 공감 0인 새 청원이 공감순에서 맨 아래로 밀리기 때문.
  const [sort, setSort] = useState(useLocation().state?.sort ?? "hot");
  const [period, setPeriod] = useState("day");
  // 차단은 스토어(petitions)에서 바로 지워지므로 여기선 API 호출과 토스트만 맡는다.
  const blockPetitionAuthor = usePetitions((s) => s.blockPetitionAuthor);
  const reportPetition = usePetitions((s) => s.reportPetition);
  const [reportId, setReportId] = useState(null);

  /* 급상승 카드의 "더보기" — TOP 5 너머를 보여줄 별도 화면 대신 아래 목록을 전체·공감순으로 맞추고
     그 자리로 스크롤한다(사용자 지시). 스크롤 없이 정렬만 바꾸면 화면 밖에서 일어나 아무 반응이
     없어 보인다. */
  const listRef = useRef(null);
  const showAllByEmpathy = () => {
    setCat("all");
    setSort("hot");
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleBlock = (id) => {
    blockPetitionAuthor(id)
      .then(() => toast("작성자를 차단했습니다"))
      .catch((e) => toast(e?.message || "차단에 실패했습니다"));
  };

  /* 관리자가 숨긴 청원은 공개 목록(GET /connect/petitions)에서 서버가 이미 걸러 준다 — 학생 응답엔
     hidden 필드조차 없다. 다만 스토어(usePetitions.petitions)를 관리자 콘솔(loadAdmin)과 공용으로
     쓰기 때문에, 관리자가 콘솔에서 학생 화면으로 넘어온 직후 loadFeed 가 끝나기 전까지는 숨김 청원이
     남아 있는 목록이 그대로 그려진다. 여기서 한 번 걸러 그리드·급상승 양쪽이 그 창을 타지 않게 한다. */
  const visible = petitions.filter((p) => !p.hidden);
  const base = nav === "answered" ? visible.filter((p) => p.status === "answered") : nav === "mine" ? visible.filter((p) => p.mine) : visible;
  let list = base.filter((p) => cat === "all" || p.category === cat);
  const q = query.trim().toLowerCase();
  if (q) list = list.filter((p) => `${p.title} ${p.excerpt}`.toLowerCase().includes(q));
  // 만료(30일 경과) 청원은 기본 피드에서 뺀다. 검색 결과와 /mine(마이페이지 진입 지점)에는 남긴다.
  else if (nav !== "mine") list = list.filter((p) => !p.expired);
  list = [...list].sort((a, b) => (sort === "hot" ? b.current - a.current : b.id - a.id));
  // 급상승·기간요약은 카테고리/정렬 선택과 무관하게 항상 선택된 기간 전체를 본다.
  const periodDef = PERIODS.find((p) => p.key === period) ?? PERIODS[0];
  const periodStart = periodDef.ms == null ? 0 : Date.now() - periodDef.ms;
  const periodPetitions = nav === "feed" && !q ? base.filter((p) => !p.expired && Date.parse(p.createdAt) >= periodStart) : [];
  const trending = [...periodPetitions].sort((a, b) => b.current - a.current).slice(0, 5);
  const newCount = periodPetitions.length;
  const newEmpathy = periodPetitions.reduce((sum, p) => sum + p.current, 0);

  const intro = q ? (
    <SearchIntro query={query.trim()} count={list.length} />
  ) : nav === "feed" ? (
    <HeroBanner />
  ) : nav === "answered" ? (
    <PageIntro icon="checkCircle" bg="var(--status-answered-bg)" fg="var(--status-answered-fg)" title="답변 완료" count={base.length} desc="학교가 공식 답변을 등록한 건의입니다." />
  ) : (
    <PageIntro icon="user" bg="var(--indigo-50)" fg="var(--indigo-600)" title="내 건의" count={base.length} desc="내가 등록한 건의의 진행 상황입니다. 목록은 본인에게만 표시되며, 다른 학생에게는 익명으로 보입니다." />
  );

  return (
    <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "28px var(--page-gutter) 80px", display: "flex", flexDirection: "column", gap: 26 }}>
      {reportId !== null && <ReportDialog target="게시글" onClose={() => setReportId(null)} onSubmit={(reasonType, reasonDetail) => reportPetition(reportId, reasonType, reasonDetail)} />}
      {intro}
      {/* 웹은 데스크톱 폭이 넉넉해 두 카드를 2열로 두어도 건의 목록이 첫 화면에 들어온다 —
          그래서 상단에 둔다. 세로로 쌓이는 iOS 는 목록 아래로 내렸다(Feed.tsx). */}
      {nav === "feed" && !q && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "stretch" }}>
          <div style={{ flex: "2 1 420px" }}>
            <TrendingList list={trending} period={period} onPeriod={setPeriod} onMore={showAllByEmpathy} />
          </div>
          <div style={{ flex: "1 1 300px" }}>
            <PeriodSummary newCount={newCount} newEmpathy={newEmpathy} period={period} />
          </div>
        </div>
      )}
      {/* 머리말 → 필터 → 건수 순으로 한 덩어리(gap 12)로 묶는다. 부모 gap(26)보다 좁게 붙여야
          칩 줄이 위 대시보드에 딸린 것처럼 보이지 않는다. */}
      <div ref={listRef} style={{ display: "flex", flexDirection: "column", gap: 12, scrollMarginTop: 20 }}>
        {nav === "feed" && !q && (
          <ListHeading>
            <SortMenu sort={sort} onChange={setSort} />
          </ListHeading>
        )}
        <FilterBar categories={[{ key: "all", label: "전체" }, ...categories]} active={cat} onChange={setCat} />
        {nav === "feed" && !q ? (
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{list.length}건</span>
        ) : (
          <div style={{ display: "flex" }}>
            <SortMenu sort={sort} onChange={setSort} />
          </div>
        )}
      </div>
      {list.length === 0 ? (
        <EmptyState
          title={q ? `‘${query.trim()}’에 대한 검색 결과가 없습니다` : nav === "mine" ? "아직 등록한 건의가 없습니다" : "해당 조건의 건의가 없습니다"}
          desc={q ? "다른 검색어로 다시 시도해 주세요." : nav === "mine" ? "첫 건의를 익명으로 등록해 보세요." : "다른 카테고리를 선택해 주세요."}
        >
          {nav === "mine" && !q && <Button variant="primary" onClick={() => navigate("/submit")}>건의 등록</Button>}
        </EmptyState>
      ) : (
        <PetitionGrid list={list} authorOf={nav === "mine" ? () => "익명 · 내 건의" : undefined} onReport={setReportId} onBlock={handleBlock} />
      )}
    </div>
  );
}
