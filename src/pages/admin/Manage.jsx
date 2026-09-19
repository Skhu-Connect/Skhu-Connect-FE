/* 청원 관리 (ROADMAP 2-4). 원본: design-handoff/project/app/admin-app-v4.jsx 194–241행.
   상태·카테고리·검색 3조건 AND. 필터 선택은 화면 useState 다 — 스토어에 넣지 않는다. */

import { useState } from "react";
import { usePetitions } from "../../stores/petitions";
import PageHead from "../../components/admin/PageHead";
import PetitionTable, { byUrgency } from "../../components/admin/PetitionTable";
import { Button, CATEGORIES, StatusBadge } from "../../components/ui";
import { downloadCsv, toCsv } from "../../utils/csv";
import { downloadRtf, toRtf } from "../../utils/rtf";

/* 라벨은 StatusBadge 와 같은 말을 써야 한다 — 예전엔 필터가 "접수" 라고 부르는 상태를
   표의 배지가 "진행중" 이라고 불러서, 무엇을 거른 건지 확인하려면 배지를 다시 읽어야 했다. */
const STATUSES = [
  ["all", "전체"],
  ["received", StatusBadge.STATUS.received.label],
  ["reviewing", StatusBadge.STATUS.reviewing.label],
  ["answered", StatusBadge.STATUS.answered.label],
];

const CSV_HEADERS = ["번호", "작성일", "제목", "카테고리", "상태", "요청", "임계치", "달성률", "기준", "숨김", "숨김 사유", "내용"];

/* 엑셀이 날짜로 읽는 형식. 서버 시각은 api 층에서 이미 UTC 로 정규화돼 들어온다. */
const csvDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/* 작성자 id 는 일부러 뺐다 — 익명 서비스의 작성자 식별자가 시트로 빠져나가면 통제할 수 없다. */
const csvRow = (p) => [
  p.id,
  csvDate(p.createdAt),
  p.title,
  CATEGORIES[p.category]?.label ?? p.category,
  StatusBadge.STATUS[p.status]?.label ?? p.status,
  p.current,
  p.threshold,
  `${Math.round((p.current / p.threshold) * 100)}%`,
  p.basis,
  p.hidden ? "숨김" : "",
  p.hiddenReason ?? "",
  p.content,
];

/* 한글 문서 쪽. 표가 아니라 읽으라고 만드는 문서라 청원 하나가 제목 + 한 줄 요약 + 본문 전문이다.
   엑셀에서 마지막 열이 한 줄로 길게 늘어지는 건 CSV 가 열 너비·자동 줄바꿈 같은 서식을 담을 수
   없어서인데, 긴 본문을 읽는 일은 애초에 표가 할 일이 아니다 — 그 몫을 이 문서가 가져간다. */
const rtfItem = (p) => ({
  heading: p.title,
  meta: [
    CATEGORIES[p.category]?.label ?? p.category,
    StatusBadge.STATUS[p.status]?.label ?? p.status,
    `요청 ${p.current}/${p.threshold} (${Math.round((p.current / p.threshold) * 100)}%)`,
    p.createdAt ? `${csvDate(p.createdAt).slice(0, 10)} 등록` : null,
    p.hidden ? `숨김${p.hiddenReason ? `(${p.hiddenReason})` : ""}` : null,
  ].filter(Boolean).join(" \u00b7 "),
  body: p.content,
});

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
  const total = usePetitions((s) => s.petitionsTotal);
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
      (!q.trim() || p.title.toLowerCase().includes(q.trim().toLowerCase())),
  );

  // 서버가 한 번에 100건까지만 준다. 그 사실을 숨기면 검색·다운로드가 "전체"인 척하게 된다.
  const truncated = total > petitions.length;

  // 표와 같은 순서로 내보낸다(PetitionTable 이 그리기 직전에 거는 정렬과 같은 함수다).
  const ordered = [...list].sort(byUrgency);
  const today = csvDate(new Date().toISOString()).slice(0, 10);
  const name = (ext) => `청원_${truncated ? "최근100건_" : ""}${today}.${ext}`;

  const exportCsv = () => downloadCsv(toCsv(CSV_HEADERS, ordered.map(csvRow)), name("csv"));

  /* 문서가 스스로 무엇을 담았는지 밝힌다 — 공문에 붙일 때 "어느 조건으로 뽑은 목록인지" 가
     파일 밖 기억에만 남아 있으면 안 된다. */
  const exportRtf = () => {
    const applied = [
      status === "all" ? null : StatusBadge.STATUS[status]?.label,
      cat === "all" ? null : CATEGORIES[cat]?.label,
      q.trim() ? `"${q.trim()}" 검색` : null,
    ].filter(Boolean);
    const subtitle = `${today} \u00b7 ${applied.length ? `${applied.join(" \u00b7 ")} \u00b7 ` : ""}${list.length}건${truncated ? " (최근 100건 기준)" : ""}`;
    downloadRtf(toRtf("성공잇다 민원 내역", subtitle, ordered.map(rtfItem)), name("rtf"));
  };

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
      {/* 내보내기는 지금 화면에 보이는 목록 그대로다 — 별도 옵션 화면을 두면 필터가 두 벌이 된다. */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", letterSpacing: ".02em" }}>내보내기 {list.length}건</span>
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={list.length === 0}>엑셀 (.csv)</Button>
        {/* .hwp 는 공개 스펙이 없어 라이브러리 없이 못 만든다. .rtf 는 한글이 「불러오기」로 연다. */}
        <Button size="sm" variant="outline" onClick={exportRtf} disabled={list.length === 0}>한글 문서 (.rtf)</Button>
        {truncated ? (
          <span style={{ fontSize: 12.5, color: "var(--danger-500)", fontWeight: 600 }}>
            전체 {total.toLocaleString()}건 중 최근 100건만 표시됩니다 — 그 이전 청원은 검색·다운로드에 포함되지 않습니다.
          </span>
        ) : null}
      </div>
      <PetitionTable
        title={`청원 ${list.length}건`}
        list={list}
        empty={loading ? "청원을 불러오는 중입니다." : "조건에 맞는 청원이 없습니다. 필터를 변경해 주세요."}
      />
    </div>
  );
}
