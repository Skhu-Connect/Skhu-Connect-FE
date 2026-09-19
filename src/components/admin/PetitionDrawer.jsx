/* 청원 상세 드로어. 관리자가 한 청원을 판단하는 데 필요한 것을 한 화면에 모은다 —
   본문 전문 + 현황 + 공식 답변 + 댓글 전체. 그 전엔 본문이 어디에도 안 보였고 답변·댓글이
   각각 다른 모달이라 한 건을 파악하려면 창을 세 번 열어야 했다.

   흡수한 것: 기존 CommentModeration 모달(댓글 목록·숨김·복원)을 아래 댓글 섹션으로 옮기고
   파일을 지웠다. 남긴 것: AnswerModal — 1000자 입력 폼은 드로어 안에 끼워넣는 것보다
   모달로 띄우는 편이 낫다. 그래서 답변 「작성/수정」은 이 드로어 위에 모달을 띄운다.

   청원 객체를 prop 으로 받지 않고 id 로 스토어에서 읽는 이유: 드로어 안에서 답변을 등록하거나
   숨기면 상태가 바뀌는데, 열 때 넘겨받은 스냅샷을 쥐고 있으면 배지가 낡은 값으로 남는다.

   서버에 관리자용 단건 조회 API 가 없다 — 목록에 있는 청원만 열 수 있다는 뜻이고, 그래서
   URL 을 쓰지 않고 드로어로 만들었다(새로고침해도 빈 상세로 떨어질 일이 없다). */

import { useEffect, useState } from "react";
import * as api from "../../api";
import { usePetitions } from "../../stores/petitions";
import { Badge, Button, CategoryTag, Icon, IconButton, StatusBadge } from "../ui";
import { ANSWER_SOURCES } from "./AnswerModal";
import HideReasonDialog from "./HideReasonDialog";

