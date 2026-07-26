/* 알림 로그 (ROADMAP 2-6). 원본: design-handoff/project/app/admin-app-v4.jsx 277–318행.
   로그는 src/api 의 notifLogs 에서 온다 — 원본처럼 화면에 하드코딩하지 않는다 (의존 C). */

import { usePetitions } from "../../stores/petitions";
import PageHead from "../../components/admin/PageHead";
import { CategoryTag, Icon } from "../../components/ui";

const LOG_META = {
  threshold: { icon: "trending", bg: "var(--status-review-bg)", fg: "var(--status-review-fg)", label: "임계치 도달" },
  answer: { icon: "checkCircle", bg: "var(--status-answered-bg)", fg: "var(--status-answered-fg)", label: "답변 등록" },
  reminder: { icon: "clock", bg: "var(--indigo-50)", fg: "var(--indigo-600)", label: "리마인더" },
};

export default function Logs() {
  const logs = usePetitions((s) => s.notifLogs);
  const petitions = usePetitions((s) => s.petitions);

  return (
    <div style={{ padding: "26px 30px", overflowY: "auto", flex: 1 }}>
      <PageHead title="알림 로그" desc="임계치 도달·답변 등록 시 담당자에게 발송된 알림 이력입니다." />
      <div style={{ background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
        {logs.map((l, i) => {
          const m = LOG_META[l.type];
          const p = petitions.find((x) => x.id === l.petitionId);
          return (
            <div key={l.id} style={{ display: "flex", gap: 14, padding: "16px 22px", borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)" }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: m.bg, color: m.fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={m.icon} size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: m.fg }}>{m.label}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>{p ? p.title : ""}</span>
                  {p && <CategoryTag category={p.category} size="sm" />}
                </div>
                <div style={{ fontSize: 13.5, color: "var(--text-body)", marginTop: 4, lineHeight: 1.6 }}>{l.msg}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{l.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
