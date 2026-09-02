/* 답변 등록·수정 모달 (ROADMAP 2-7, 의존 B 의 쓰기 쪽 + #47 수정 진입점 추가).
   스펙 원본: design-handoff/project/app/admin-app-v4.jsx 125–145행.

   이미 답변된 청원(p.answered)이면 마운트 시 GET 으로 기존 답변을 불러와 프리필하고
   PUT 으로 제출한다 — 그 전엔 화면에 답변 조회·수정 진입점 자체가 없었다. */

import { useEffect, useRef, useState } from "react";
import { usePetitions } from "../../stores/petitions";
import { Button, CategoryTag, Icon, IconButton, Select, StatusBadge, Textarea } from "../ui";

const ANSWER_SOURCES = [
  { value: "OPERATION_TEAM", label: "운영팀 답변" },
  { value: "SCHOOL_OFFICIAL", label: "학교 공식 답변" },
];

export default function AnswerModal({ p, onClose, onSubmit }) {
  const getAnswer = usePetitions((s) => s.getAnswer);
  const isEdit = p.answered;
  const [body, setBody] = useState("");
  const [answerSource, setAnswerSource] = useState("OPERATION_TEAM");
  const [loading, setLoading] = useState(isEdit);
  // GET 실패 시 폼을 아예 안 보여준다 — 빈 textarea 를 진짜 빈 답변으로 착각해 관리자가
  // 새로 입력한 뒤 제출하면 PUT 이 기존 답변을 조용히 덮어쓴다(재현: GET만 실패시키고
  // 수정 진입 → 빈 폼에 새 내용 입력 → 제출하면 원래 답변이 사라짐).
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // 첫 렌더 시점에 잡는다 — effect 로 미루면 Textarea 의 autoFocus 가 먼저 걸려
  // 「답변 작성」 버튼 대신 textarea 를 저장하게 되고 포커스 복귀가 죽는다.
  const opener = useRef(document.activeElement);

  useEffect(() => {
    if (!isEdit) return;
    let live = true;
    setLoading(true);
    setLoadError(false);
    getAnswer(p.id)
      .then((a) => {
        if (!live) return;
        if (a) {
          setBody(a.content);
          setAnswerSource(a.answerSource);
        }
      })
      .catch(() => { if (live) setLoadError(true); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id, retryCount]);

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
      await onSubmit(p.id, body, answerSource, isEdit);
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
          <StatusBadge status={p.status} size="sm" />
          <IconButton variant="ghost" size={34} ariaLabel="닫기" onClick={onClose} style={{ marginLeft: "auto" }}>
            <Icon name="x" size={19} />
          </IconButton>
        </div>
        <h2 id="answer-modal-title" style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "var(--text-strong)" }}>{p.title}</h2>
        <div style={{ background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", padding: 14, fontSize: 14, color: "var(--text-body)", lineHeight: 1.7, marginBottom: 18 }}>{p.excerpt}</div>
        {loading ? (
          <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>기존 답변을 불러오는 중…</p>
        ) : loadError ? (
          <div>
            <p role="alert" style={{ fontSize: 13.5, color: "var(--danger-500)", marginBottom: 10 }}>
              기존 답변을 불러오지 못했습니다. 원본 내용을 확인할 수 없어 그대로 저장하면 기존 답변을 덮어씁니다.
            </p>
            <Button variant="outline" onClick={() => setRetryCount((n) => n + 1)}>다시 불러오기</Button>
          </div>
        ) : (
          <>
            <Select label="답변 주체" options={ANSWER_SOURCES} value={answerSource} onChange={(e) => setAnswerSource(e.target.value)} wrapStyle={{ marginBottom: 14 }} />
            <Textarea
              label="공식 답변"
              maxLength={1000}
              value={body}
              error={error || undefined}
              onChange={(e) => setBody(e.target.value)}
              placeholder="처리 결과와 향후 계획을 안내해 주세요."
              autoFocus
            />
          </>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button
            variant="primary"
            leadingIcon={<Icon name="send" size={16} />}
            disabled={loading || loadError || !body.trim() || busy}
            onClick={submit}
          >
            {isEdit ? "답변 수정" : "답변 등록 · 상태 변경"}
          </Button>
        </div>
      </div>
    </div>
  );
}
