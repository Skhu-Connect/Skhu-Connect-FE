/* Dashboard 와 Manage 가 공유하는 5열 테이블 (ROADMAP 2-2).
   스펙 원본: design-handoff/project/app/admin-app-v4.jsx 98–123, 164–172, 226–238행.

   진행바는 ThresholdBar 를 재사용하지 않는다 (의존 E) — 높이 7px + 오른쪽 34px 고정폭
   % 텍스트 + 아래 캡션은 별개 시각 산출물이라 재사용하면 픽셀이 어긋난다.
   담당자 문구는 하드코딩하지 않고 p.owner 에서 읽는다 (의존 C). */

import { useState } from "react";
import { usePetitions } from "../../stores/petitions";
import { Badge, Button, CategoryTag, StatusBadge } from "../ui";
import AnswerModal from "./AnswerModal";
import CommentModeration from "./CommentModeration";

const COLS = [
  { label: "제목 / 담당", style: { padding: "10px 16px" } },
  { label: "카테고리", style: { padding: "10px 12px" } },
  { label: "상태", style: { padding: "10px 12px" } },
  { label: "요청 / 임계치", style: { padding: "10px 12px" } },
  { label: "처리", style: { padding: "10px 16px", textAlign: "right" } },
];

function Row({ p, onAnswer, onHide, onRestore, onComments }) {
  const reached = p.current >= p.threshold;
  const pct = Math.round((p.current / p.threshold) * 100);
  return (
    <tr style={{ borderTop: "1px solid var(--border-subtle)" }}>
      <td style={{ padding: "14px 16px", maxWidth: 300 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
          {p.hidden ? <Badge tone="danger" size="sm">숨김</Badge> : null}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
          {p.owner.team} · {p.owner.name}
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
          <Button size="sm" variant="outline" onClick={() => onComments(p)}>댓글</Button>
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

/** 답변 모달은 이 컴포넌트가 소유한다 — 「답변 작성」 버튼이 여기 있으므로
    Dashboard·Manage 양쪽에 모달 상태를 복제할 이유가 없다. 열림 여부는 화면 useState.
    @param {{title: string, list: object[], empty: string}} props */
export default function PetitionTable({ title, list, empty }) {
  const submitAnswer = usePetitions((s) => s.submitAnswer);
  const hidePetition = usePetitions((s) => s.hidePetition);
  const restorePetition = usePetitions((s) => s.restorePetition);
  const [answering, setAnswering] = useState(null);
  const [commenting, setCommenting] = useState(null);

  const submit = async (id, body, answerSource, isEdit) => {
    await submitAnswer(id, body, answerSource, isEdit);
    setAnswering(null);
  };

  const hide = async (p) => {
    const reason = window.prompt(`"${p.title}" 청원을 숨길 사유를 입력하세요.`);
    if (!reason) return;
    try {
      await hidePetition(p.id, reason);
    } catch (e) {
      window.alert(e.message);
    }
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
      {list.length === 0 ? (
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
            {list.map((p) => (
              <Row key={p.id} p={p} onAnswer={setAnswering} onHide={hide} onRestore={restore} onComments={setCommenting} />
            ))}
          </tbody>
        </table>
      )}
      {answering && <AnswerModal p={answering} onClose={() => setAnswering(null)} onSubmit={submit} />}
      {commenting && <CommentModeration p={commenting} onClose={() => setCommenting(null)} />}
    </div>
  );
}
