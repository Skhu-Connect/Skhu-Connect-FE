/* 숨김 사유 입력창. 청원 숨김(PetitionTable)과 댓글 숨김(PetitionDrawer)이 같이 쓴다.

   window.prompt 를 대체한다 — 실수로 Esc 를 누르면 쓰던 사유가 통째로 날아가고, 자주 쓰는
   사유를 매번 손으로 다시 친다. 사유는 NotificationLog 에 그대로 남는 운영 기록이라
   (ADMIN_POLICY 3·5절) 관리자마다 표현이 갈리지 않게 프리셋을 먼저 보여준다.

   프리셋 문구는 신고 사유(ReportDialog)와 비슷하지만 일부러 복사하지 않았다 — 저쪽은 학생이
   고르는 신고 종류고 이쪽은 관리자가 남기는 처분 사유다. 같이 묶으면 한쪽만 바꿀 수 없어진다. */

import { useEffect, useRef, useState } from "react";
import { Button, Icon, IconButton, Textarea } from "../ui";

const PRESETS = ["욕설·비방", "허위 사실", "개인정보 노출", "광고·도배"];

export default function HideReasonDialog({ title, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const opener = useRef(document.activeElement);

  useEffect(() => {
    const openerEl = opener.current;
    // 뒤에 드로어가 열려 있어도 Esc 로 이것만 닫힌다 — 드로어 쪽이 자기 핸들러를 막아둔다.
    // (둘 다 document 리스너라 stopPropagation 으로는 못 막는다)
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      openerEl?.focus?.();
    };
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    const text = reason.trim();
    if (!text) return setError("숨김 사유를 입력해 주세요.");
    setBusy(true);
    try {
      await onSubmit(text);
      onClose();
    } catch (err) {
      setError(err.message || "숨김 처리에 실패했습니다.");
      setBusy(false);
    }
  };

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(30,30,60,.45)", zIndex: 65, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="hide-reason-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        style={{ width: 460, maxWidth: "100%", background: "#fff", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: 26 }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
          <h2 id="hide-reason-title" style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--text-strong)", flex: 1, minWidth: 0 }}>{title}</h2>
          <IconButton variant="ghost" size={32} ariaLabel="닫기" onClick={onClose}>
            <Icon name="x" size={18} />
          </IconButton>
        </div>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
          숨김 사유는 운영 로그에 기록됩니다. 글은 삭제되지 않고 학생 화면에서만 보이지 않습니다.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => { setReason(preset); setError(""); }}
              style={{
                padding: "6px 13px",
                borderRadius: "var(--radius-pill)",
                border: reason === preset ? "1.5px solid transparent" : "1.5px solid var(--border-strong)",
                background: reason === preset ? "var(--indigo-600)" : "var(--surface-card)",
                color: reason === preset ? "#fff" : "var(--text-body)",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {preset}
            </button>
          ))}
        </div>
        <Textarea
          label="사유"
          value={reason}
          onChange={(e) => { setReason(e.target.value); setError(""); }}
          maxLength={500}
          placeholder="프리셋을 고르거나 직접 입력하세요."
          error={error || undefined}
          autoFocus
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>취소</Button>
          <Button type="submit" variant="danger" disabled={busy}>{busy ? "처리 중…" : "숨기기"}</Button>
        </div>
      </form>
    </div>
  );
}
