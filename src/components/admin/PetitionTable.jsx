/* Dashboard 와 Manage 가 공유하는 5열 테이블 (ROADMAP 2-2).
   스펙 원본: design-handoff/project/app/admin-app-v4.jsx 98–123, 164–172, 226–238행.

   진행바는 ThresholdBar 를 재사용하지 않는다 (의존 E) — 높이 7px + 오른쪽 34px 고정폭
   % 텍스트 + 아래 캡션은 별개 시각 산출물이라 재사용하면 픽셀이 어긋난다.
   담당자 줄은 지어낸 목 데이터였다 — 서버에 담당자 개념이 없어 통째로 뺐다. */

import { useState } from "react";
import { usePetitions } from "../../stores/petitions";
import { Badge, Button, CategoryTag, StatusBadge } from "../ui";
import AnswerModal from "./AnswerModal";
import HideReasonDialog from "./HideReasonDialog";
import PetitionDrawer from "./PetitionDrawer";

const COLS = [
  { label: "제목", style: { padding: "10px 16px" } },
  { label: "카테고리", style: { padding: "10px 12px" } },
  { label: "상태", style: { padding: "10px 12px" } },
  { label: "요청 / 임계치", style: { padding: "10px 12px" } },
  { label: "처리", style: { padding: "10px 16px", textAlign: "right" } },
];

/* 처리 순서대로 세운다. 관리자가 매번 목록을 훑어 "답변해야 할 게 뭐지" 를 눈으로 찾던 일을
   없애는 게 목적이다 — 서버는 createdAt DESC 로만 주기 때문에 숨긴 글이 맨 위에 오기도 했다.
   0 답변 필요(임계치 달성·미답변) → 1 진행 중 → 2 답변 완료 → 3 숨김.

   Manage 의 내보내기가 같은 비교 함수를 쓴다 — 받은 파일의 순서가 화면과 다르면
   "지금 보이는 목록 그대로" 라는 약속이 깨진다. */
const rank = (p) => (p.hidden ? 3 : p.status === "answered" ? 2 : p.current >= p.threshold ? 0 : 1);
export const byUrgency = (a, b) => rank(a) - rank(b) || b.current / b.threshold - a.current / a.threshold;

function Row({ p, onAnswer, onHide, onRestore, onOpen }) {
  const reached = p.current >= p.threshold;
  const pct = Math.round((p.current / p.threshold) * 100);
  return (
    <tr style={{ borderTop: "1px solid var(--border-subtle)" }}>
      <td style={{ padding: "14px 16px", maxWidth: 300 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* 제목이 상세 진입점이다. 행 전체를 누르게 하면 오른쪽 처리 버튼과 충돌한다. */}
          <button
            type="button"
            onClick={() => onOpen(p)}
            aria-haspopup="dialog"
            style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}
          >
            {p.title}
          </button>
          {p.hidden ? <Badge tone="danger" size="sm">숨김</Badge> : null}
        </div>
      </td>
      <td style={{ padding: "14px 12px", whiteSpace: "nowrap" }}><CategoryTag category={p.category} size="sm" /></td>
      <td style={{ padding: "14px 12px", whiteSpace: "nowrap" }}><StatusBadge status={p.status} size="sm" /></td>
      <td style={{ padding: "14px 12px", minWidth: 160 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 7, background: "var(--gray-150)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: Math.min(100, pct) + "%", height: "100%", background: reached ? "var(--success-500)" : "var(--gradient-hero)" }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: reached ? "var(--success-500)" : "var(--indigo-600)", fontVariantNumeric: "tabular-nums", width: 34 }}>{pct}%</span>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
          {p.current.toLocaleString()} / {p.threshold.toLocaleString()} · {p.basis}
        </div>
      </td>
      <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
          {p.status === "answered" ? (
            <Button size="sm" variant="outline" onClick={() => onAnswer(p)}>답변 완료 · 보기</Button>
          ) : reached ? (
            <Button size="sm" variant="primary" onClick={() => onAnswer(p)}>답변 작성</Button>
          ) : (
            <Button size="sm" variant="outline" disabled>대기중</Button>
          )}
          {p.hidden ? (
            <Button size="sm" variant="outline" onClick={() => onRestore(p)}>복원</Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => onHide(p)}>숨김</Button>
          )}
        </div>
      </td>
    </tr>
  );
}

/** 답변 모달·상세 드로어는 이 컴포넌트가 소유한다 — 진입점이 여기 있으므로
    Dashboard·Manage 양쪽에 상태를 복제할 이유가 없다. 열림 여부는 화면 useState.
    「댓글」 버튼은 없앴다. 댓글은 드로어의 한 섹션이 됐다.
    @param {{title: string, list: object[], empty: string}} props */
export default function PetitionTable({ title, list, empty }) {
  const submitAnswer = usePetitions((s) => s.submitAnswer);
  const hidePetition = usePetitions((s) => s.hidePetition);
  const restorePetition = usePetitions((s) => s.restorePetition);
  const [answering, setAnswering] = useState(null);
  const [hiding, setHiding] = useState(null);
  const [detailId, setDetailId] = useState(null);

  // 정렬은 사본에 한다 — Dashboard 는 스토어의 petitions 배열을 그대로 넘긴다.
  const sorted = [...list].sort(byUrgency);

  const submit = async (id, body, answerSource, isEdit) => {
    await submitAnswer(id, body, answerSource, isEdit);
    setAnswering(null);
  };

  const restore = async (p) => {
    if (!window.confirm(`"${p.title}" 청원을 복원할까요?`)) return;
    try {
      await restorePetition(p.id);
    } catch (e) {
      window.alert(e.message);
    }
  };

  return (
    <div style={{ background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)", overflow: "hidden", overflowX: "auto" }}>
      <div style={{ padding: "16px 20px", fontWeight: 700, fontSize: 15, color: "var(--text-strong)", borderBottom: "1px solid var(--border-subtle)" }}>{title}</div>
      {sorted.length === 0 ? (
        <div style={{ padding: "48px 20px", textAlign: "center", fontSize: 14, color: "var(--text-muted)" }}>{empty}</div>
      ) : (
        <table style={{ width: "100%", minWidth: 880, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "left" }}>
              {COLS.map((c) => (
                <th key={c.label} scope="col" style={{ fontWeight: 600, ...c.style }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <Row key={p.id} p={p} onAnswer={setAnswering} onHide={setHiding} onRestore={restore} onOpen={(x) => setDetailId(x.id)} />
            ))}
          </tbody>
        </table>
      )}
      {detailId != null && (
        <PetitionDrawer
          id={detailId}
          onClose={() => setDetailId(null)}
          onAnswer={setAnswering}
          escBlocked={!!answering || !!hiding}
        />
      )}
      {answering && <AnswerModal p={answering} onClose={() => setAnswering(null)} onSubmit={submit} />}
      {hiding && (
        <HideReasonDialog
          title={`"${hiding.title}" 숨기기`}
          onClose={() => setHiding(null)}
          onSubmit={(reason) => hidePetition(hiding.id, reason)}
        />
      )}
    </div>
  );
}
