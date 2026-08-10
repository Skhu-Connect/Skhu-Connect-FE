/* 청원 상세 + 댓글 (ROADMAP 1-4 · 1-5). 원본: web-app-v7.jsx 300–411행.
   원본 370행의 p.excerpt 2회 반복 렌더는 목데이터 분량 때문이므로 body 필드로 정상화했다.
   답변 카드는 전역 단일 객체가 아니라 answersById[p.id] 를 읽는다 (의존 B). */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePetitions } from "../../stores/petitions";
import { Avatar, Button, Card, CategoryTag, EmpathyButton, Icon, IconButton, StatusBadge, ThresholdBar, petitionStatus } from "../../components/ui";
import { toast } from "../../components/Toast";
import { toggleVoteWithConfirm } from "../../components/web/voteWithConfirm";

function ShareLink({ url }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--indigo-50)", border: "1px dashed var(--indigo-200)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
      <Icon name="link" size={18} color="var(--indigo-600)" />
      <span style={{ flex: 1, fontSize: 13.5, color: "var(--indigo-700)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</span>
      <Button
        variant={copied ? "secondary" : "outline"}
        size="sm"
        leadingIcon={<Icon name={copied ? "check" : "share"} size={15} />}
        onClick={() => {
          // ponytail: 비보안 컨텍스트에는 clipboard 가 없다. 없으면 조용히 넘어간다.
          navigator.clipboard?.writeText(url).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
      >
        {copied ? "복사됨" : "에타에 공유"}
      </Button>
    </div>
  );
}

function AdminAnswer({ a }) {
  return (
    <Card style={{ borderLeft: "4px solid var(--success-500)", background: "var(--status-answered-bg)", border: "1px solid #C7E9D6" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--success-500)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
          <Icon name="shield" size={18} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--status-answered-fg)" }}>{a.dept}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{a.date}</div>
        </div>
        <div style={{ marginLeft: "auto" }}><StatusBadge status="answered" size="sm" /></div>
      </div>
      <p style={{ margin: 0, fontSize: 14.5, color: "var(--gray-800)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{a.body}</p>
    </Card>
  );
}

function linkButtonStyle() {
  return { background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", padding: 0 };
}

function CommentRow({ c, reply, onToggleLike, onEdit, onDelete, onReport }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(c.body);

  const save = async () => {
    if (!text.trim() || text.trim() === c.body) {
      setEditing(false);
      return;
    }
    await onEdit(c.id, text);
    setEditing(false);
  };

  return (
    <div style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: "1px solid var(--border-subtle)", marginLeft: reply ? 48 : 0 }}>
      <Avatar name="익" size={reply ? 30 : 36} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text-strong)" }}>{c.author}</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.date}</span>
          {c.mine && !editing && (
            <span style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
              <button type="button" onClick={() => { setText(c.body); setEditing(true); }} style={linkButtonStyle()}>수정</button>
              <button type="button" onClick={() => onDelete(c.id)} style={linkButtonStyle()}>삭제</button>
            </span>
          )}
          {!c.mine && !editing && <button type="button" onClick={() => onReport(c.id)} style={{ ...linkButtonStyle(), marginLeft: "auto" }}>🚨 신고</button>}
        </div>
        {editing ? (
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              aria-label="댓글 수정"
              style={{ flex: 1, border: "1.5px solid var(--border-strong)", borderRadius: "var(--radius-pill)", padding: "8px 14px", fontFamily: "var(--font-sans)", fontSize: 13.5, outline: "none" }}
            />
            <Button variant="primary" size="sm" disabled={!text.trim()} onClick={save}>저장</Button>
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>취소</Button>
          </div>
        ) : (
          <p style={{ margin: "5px 0 0", fontSize: 14, color: "var(--text-body)", lineHeight: 1.6 }}>{c.body}</p>
        )}
      </div>
      <button
        type="button"
        aria-label={`댓글 공감 ${c.votes}`}
        aria-pressed={!!c.liked}
        onClick={() => onToggleLike(c.id)}
        style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: c.liked ? "var(--coral-500)" : "var(--text-muted)", cursor: "pointer", fontWeight: 700, fontSize: 12 }}
      >
        <Icon name="heart" size={16} />
        {c.votes}
      </button>
    </div>
  );
}

