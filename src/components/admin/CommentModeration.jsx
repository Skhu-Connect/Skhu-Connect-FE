/* 댓글 숨김·복원 모달 (#48). 청원 하나의 댓글·대댓글을 평면 목록으로 보여주고 개별로
   숨김/복원한다. 모달 안에서만 쓰는 로컬 목록이라 전역 스토어에 안 넣는다(SignupScreen·
   MyPageScreen 처럼 화면이 api 를 직접 부르는 기존 패턴을 따른다). */

import { useEffect, useState } from "react";
import * as api from "../../api";
import { Button, Icon, IconButton } from "../ui";

export default function CommentModeration({ p, onClose }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    setLoadError(false);
    api.listAdminComments(p.id).then(setComments).catch(() => setLoadError(true)).finally(() => setLoading(false));
  };

  useEffect(load, [p.id]);

  const hide = async (c) => {
    const reason = window.prompt("숨김 사유를 입력하세요.");
    if (!reason) return;
    setBusyId(c.id);
    try {
      const patch = await api.hideAdminComment(p.id, c.id, reason);
      setComments((list) => list.map((x) => (x.id === c.id ? { ...x, ...patch } : x)));
    } catch (e) {
      window.alert(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const restore = async (c) => {
    if (!window.confirm("이 댓글을 복원할까요?")) return;
    setBusyId(c.id);
    try {
      const patch = await api.restoreAdminComment(p.id, c.id);
      setComments((list) => list.map((x) => (x.id === c.id ? { ...x, ...patch } : x)));
    } catch (e) {
      window.alert(e.message);
    } finally {
      setBusyId(null);
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
        aria-labelledby="comment-mod-title"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 560, maxWidth: "100%", maxHeight: "80vh", overflowY: "auto", background: "#fff", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: 28 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <h2 id="comment-mod-title" style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text-strong)" }}>댓글 관리 · {p.title}</h2>
          <IconButton variant="ghost" size={34} ariaLabel="닫기" onClick={onClose} style={{ marginLeft: "auto" }}>
            <Icon name="x" size={19} />
          </IconButton>
        </div>
        {loading ? (
          <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>불러오는 중…</p>
        ) : loadError ? (
          <div>
            <p role="alert" style={{ fontSize: 13.5, color: "var(--danger-500)", marginBottom: 10 }}>댓글을 불러오지 못했습니다.</p>
            <Button variant="outline" onClick={load}>다시 시도</Button>
          </div>
        ) : comments.length === 0 ? (
          <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>댓글이 없습니다.</p>
        ) : (
          comments.map((c, i) => (
            <div key={c.id} style={{ padding: "12px 0", borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {c.parentCommentId ? "↳ 답글 · " : ""}익명{c.anonymousNumber}
                </span>
                <p style={{ margin: "4px 0 0", fontSize: 13.5, color: c.hidden ? "var(--text-muted)" : "var(--text-body)", textDecoration: c.hidden ? "line-through" : "none" }}>
                  {c.content}
                </p>
                {c.hidden && c.hiddenReason ? (
                  <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--danger-500)" }}>숨김 사유: {c.hiddenReason}</p>
                ) : null}
              </div>
              <Button size="sm" variant="outline" disabled={busyId === c.id} onClick={() => (c.hidden ? restore(c) : hide(c))}>
                {c.hidden ? "복원" : "숨김"}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
