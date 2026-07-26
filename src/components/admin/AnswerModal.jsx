/* 답변 등록 모달 (ROADMAP 2-7, 의존 B 의 쓰기 쪽).
   스펙 원본: design-handoff/project/app/admin-app-v4.jsx 125–145행.

   원본은 본문을 버리고 status 만 바꾼다(325행). 여기서는 answer(id, body) 로
   답변 레코드를 만든다 — 그러지 않으면 학생 웹 상세가 어느 청원에서나 같은 답변을 보여준다. */

import { useEffect, useRef, useState } from "react";
import { Button, CategoryTag, Icon, IconButton, StatusBadge, Textarea } from "../ui";

export default function AnswerModal({ p, onClose, onSubmit }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // 첫 렌더 시점에 잡는다 — effect 로 미루면 Textarea 의 autoFocus 가 먼저 걸려
  // 「답변 작성」 버튼 대신 textarea 를 저장하게 되고 포커스 복귀가 죽는다.
  const opener = useRef(document.activeElement);

  useEffect(() => {
    const openerEl = opener.current; // 첫 렌더에 잡힌 값이라 마운트 동안 변하지 않는다
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      openerEl?.focus?.(); // 모달을 연 「답변 작성」 버튼으로 포커스 복귀
    };
  }, [onClose]);

  // ponytail: 포커스 트랩 없음. Escape·복귀·autoFocus 로 키보드 경로는 닫힌다.
  // 트랩이 필요해지면 여기 한 곳만 고친다.

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await onSubmit(p.id, body);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(30,30,60,.45)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="answer-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 560, maxWidth: "100%", background: "#fff", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: 28 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <CategoryTag category={p.category} size="sm" />
          <StatusBadge status="reviewing" size="sm" />
          <IconButton variant="ghost" size={34} ariaLabel="닫기" onClick={onClose} style={{ marginLeft: "auto" }}>
            <Icon name="x" size={19} />
          </IconButton>
        </div>
        <h2 id="answer-modal-title" style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "var(--text-strong)" }}>{p.title}</h2>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
          담당 · {p.owner.team} · {p.owner.name}
        </div>
        <div style={{ background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", padding: 14, fontSize: 14, color: "var(--text-body)", lineHeight: 1.7, marginBottom: 18 }}>{p.excerpt}</div>
        <Textarea
          label="공식 답변"
          maxLength={1000}
          value={body}
          error={error || undefined}
          onChange={(e) => setBody(e.target.value)}
          placeholder="처리 결과와 향후 계획을 안내해 주세요."
          autoFocus
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button
            variant="primary"
            leadingIcon={<Icon name="send" size={16} />}
            disabled={!body.trim() || busy}
            onClick={submit}
          >
            답변 등록 · 상태 변경
          </Button>
        </div>
      </div>
    </div>
  );
}
