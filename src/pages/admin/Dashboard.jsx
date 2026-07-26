/* 대시보드 (ROADMAP 2-3). 원본: design-handoff/project/app/admin-app-v4.jsx 85–96, 147–175행.
   통계 4개는 전부 petitions 에서 파생 계산한다 — 하드코딩하면 답변 등록 후 갱신되지 않는다. */

import { usePetitions } from "../../stores/petitions";
import PetitionTable from "../../components/admin/PetitionTable";
import { Icon } from "../../components/ui";

/* Stat 은 이 화면 전용이라 여기 둔다 — 단일 사용처를 위해 파일을 쪼개지 않는다. */
function Stat({ icon, label, value, tone, delta }) {
  return (
    <div style={{ flex: 1, background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: tone.bg, color: tone.fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={21} />
        </div>
        {delta && <span style={{ fontSize: 12, fontWeight: 700, color: "var(--success-500)" }}>{delta}</span>}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: "var(--text-strong)", marginTop: 14, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const petitions = usePetitions((s) => s.petitions);
  const loading = usePetitions((s) => s.loading);

  const reached = petitions.filter((p) => p.current >= p.threshold && p.status !== "answered").length;
  const answered = petitions.filter((p) => p.status === "answered").length;
  const empathy = petitions.reduce((a, p) => a + p.current, 0);

  return (
    <div style={{ padding: "26px 30px", overflowY: "auto", flex: 1 }}>
      <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: "var(--text-strong)" }}>대시보드</h1>
      <p style={{ margin: "0 0 22px", color: "var(--text-muted)", fontSize: 14 }}>2026학년도 1학기 · 청원 처리 현황</p>
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <Stat icon="megaphone" label="전체 청원" value={petitions.length} tone={{ bg: "var(--indigo-50)", fg: "var(--indigo-600)" }} delta="+2 오늘" />
        <Stat icon="trending" label="임계치 도달 · 검토 필요" value={reached} tone={{ bg: "var(--status-review-bg)", fg: "var(--status-review-fg)" }} />
        <Stat icon="checkCircle" label="답변 완료" value={answered} tone={{ bg: "var(--status-answered-bg)", fg: "var(--status-answered-fg)" }} />
        <Stat icon="users" label="누적 공감" value={empathy.toLocaleString()} tone={{ bg: "#FCE7E9", fg: "var(--coral-600)" }} />
      </div>
      {reached > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--status-review-bg)", border: "1px solid #F3D9A8", borderRadius: "var(--radius-md)", padding: "12px 16px", marginBottom: 20, color: "var(--status-review-fg)", fontWeight: 600, fontSize: 14 }}>
          <Icon name="bell" size={18} /> {reached}건이 임계치를 넘어 담당자 검토를 기다리고 있습니다.
        </div>
      )}
      <PetitionTable title="청원 목록" list={petitions} empty={loading ? "청원을 불러오는 중입니다." : "등록된 청원이 없습니다."} />
    </div>
  );
}
