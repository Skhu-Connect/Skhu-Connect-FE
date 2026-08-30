/* 신고 관리. 신고 응답이 대상 원문(targetTitle·targetContent)과 삭제·숨김 상태를 같이 주므로
   청원 목록에 조인하지 않는다 - 작성자가 지운 글은 그 목록에서 빠져서 원문을 볼 수 없었다.
   서버가 신고 시각은 주지 않아 여전히 표시하지 않는다. */

import { useState } from "react";
import { usePetitions } from "../../stores/petitions";
import PageHead from "../../components/admin/PageHead";
import { Badge, Button, Icon } from "../../components/ui";

const STATUS = [["all", "전체"], ["pending", "대기"], ["actionTaken", "조치 완료"], ["dismissed", "기각"]];
const TARGET = [["all", "전체"], ["petition", "글"], ["comment", "댓글"]];
const REASONS = { SPAM: "광고·도배", ABUSE: "욕설·괴롭힘", INAPPROPRIATE: "부적절한 콘텐츠", FALSE_INFORMATION: "허위 정보", OTHER: "기타" };
const ACTION_LABEL = { HIDE: "글 숨김", USER_LOGIN_BAN: "로그인 금지" };
const STATUS_META = {
  pending: { label: "대기", tone: "warning" },
  actionTaken: { label: "조치 완료", tone: "danger" },
  dismissed: { label: "기각", tone: "neutral" },
};

function Pill({ active, children, onClick }) {
  return <button type="button" aria-pressed={active} onClick={onClick} style={{ padding: "7px 15px", borderRadius: "var(--radius-pill)", border: active ? "1.5px solid transparent" : "1.5px solid var(--border-strong)", background: active ? "var(--indigo-600)" : "#fff", color: active ? "#fff" : "var(--text-body)", font: "600 13.5px var(--font-sans)", cursor: "pointer" }}>{children}</button>;
}

export default function Reports() {
  const reports = usePetitions((s) => s.reports);
  const loading = usePetitions((s) => s.loading);
  const processReport = usePetitions((s) => s.processReport);
  const [status, setStatus] = useState("all");
  const [target, setTarget] = useState("all");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(null);

  const list = reports.filter((r) => {
    const searchable = `${r.targetTitle ?? ""} ${r.targetContent ?? ""} ${r.reasonDetail} ${r.id}`.toLowerCase();
    return (status === "all" || r.status === status) && (target === "all" || r.targetType === target) && (!q.trim() || searchable.includes(q.trim().toLowerCase()));
  });

  // actionType 은 status="actionTaken" 일 때만 넘긴다 - 기각은 그대로 undefined.
  const process = async (report, nextStatus, actionType) => {
    const reason = window.prompt(actionType ? `${ACTION_LABEL[actionType]} 처리 사유를 입력하세요.` : "기각 사유를 입력하세요.");
    if (!reason) return;
    setBusy(report.id);
    try {
      await processReport(report.id, nextStatus, reason, actionType);
    } catch (e) {
      window.alert(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ padding: "26px 30px", overflowY: "auto", flex: 1 }}>
      <PageHead title="신고 관리" desc="신고된 글과 댓글을 검토하고 처리 결과를 기록합니다." />
      <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", overflow: "hidden", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px" }}>
          <span style={{ width: 62, flexShrink: 0, fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>상태</span>
          <div role="group" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{STATUS.map(([key, label]) => <Pill key={key} active={status === key} onClick={() => setStatus(key)}>{label}</Pill>)}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", borderTop: "1px solid var(--border-subtle)" }}>
          <span style={{ width: 62, flexShrink: 0, fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>대상</span>
          <div role="group" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{TARGET.map(([key, label]) => <Pill key={key} active={target === key} onClick={() => setTarget(key)}>{label}</Pill>)}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", borderTop: "1px solid var(--border-subtle)", background: "var(--surface-sunken)" }}>
          <label htmlFor="report-search" style={{ width: 62, flexShrink: 0, fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>검색</label>
          <input id="report-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="글 제목, 원문 또는 신고 사유로 검색" style={{ width: 320, maxWidth: "100%", border: "1.5px solid var(--border-strong)", borderRadius: "var(--radius-pill)", padding: "9px 16px", font: "13.5px var(--font-sans)", outline: "none" }} />
        </div>
      </div>
      <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", overflowX: "auto" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", fontSize: 15, fontWeight: 700 }}>신고 {list.length}건</div>
        {list.length === 0 ? <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>{loading ? "신고 목록을 불러오는 중입니다." : "조건에 맞는 신고가 없습니다."}</div> : (
          <table style={{ width: "100%", minWidth: 860, borderCollapse: "collapse" }}>
            <thead><tr style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "left" }}><th style={{ padding: "10px 16px" }}>대상</th><th style={{ padding: "10px 12px" }}>신고 사유</th><th style={{ padding: "10px 12px" }}>상태</th><th style={{ padding: "10px 16px", textAlign: "right" }}>처리</th></tr></thead>
            <tbody>{list.map((r) => {
              const meta = STATUS_META[r.status];
              const heading = r.targetTitle ?? (r.targetType === "comment" ? `댓글 #${r.commentId}` : `청원 #${r.petitionId}`);
              return <tr key={r.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "14px 16px", maxWidth: 300 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}><Icon name={r.targetType === "petition" ? "fileText" : "message"} size={16} />{heading}</div>
                  <div style={{ marginTop: 3, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 12, color: "var(--text-muted)" }}>
                    {r.targetType === "petition" ? "글 신고" : `댓글 #${r.commentId} 신고 · 청원 #${r.petitionId}`}
                    {r.targetDeleted && <Badge tone="danger" size="sm">작성자 삭제</Badge>}
                    {r.targetHidden && <Badge tone="warning" size="sm">숨김</Badge>}
                  </div>
                  {r.targetContent && <div title={r.targetContent} style={{ marginTop: 6, fontSize: 12.5, color: "var(--text-body)", background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", padding: "7px 10px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.targetContent}</div>}
                </td>
                <td style={{ padding: "14px 12px", maxWidth: 350 }}><div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 3 }}>{REASONS[r.reasonType] ?? "기타"}</div><div style={{ fontSize: 13.5, color: "var(--text-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.reasonDetail}</div>{r.processingReason && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>처리{r.actionType ? `(${ACTION_LABEL[r.actionType] ?? r.actionType})` : ""}: {r.processingReason}</div>}</td>
                <td style={{ padding: "14px 12px" }}><Badge tone={meta.tone} size="sm">{meta.label}</Badge></td>
                <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>{r.status === "pending" ? (
                  <>
                    <Button size="sm" variant="danger" disabled={busy === r.id} onClick={() => process(r, "actionTaken", "HIDE")}>글 숨김</Button>
                    <Button size="sm" variant="danger" disabled={busy === r.id} onClick={() => process(r, "actionTaken", "USER_LOGIN_BAN")} style={{ marginLeft: 6 }}>로그인 금지</Button>
                    <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => process(r, "dismissed")} style={{ marginLeft: 6 }}>기각</Button>
                  </>
                ) : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>처리됨</span>}</td>
              </tr>;
            })}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
