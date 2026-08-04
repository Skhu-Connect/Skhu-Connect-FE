/* 피드·북마크 화면이 공유하는 3부품 (ROADMAP 1-3 · 1-7).
   원본: web-app-v7.jsx 237–260행(PageIntro/EmptyState), 279–289행(그리드),
   504–511행(북마크 머리말 — PageIntro 와 같은 마크업, 문구만 다르다). */

import { useNavigate } from "react-router-dom";
import { Icon, PetitionCard, petitionStatus } from "../ui";
import { usePetitions } from "../../stores/petitions";
import { toast } from "../Toast";

export function PageIntro({ icon, bg, fg, title, count, desc }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", padding: "20px 24px" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={icon} size={22} />
      </div>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--text-strong)", letterSpacing: "-.01em" }}>
          {title} <span style={{ color: "var(--indigo-600)", fontVariantNumeric: "tabular-nums" }}>{count}건</span>
        </h1>
        <p style={{ margin: "3px 0 0", fontSize: 13.5, color: "var(--text-muted)" }}>{desc}</p>
      </div>
    </div>
  );
}

export function EmptyState({ title, desc, children }) {
  return (
    <div style={{ background: "var(--surface-card)", border: "1.5px dashed var(--border-strong)", borderRadius: "var(--radius-lg)", padding: "56px 24px", textAlign: "center" }}>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-strong)" }}>{title}</p>
      <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--text-muted)" }}>{desc}</p>
      {children && <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>{children}</div>}
    </div>
  );
}

/** 카드 그리드. p.current 에는 내 공감이 이미 반영돼 있다(api view) — 여기서 +1 하지 않는다. */
export function PetitionGrid({ list, authorOf }) {
  const voted = usePetitions((s) => s.voted);
  const vote = usePetitions((s) => s.vote);
  const navigate = useNavigate();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 18 }}>
      {list.map((p) => (
        <PetitionCard
          key={p.id}
          title={p.title}
          excerpt={p.excerpt}
          category={p.category}
          status={petitionStatus(p)}
          current={p.current}
          threshold={p.threshold}
          basisLabel={p.basis}
          author={authorOf ? authorOf(p) : p.author}
          date={p.date}
          comments={p.comments}
          voted={!!voted[p.id]}
          onToggleVote={async () => toast((await vote(p.id)) ? "공감했습니다" : "공감을 취소했습니다")}
          onClick={() => navigate(`/p/${p.id}`)}
        />
      ))}
    </div>
  );
}