function CommentsSection({ petitionId }) {
  const comments = usePetitions((s) => s.commentsById[petitionId]);
  const addComment = usePetitions((s) => s.addComment);
  const toggleCommentLike = usePetitions((s) => s.toggleCommentLike);
  const updateComment = usePetitions((s) => s.updateComment);
  const deleteComment = usePetitions((s) => s.deleteComment);
  const reportComment = usePetitions((s) => s.reportComment);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const list = comments ?? [];
  // 대댓글도 포함한 실제 총 댓글 수 — 서버 목록 응답에 별도 총계가 없어 트리를 직접 센다.
  const total = list.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0);
  const toggleLike = (id) => toggleCommentLike(petitionId, id);
  const editComment = (id, body) => updateComment(petitionId, id, body);
  const removeComment = (id) => {
    if (window.confirm("댓글을 삭제할까요?")) deleteComment(petitionId, id);
  };
  const report = async (id) => {
    if (!window.confirm("이 댓글을 신고할까요? 관리자가 검토합니다.")) return;
    try {
      await reportComment(id);
      toast("댓글 신고가 접수되었습니다.");
    } catch (e) {
      toast(e.message || "댓글 신고 접수에 실패했습니다.");
    }
  };

  const add = async () => {
    if (!text.trim()) return;
    await addComment(petitionId, text);
    setText("");
  };

  const addReply = async (parentId) => {
    if (!replyText.trim()) return;
    await addComment(petitionId, replyText, parentId);
    setReplyText("");
    setReplyTo(null);
  };

  return (
    <>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-strong)", margin: "0 0 4px" }}>댓글 {total}</h2>
      <Card>
        {list.map((c) => (
          <div key={c.id}>
            <CommentRow c={c} onToggleLike={toggleLike} onEdit={editComment} onDelete={removeComment} onReport={report} />
            <button
              type="button"
              onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", margin: "8px 0 8px 48px" }}
            >
              답글달기
            </button>
            {(c.replies ?? []).map((r) => (
              <CommentRow key={r.id} c={r} reply onToggleLike={toggleLike} onEdit={editComment} onDelete={removeComment} onReport={report} />
            ))}
            {replyTo === c.id && (
              <div style={{ display: "flex", gap: 10, marginLeft: 48, paddingBottom: 14 }}>
                <input
                  autoFocus
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addReply(c.id)}
                  placeholder="답글을 입력하세요"
                  aria-label="답글 입력"
                  style={{ flex: 1, border: "1.5px solid var(--border-strong)", borderRadius: "var(--radius-pill)", padding: "9px 16px", fontFamily: "var(--font-sans)", fontSize: 13.5, outline: "none" }}
                />
                <Button variant="primary" size="sm" disabled={!replyText.trim()} onClick={() => addReply(c.id)}>등록</Button>
              </div>
            )}
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, paddingTop: 14 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="익명으로 의견을 남겨보세요"
            aria-label="댓글 입력"
            style={{ flex: 1, border: "1.5px solid var(--border-strong)", borderRadius: "var(--radius-pill)", padding: "11px 18px", fontFamily: "var(--font-sans)", fontSize: 14, outline: "none" }}
          />
          <Button variant="primary" leadingIcon={<Icon name="send" size={16} />} disabled={!text.trim()} onClick={add}>등록</Button>
        </div>
      </Card>
    </>
  );
}

