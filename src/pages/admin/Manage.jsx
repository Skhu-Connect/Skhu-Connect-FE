/* 청원 관리 (ROADMAP 2-4). 원본: design-handoff/project/app/admin-app-v4.jsx 194–241행.
   상태·카테고리·검색 3조건 AND. 필터 선택은 화면 useState 다 — 스토어에 넣지 않는다. */

import { useState } from "react";
import { usePetitions } from "../../stores/petitions";
import PageHead from "../../components/admin/PageHead";
import PetitionTable from "../../components/admin/PetitionTable";

const STATUSES = [
  ["all", "전체"],
  ["received", "접수"],
  ["reviewing", "검토중"],
  ["answered", "답변 완료"],
];

const rowStyle = { display: "flex", alignItems: "center", gap: 16, padding: "14px 20px" };
const legendStyle = { width: 62, flexShrink: 0, fontSize: 12, fontWeight: 700, color: "var(--text-muted)", letterSpacing: ".02em" };

function Pill({ on, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      style={{
        padding: "7px 15px",
        borderRadius: "var(--radius-pill)",
        border: on ? "1.5px solid transparent" : "1.5px solid var(--border-strong)",
        background: on ? "var(--indigo-600)" : "var(--surface-card)",
        color: on ? "#fff" : "var(--text-body)",
        fontFamily: "var(--font-sans)",
        fontSize: 13.5,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

export default function Manage() {
  const petitions = usePetitions((s) => s.petitions);
  const categories = usePetitions((s) => s.categories);
  const loading = usePetitions((s) => s.loading);
  const [status, setStatus] = useState("all");
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");

  const cats = [{ key: "all", label: "전체" }, ...categories];
  const list = petitions.filter(
    (p) =>
      (status === "all" || p.status === status) &&
      (cat === "all" || p.category === cat) &&
      (!q.trim() || p.title.includes(q.trim())),
  );

  return (
    <div style={{ padding: "26px 30px", overflowY: "auto", flex: 1 }}>
      <PageHead title="청원 관리" desc="상태·카테고리별로 청원을 조회하고 답변을 처리합니다." />
      <div style={{ background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)", marginBottom: 18, overflow: "hidden" }}>
        <div style={rowStyle}>
          <span id="f-status" style={legendStyle}>상태</span>
          <div role="group" aria-labelledby="f-status" style={{ display: "flex", flexWrap: "wrap", gap: 8, flex: 1 }}>
            {STATUSES.map(([k, lbl]) => (
              <Pill key={k} on={status === k} onClick={() => setStatus(k)}>{lbl}</Pill>
            ))}
          </div>
        </div>
        <div style={{ ...rowStyle, borderTop: "1px solid var(--border-subtle)" }}>
          <span id="f-cat" style={legendStyle}>카테고리</span>
          <div role="group" aria-labelledby="f-cat" style={{ display: "flex", flexWrap: "wrap", gap: 8, flex: 1 }}>
            {cats.map((c) => (
              <Pill key={c.key} on={cat === c.key} onClick={() => setCat(c.key)}>{c.label}</Pill>
            ))}
          </div>
        </div>
        <div style={{ ...rowStyle, borderTop: "1px solid var(--border-subtle)", background: "var(--surface-sunken)" }}>
          <label htmlFor="f-q" style={legendStyle}>검색</label>
          <input
            id="f-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="제목으로 검색"
            style={{ flex: 1, maxWidth: 320, border: "1.5px solid var(--border-strong)", borderRadius: "var(--radius-pill)", padding: "9px 16px", fontFamily: "var(--font-sans)", fontSize: 13.5, outline: "none", background: "var(--surface-card)" }}
          />
        </div>
      </div>
      <PetitionTable
        title={`청원 ${list.length}건`}
        list={list}
        empty={loading ? "청원을 불러오는 중입니다." : "조건에 맞는 청원이 없습니다. 필터를 변경해 주세요."}
      />
    </div>
  );
}
