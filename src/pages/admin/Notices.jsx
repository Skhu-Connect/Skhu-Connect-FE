/* 관리자 공지사항 (#93). POST/PUT/PATCH hide 는 관리자 API, 목록은 공개 GET /connect/notices —
   관리자 전용 목록 엔드포인트가 없어 게시(PUBLISHED)된 공지만 보인다. 그래서 숨김은 되돌릴 수
   없고(콘솔에서 다시 찾을 방법이 없다) 확인 창에 그 사실을 적는다.
   ThresholdSettings 와 같은 패턴 — 스토어에 넣지 않고 화면 로컬 상태로 조회·수정한다. */

import { useEffect, useState } from "react";
import * as api from "../../api";
import PageHead from "../../components/admin/PageHead";
import { Button, ConfirmDialog, Input, Textarea } from "../../components/ui";

const TITLE_MAX = 100; // 서버 제약(docs/api-spec.md 공지 절)
const CONTENT_MAX = 5000;

export default function Notices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hideTarget, setHideTarget] = useState(null);

  const load = () => {
    setLoading(true);
    setLoadError(false);
    api.listNotices().then(setNotices).catch(() => setLoadError(true)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const reset = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setError("");
  };

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      if (editingId == null) {
        const created = await api.createNotice({ title, content });
        setNotices((list) => [created, ...list]);
      } else {
        const updated = await api.updateNotice(editingId, { title, content });
        setNotices((list) => list.map((n) => (n.id === editingId ? updated : n)));
      }
      reset();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const hide = async (notice) => {
    try {
      await api.hideNotice(notice.id);
      setNotices((list) => list.filter((n) => n.id !== notice.id));
      if (editingId === notice.id) reset();
    } catch (e) {
      setError(e.message);
    }
  };

  const valid = title.trim() && content.trim() && title.length <= TITLE_MAX && content.length <= CONTENT_MAX;

  return (
    <div style={{ padding: "26px 30px", overflowY: "auto", flex: 1 }}>
      <PageHead title="공지사항" desc="학생 화면에 노출할 공지를 작성하고 관리합니다." />

      <div style={{ background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)", padding: 22, marginBottom: 18 }}>
        <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "var(--text-strong)" }}>
          {editingId == null ? "새 공지 작성" : "공지 수정 중"}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input
            label="제목"
            value={title}
            maxLength={TITLE_MAX}
            hint={`${title.length} / ${TITLE_MAX}`}
            placeholder="공지 제목을 입력해 주세요."
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            label="내용"
            value={content}
            maxLength={CONTENT_MAX}
            error={error || undefined}
            placeholder="공지 내용을 입력해 주세요."
            onChange={(e) => setContent(e.target.value)}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            {editingId != null && <Button size="sm" variant="outline" onClick={reset}>취소</Button>}
            <Button size="sm" variant="primary" disabled={busy || !valid} onClick={submit}>
              {editingId == null ? "게시하기" : "수정 저장"}
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>불러오는 중…</p>
      ) : loadError ? (
        <div>
          <p role="alert" style={{ fontSize: 13.5, color: "var(--danger-500)", marginBottom: 10 }}>공지 목록을 불러오지 못했습니다.</p>
          <Button variant="outline" onClick={load}>다시 시도</Button>
        </div>
      ) : notices.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>게시된 공지가 없습니다.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {notices.map((n) => (
            <div key={n.id} style={{ background: "#fff", borderRadius: "var(--radius-lg)", border: `1px solid ${editingId === n.id ? "var(--indigo-400)" : "var(--border-subtle)"}`, boxShadow: "var(--shadow-sm)", padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-strong)" }}>{n.title}</span>
                <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{n.date}</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <Button size="sm" variant="outline" onClick={() => { setEditingId(n.id); setTitle(n.title); setContent(n.content); setError(""); }}>수정</Button>
                  <Button size="sm" variant="danger" onClick={() => setHideTarget(n)}>숨김</Button>
                </div>
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "var(--text-body)", whiteSpace: "pre-wrap" }}>{n.content}</p>
            </div>
          ))}
        </div>
      )}

      {hideTarget && (
        <ConfirmDialog
          title={`"${hideTarget.title}" 공지를 숨길까요?`}
          body="숨기면 학생 화면에서 즉시 사라지고, 콘솔에서 다시 찾을 수 없습니다. 되돌릴 수 없으니 확인 후 진행해 주세요."
          confirmLabel="숨기기"
          onConfirm={() => hide(hideTarget)}
          onClose={() => setHideTarget(null)}
        />
      )}
    </div>
  );
}