export default function DetailScreen() {
  const { id } = useParams();
  const pid = Number(id);
  const loadPetition = usePetitions((s) => s.loadPetition);
  const p = usePetitions((s) => s.petitions.find((x) => x.id === pid));
  const answer = usePetitions((s) => s.answersById[pid]);
  const voted = usePetitions((s) => !!s.voted[pid]);
  const bookmarked = usePetitions((s) => !!s.bookmarked[pid]);
  const vote = usePetitions((s) => s.vote);
  const bookmark = usePetitions((s) => s.bookmark);
  const reportPetition = usePetitions((s) => s.reportPetition);
  const navigate = useNavigate();

  const [missing, setMissing] = useState(false);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setMissing(false);
    loadPetition(pid).then((found) => setMissing(!found));
  }, [pid, loadPetition]);

  if (!p) {
    return (
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "22px var(--page-gutter) 90px", textAlign: "center", color: "var(--text-muted)" }}>
        {missing ? (
          <Card padding="var(--pad-card-lg)">
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-strong)" }}>건의를 찾을 수 없습니다</p>
            <p style={{ margin: "6px 0 18px", fontSize: 13.5 }}>삭제되었거나 잘못된 주소입니다.</p>
            <Button variant="primary" onClick={() => navigate("/")}>전체 건의로</Button>
          </Card>
        ) : (
          "불러오는 중…"
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "22px var(--page-gutter) 90px" }}>
      <button type="button" onClick={() => navigate(-1)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text-body)", fontWeight: 600, fontSize: 14, marginBottom: 18, fontFamily: "var(--font-sans)" }}>
        <Icon name="arrowLeft" size={18} /> 목록으로
      </button>

      <Card padding="var(--pad-card-lg)" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CategoryTag category={p.category} />
          <StatusBadge status={petitionStatus(p)} />
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
            <button
              type="button"
              disabled={reporting}
              onClick={async () => {
                if (!window.confirm("이 게시글을 신고할까요? 관리자가 검토합니다.")) return;
                setReporting(true);
                try {
                  await reportPetition(p.id);
                  toast("신고가 접수되었습니다.");
                } catch (e) {
                  toast(e.message || "신고 접수에 실패했습니다.");
                } finally {
                  setReporting(false);
                }
              }}
              style={{ background: "none", border: "none", cursor: reporting ? "not-allowed" : "pointer", color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, padding: "7px 4px", opacity: reporting ? 0.5 : 1 }}
            >
              🚨 신고
            </button>
            <IconButton variant="ghost" ariaLabel="더보기"><Icon name="more" size={20} /></IconButton>
          </div>
        </div>

        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "var(--text-strong)", lineHeight: 1.3, letterSpacing: "-.01em" }}>{p.title}</h1>
          <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 13, color: "var(--text-muted)" }}>
            <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}><Icon name="user" size={14} />{p.author}</span>
            <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}><Icon name="clock" size={14} />{p.date}</span>
            <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}><Icon name="eye" size={14} />{p.views.toLocaleString()}</span>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: 15.5, color: "var(--text-body)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{p.body}</p>

        <div style={{ background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", padding: 18 }}>
          <ThresholdBar current={p.current} threshold={p.threshold} basisLabel={p.basis} size="lg" />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <EmpathyButton
            count={p.current}
            active={voted}
            size="lg"
            block
            style={{ flex: 1 }}
            onToggle={() => toggleVoteWithConfirm(vote, p.id, voted)}
          />
          <IconButton
            variant={bookmarked ? "solid" : "outline"}
            size={52}
            ariaLabel={bookmarked ? "북마크 해제" : "북마크"}
            aria-pressed={bookmarked}
            onClick={async () => toast((await bookmark(p.id)) ? "북마크에 저장했습니다" : "북마크를 해제했습니다")}
          >
            <Icon name="bookmark" size={20} />
          </IconButton>
        </div>

        <ShareLink url={`cheongwon.skhu.ac.kr/p/${p.id}`} />
      </Card>

      {answer && <div style={{ marginTop: 18 }}><AdminAnswer a={answer} /></div>}

      <div style={{ marginTop: 26 }}><CommentsSection petitionId={pid} /></div>
    </div>
  );
}
