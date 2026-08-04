/* 피드 (ROADMAP 1-3). 원본: web-app-v7.jsx 186–292행.
   한 화면이 경로 3개(/ · /answered · /mine)와 검색 상태에 따라 머리말만 갈아 끼운다 —
   쪼개면 그리드·필터가 세 번 중복된다.
   카테고리 칩·정렬 토글은 화면 useState 다(스토어 아님). 검색어는 Header 가 들고
   Outlet context 로 내려온다. */

import { useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { usePetitions } from "../../stores/petitions";
import { Button, Icon } from "../../components/ui";
import { EmptyState, PageIntro, PetitionGrid } from "../../components/web/FeedParts";

function HeroBanner() {
  return (
    <div style={{ position: "relative", overflow: "hidden", background: "var(--gradient-hero)", borderRadius: "var(--radius-xl)", padding: "48px 44px", color: "#fff", boxShadow: "var(--shadow-md)" }}>
      <div style={{ position: "relative", zIndex: 1, maxWidth: 620 }}>
        <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.85, marginBottom: 10 }}>익명 건의 · 공감으로 움직이는 캠퍼스</div>
        <h1 style={{ margin: 0, fontSize: 42, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.22 }}>당신의 건의가<br />임계치를 넘으면 학교가 답합니다</h1>
        <p style={{ margin: "16px 0 0", fontSize: 16, opacity: 0.9, lineHeight: 1.65 }}>공감 수가 학과 정원 또는 전체 학생 대비 기준을 넘으면<br />담당 부서로 자동 전달됩니다.</p>
      </div>
      <div style={{ position: "absolute", right: -60, top: -40, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
      <div style={{ position: "absolute", right: 80, bottom: -90, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
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

function FilterBar({ categories, active, onChange, sort, onSort }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {categories.map((c) => {
          const on = active === c.key;
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(c.key)}
              style={{ padding: "8px 16px", borderRadius: "var(--radius-pill)", border: on ? "1.5px solid transparent" : "1.5px solid var(--border-strong)", background: on ? "var(--indigo-600)" : "var(--surface-card)", color: on ? "#fff" : "var(--text-body)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              {c.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onSort}
        style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: 0, color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
      >
        <Icon name="sliders" size={16} />
        {sort === "hot" ? "공감순" : "최신순"}
      </button>
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

  const base = nav === "answered" ? petitions.filter((p) => p.status === "answered") : nav === "mine" ? petitions.filter((p) => p.mine) : petitions;
  let list = base.filter((p) => cat === "all" || p.category === cat);
  const q = query.trim().toLowerCase();
  if (q) list = list.filter((p) => `${p.title} ${p.excerpt}`.toLowerCase().includes(q));
  // 만료(30일 경과) 청원은 기본 피드에서 뺀다. 검색 결과와 /mine(마이페이지 진입 지점)에는 남긴다.
  else if (nav !== "mine") list = list.filter((p) => !p.expired);
  list = [...list].sort((a, b) => (sort === "hot" ? b.current - a.current : b.id - a.id));

  const intro = q ? (
    <SearchIntro query={query.trim()} count={list.length} />
  ) : nav === "feed" ? (
    <HeroBanner />
  ) : nav === "answered" ? (
    <PageIntro icon="checkCircle" bg="var(--status-answered-bg)" fg="var(--status-answered-fg)" title="답변 완료" count={base.length} desc="학교가 공식 답변을 등록한 청원입니다." />
  ) : (
    <PageIntro icon="user" bg="var(--indigo-50)" fg="var(--indigo-600)" title="내 청원" count={base.length} desc="내가 등록한 청원의 진행 상황입니다. 목록은 본인에게만 표시되며, 다른 학생에게는 익명으로 보입니다." />
  );

  return (
    <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "28px var(--page-gutter) 80px", display: "flex", flexDirection: "column", gap: 26 }}>
      {intro}
      <FilterBar
        categories={[{ key: "all", label: "전체" }, ...categories]}
        active={cat}
        onChange={setCat}
        sort={sort}
        onSort={() => setSort((s) => (s === "hot" ? "new" : "hot"))}
      />
      {list.length === 0 ? (
        <EmptyState
          title={q ? `‘${query.trim()}’에 대한 검색 결과가 없습니다` : nav === "mine" ? "아직 등록한 청원이 없습니다" : "해당 조건의 청원이 없습니다"}
          desc={q ? "다른 검색어로 다시 시도해 주세요." : nav === "mine" ? "첫 청원을 익명으로 등록해 보세요." : "다른 카테고리를 선택해 주세요."}
        >
          {nav === "mine" && !q && <Button variant="primary" onClick={() => navigate("/submit")}>청원 등록</Button>}
        </EmptyState>
      ) : (
        <PetitionGrid list={list} authorOf={nav === "mine" ? () => "익명 · 내 청원" : undefined} />
      )}
    </div>
  );
}