const ymdhm = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const sectionTitle = { margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", letterSpacing: ".02em" };
const section = { padding: "20px 26px", borderTop: "1px solid var(--border-subtle)" };

function Meta({ label, children }) {
  return (
    <div style={{ display: "flex", gap: 10, fontSize: 13.5, lineHeight: 1.7 }}>
      <span style={{ width: 62, flexShrink: 0, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ color: "var(--text-body)", minWidth: 0 }}>{children}</span>
    </div>
  );
}

export default function PetitionDrawer({ id, onClose, onAnswer, escBlocked }) {
  const p = usePetitions((s) => s.petitions.find((x) => x.id === id));
  const cachedAnswer = usePetitions((s) => s.answersById[id]);
  const getAnswer = usePetitions((s) => s.getAnswer);
  const hidePetition = usePetitions((s) => s.hidePetition);
  const restorePetition = usePetitions((s) => s.restorePetition);

  const [fetchedAnswer, setFetchedAnswer] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [hiding, setHiding] = useState(null);
  const [hidingPetition, setHidingPetition] = useState(false);

  const answered = !!p?.answered;
  const answer = cachedAnswer ?? fetchedAnswer;

  useEffect(() => {
    if (!answered || cachedAnswer) return;
    let live = true;
    getAnswer(id).then((a) => live && setFetchedAnswer(a)).catch(() => {});
    return () => { live = false; };
  }, [id, answered, cachedAnswer, getAnswer]);

  const loadComments = () => {
    setLoading(true);
    setLoadError(false);
    api.listAdminComments(id).then(setComments).catch(() => setLoadError(true)).finally(() => setLoading(false));
  };

  useEffect(loadComments, [id]);

  useEffect(() => {
    // 위에 답변 모달이나 숨김 사유 창이 떠 있으면 Esc 는 그쪽 몫이다.
    const onKey = (e) => e.key === "Escape" && !escBlocked && !hiding && !hidingPetition && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, escBlocked, hiding, hidingPetition]);

  if (!p) return null;

  const reached = p.current >= p.threshold;
  const pct = Math.round((p.current / p.threshold) * 100);

  const hideComment = async (c, reason) => {
    setBusyId(c.id);
    try {
      const patch = await api.hideAdminComment(id, c.id, reason);
      setComments((list) => list.map((x) => (x.id === c.id ? { ...x, ...patch } : x)));
    } finally {
      setBusyId(null);
    }
  };

  const restore = async () => {
    if (!window.confirm(`"${p.title}" 청원을 복원할까요?`)) return;
    try {
      await restorePetition(p.id);
    } catch (e) {
      window.alert(e.message);
    }
  };

  const restoreComment = async (c) => {
    if (!window.confirm("이 댓글을 복원할까요?")) return;
    setBusyId(c.id);
    try {
      const patch = await api.restoreAdminComment(id, c.id);
      setComments((list) => list.map((x) => (x.id === c.id ? { ...x, ...patch } : x)));
    } catch (e) {
      window.alert(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    /* 숨김 사유 창을 스크림 바깥(형제)에 둔다 — 안에 넣으면 그 창을 클릭할 때 스크림까지
       이벤트가 올라가 드로어가 같이 닫힌다. */
    <>
    <div
      role="presentation"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(30,30,60,.45)", zIndex: 55, display: "flex", justifyContent: "flex-end" }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="petition-drawer-title"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 560, maxWidth: "100%", height: "100%", background: "#fff", boxShadow: "var(--shadow-lg)", overflowY: "auto" }}
      >
        <div style={{ padding: "22px 26px 18px", position: "sticky", top: 0, background: "#fff", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <h2 id="petition-drawer-title" style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "var(--text-strong)", lineHeight: 1.45, flex: 1, minWidth: 0 }}>{p.title}</h2>
            <IconButton variant="ghost" size={34} ariaLabel="닫기" onClick={onClose}>
              <Icon name="x" size={19} />
            </IconButton>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
            <CategoryTag category={p.category} size="sm" />
            <StatusBadge status={p.status} size="sm" />
            {p.hidden ? <Badge tone="danger" size="sm">숨김</Badge> : null}
          </div>
        </div>

        <div style={{ ...section, borderTop: "none", display: "flex", flexDirection: "column", gap: 2 }}>
          <Meta label="등록">{p.createdAt ? ymdhm(p.createdAt) : "—"}</Meta>
          <Meta label="요청">
            <span style={{ fontWeight: 700, color: reached ? "var(--success-500)" : "var(--indigo-600)" }}>{pct}%</span>
            {` · ${p.current.toLocaleString()} / ${p.threshold.toLocaleString()} (${p.basis})`}
          </Meta>
          {p.hidden && p.hiddenReason ? <Meta label="숨김 사유"><span style={{ color: "var(--danger-500)" }}>{p.hiddenReason}</span></Meta> : null}
          {/* 본문을 읽고 내린 판단을 여기서 바로 실행한다 — 숨기려고 드로어를 닫고 행을 다시 찾게 하지 않는다. */}
          <div style={{ marginTop: 12 }}>
            {p.hidden ? (
              <Button size="sm" variant="outline" onClick={restore}>숨김 해제</Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setHidingPetition(true)}>이 청원 숨기기</Button>
            )}
          </div>
        </div>

        <div style={section}>
          <h3 style={sectionTitle}>민원 내용</h3>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.8, color: "var(--text-body)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {p.content || "본문이 없습니다."}
          </p>
        </div>

        <div style={section}>
          <h3 style={sectionTitle}>공식 답변</h3>
          {answer ? (
            <>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 6 }}>
                {ANSWER_SOURCES.find((s) => s.value === answer.answerSource)?.label ?? "공식 답변"}
              </div>
              <p style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.75, color: "var(--text-body)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{answer.content}</p>
              <Button size="sm" variant="outline" onClick={() => onAnswer(p)}>답변 수정</Button>
            </>
          ) : answered ? (
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-muted)" }}>답변을 불러오는 중입니다.</p>
          ) : reached ? (
            <>
              <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "var(--text-body)" }}>임계치를 넘어 답변을 기다리고 있습니다.</p>
              <Button size="sm" variant="primary" onClick={() => onAnswer(p)}>답변 작성</Button>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-muted)" }}>임계치에 도달하면 답변을 등록할 수 있습니다.</p>
          )}
        </div>

        <div style={section}>
          <h3 style={sectionTitle}>
            댓글 {loading ? "" : `${comments.length}`}
            {/* 서버 페이지 상한이 100 이다 — 넘치면 아래 목록이 조용히 잘린다. */}
            {comments.length === 100 ? <span style={{ fontWeight: 500, color: "var(--text-muted)" }}> (최대 100개까지 표시)</span> : null}
          </h3>
          {loading ? (
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: 0 }}>불러오는 중…</p>
          ) : loadError ? (
            <div>
              <p role="alert" style={{ fontSize: 13.5, color: "var(--danger-500)", margin: "0 0 10px" }}>댓글을 불러오지 못했습니다.</p>
              <Button size="sm" variant="outline" onClick={loadComments}>다시 시도</Button>
            </div>
          ) : comments.length === 0 ? (
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: 0 }}>댓글이 없습니다.</p>
          ) : (
            comments.map((c, i) => (
              <div key={c.id} style={{ padding: "12px 0", borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {c.parentCommentId ? "↳ 답글 · " : ""}익명{c.anonymousNumber}
                  </span>
                  <p style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word", color: c.hidden ? "var(--text-muted)" : "var(--text-body)", textDecoration: c.hidden ? "line-through" : "none" }}>
                    {c.content}
                  </p>
                  {c.hidden && c.hiddenReason ? (
                    <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--danger-500)" }}>숨김 사유: {c.hiddenReason}</p>
                  ) : null}
                </div>
                <Button size="sm" variant="outline" disabled={busyId === c.id} onClick={() => (c.hidden ? restoreComment(c) : setHiding(c))}>
                  {c.hidden ? "복원" : "숨김"}
                </Button>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
    {hiding && (
      <HideReasonDialog
        title={`익명${hiding.anonymousNumber} 댓글 숨기기`}
        onClose={() => setHiding(null)}
        onSubmit={(reason) => hideComment(hiding, reason)}
      />
    )}
    {hidingPetition && (
      <HideReasonDialog
        title={`"${p.title}" 숨기기`}
        onClose={() => setHidingPetition(false)}
        onSubmit={(reason) => hidePetition(p.id, reason)}
      />
    )}
    </>
  );
}
