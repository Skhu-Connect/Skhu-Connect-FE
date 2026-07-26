/* 카테고리 담당자 (ROADMAP 2-5). 원본: design-handoff/project/app/admin-app-v4.jsx 243–275행.
   담당자는 listOwners() 에서 온다 — Web Submit 의 임계치와 같은 출처다 (의존 C). */

import { usePetitions } from "../../stores/petitions";
import PageHead from "../../components/admin/PageHead";
import { Avatar, CategoryTag } from "../../components/ui";

export default function Owners() {
  const owners = usePetitions((s) => s.owners);
  const petitions = usePetitions((s) => s.petitions);

  return (
    <div style={{ padding: "26px 30px", overflowY: "auto", flex: 1 }}>
      <PageHead title="카테고리 담당자" desc="임계치 도달 시 검토 요청이 발송되는 부서·담당자입니다." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {owners.map((o) => {
          const mine = petitions.filter((p) => p.category === o.key);
          const waiting = mine.filter((p) => p.current >= p.threshold && p.status !== "answered").length;
          return (
            <div key={o.key} style={{ background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)", padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={o.name.slice(1)} size={44} ring />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15.5, color: "var(--text-strong)" }}>{o.name}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 600 }}>{o.team}</div>
                </div>
                <CategoryTag category={o.key} size="sm" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "16px 0", fontSize: 13, color: "var(--text-body)" }}>
                <div style={{ display: "flex", gap: 8 }}><span style={{ width: 42, color: "var(--text-muted)", fontWeight: 600 }}>이메일</span>{o.email}</div>
                <div style={{ display: "flex", gap: 8 }}><span style={{ width: 42, color: "var(--text-muted)", fontWeight: 600 }}>전화</span>{o.phone}</div>
              </div>
              <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--border-subtle)", paddingTop: 14, fontSize: 12.5, fontWeight: 700 }}>
                <span style={{ color: "var(--indigo-600)" }}>담당 청원 {mine.length}건</span>
                <span style={{ color: waiting > 0 ? "var(--status-review-fg)" : "var(--text-muted)" }}>검토 대기 {waiting}건</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
