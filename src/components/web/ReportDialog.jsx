/* 신고 폼. 상세 화면에만 있다가 피드 카드에서도 신고할 수 있게 되면서 공용으로 뺐다 —
   두 벌로 두면 신고 사유 목록과 글자수 검증이 갈린다. */

import { useState } from "react";
import { Button, Select, Textarea } from "../ui";
import { toast } from "../Toast";

const REPORT_REASONS = [
  { value: "SPAM", label: "광고·도배" },
  { value: "ABUSE", label: "욕설·괴롭힘" },
  { value: "INAPPROPRIATE", label: "부적절한 콘텐츠" },
  { value: "FALSE_INFORMATION", label: "허위 정보" },
  { value: "OTHER", label: "기타" },
];

export function ReportDialog({ target, onClose, onSubmit }) {
  const [reasonType, setReasonType] = useState("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!reasonType) return setError("신고 종류를 선택해 주세요.");
    if (reasonDetail.trim().length < 10) return setError("신고 이유는 10자 이상 입력해 주세요.");
    setBusy(true);
    try {
      await onSubmit(reasonType, reasonDetail);
      toast(`${target} 신고가 접수되었습니다.`);
      onClose();
    } catch (err) {
      setError(err.message || "신고 접수에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="report-title" style={{ position: "fixed", inset: 0, zIndex: 100, display: "grid", placeItems: "center", padding: 20, background: "rgba(15, 23, 42, .45)" }}>
      <form onSubmit={submit} style={{ width: "min(100%, 440px)", background: "#fff", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", padding: 24 }}>
        <h2 id="report-title" style={{ margin: 0, fontSize: 18, color: "var(--text-strong)" }}>{target} 신고</h2>
        <p style={{ margin: "6px 0 20px", fontSize: 13.5, color: "var(--text-muted)" }}>관리자가 신고 내용과 사유를 검토합니다.</p>
        <Select label="신고 종류" value={reasonType} onChange={(e) => { setReasonType(e.target.value); setError(""); }} options={REPORT_REASONS} />
        <Textarea label="신고 이유" value={reasonDetail} onChange={(e) => { setReasonDetail(e.target.value); setError(""); }} maxLength={500} placeholder="신고 이유를 10자 이상 입력해 주세요." error={error || undefined} wrapStyle={{ marginTop: 16 }} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>취소</Button>
          <Button type="submit" variant="danger" disabled={busy}>{busy ? "접수 중…" : "신고하기"}</Button>
        </div>
      </form>
    </div>
  );
}

