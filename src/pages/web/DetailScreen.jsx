/* 청원 상세 + 댓글 (ROADMAP 1-4 · 1-5). 원본: web-app-v7.jsx 300–411행.
   원본 370행의 p.excerpt 2회 반복 렌더는 목데이터 분량 때문이므로 body 필드로 정상화했다.
   답변 카드는 전역 단일 객체가 아니라 answersById[p.id] 를 읽는다 (의존 B). */

import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSession } from "../../stores/session";
import { usePetitions } from "../../stores/petitions";
import { Avatar, BlockConfirmDialog, Button, Card, CategoryTag, EmpathyButton, Icon, IconButton, Select, StatusBadge, Textarea, ThresholdBar, petitionStatus } from "../../components/ui";
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

const REPORT_REASONS = [
  { value: "SPAM", label: "광고·도배" },
  { value: "ABUSE", label: "욕설·괴롭힘" },
  { value: "INAPPROPRIATE", label: "부적절한 콘텐츠" },
  { value: "FALSE_INFORMATION", label: "허위 정보" },
  { value: "OTHER", label: "기타" },
];

function ReportDialog({ target, onClose, onSubmit }) {
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

/* 댓글 행의 신고·차단. 줄에 펼치지 않고 ⋮ 뒤에 둔다 — 공감까지 셋이 나란히 붙으면 줄이 복잡하고,
   에타처럼 목록 행의 부가 동작을 오버플로 메뉴에 두는 게 학생들에게 익숙한 형태다.
   여는 방식(트리거 + 바깥 클릭 닫기)은 FeedScreen 의 SortMenu 와 같은 패턴이다. */
function CommentMenu({ onReport, onBlock }) {
  const [open, setOpen] = useState(false);
  const item = (danger) => ({
    display: "flex",
    alignItems: "center",
    gap: 9,
    width: "100%",
    padding: "9px 10px",
    border: "none",
    borderRadius: 8,
    background: "none",
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    fontSize: 13,
    fontWeight: 600,
    color: danger ? "var(--danger-500)" : "var(--text-body)",
    textAlign: "left",
  });

  return (
    <span style={{ marginLeft: "auto", position: "relative" }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="댓글 메뉴"
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "none", border: "none", borderRadius: "50%", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}
      >
        <Icon name="moreVertical" size={16} />
      </button>
      {open && (
        <>
          <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 30 }} onClick={() => setOpen(false)} />
          <div role="menu" style={{ position: "absolute", right: 0, top: 28, minWidth: 128, background: "var(--surface-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-lg)", padding: 6, zIndex: 31 }}>
            <button type="button" role="menuitem" onClick={() => { setOpen(false); onReport(); }} style={item(false)}>
              <Icon name="flag" size={15} />
              신고
            </button>
            <button type="button" role="menuitem" onClick={() => { setOpen(false); onBlock(); }} style={item(true)}>
              <Icon name="userX" size={15} />
              차단
            </button>
          </div>
        </>
      )}
    </span>
  );
}

function CommentRow({ c, reply, onToggleLike, onEdit, onDelete, onReport, onBlock }) {
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
          {!c.mine && !editing && <CommentMenu onReport={() => onReport(c.id)} onBlock={() => onBlock(c.id)} />}
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

function CommentsSection({ petitionId, authed, requireAuth }) {
  const comments = usePetitions((s) => s.commentsById[petitionId]);
  const addComment = usePetitions((s) => s.addComment);
  const toggleCommentLike = usePetitions((s) => s.toggleCommentLike);
  const updateComment = usePetitions((s) => s.updateComment);
  const deleteComment = usePetitions((s) => s.deleteComment);
  const reportComment = usePetitions((s) => s.reportComment);
  const blockCommentAuthor = usePetitions((s) => s.blockCommentAuthor);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [reportId, setReportId] = useState(null);
  const [blockId, setBlockId] = useState(null);
  const list = comments ?? [];
  // 대댓글도 포함한 실제 총 댓글 수 — 서버 목록 응답에 별도 총계가 없어 트리를 직접 센다.
  const total = list.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0);
  const toggleLike = (id) => (authed ? toggleCommentLike(petitionId, id) : requireAuth());
  // c.mine 버튼은 평소엔 게스트에게 안 보이지만, 로그아웃 후에도 store 댓글 캐시가 남아있어
  // 재진입 시 새 fetch가 끝나기 전 잠깐 노출될 수 있다 — 다른 액션과 같은 패턴으로 방어한다.
  const editComment = (id, body) => (authed ? updateComment(petitionId, id, body) : requireAuth());
  const removeComment = (id) => {
    if (!authed) return requireAuth();
    if (window.confirm("댓글을 삭제할까요?")) deleteComment(petitionId, id);
  };
  const report = (id) => (authed ? setReportId(id) : requireAuth());
  const block = (id) => (authed ? setBlockId(id) : requireAuth());
  const confirmBlock = () => {
    blockCommentAuthor(petitionId, blockId)
      .then(() => toast("작성자를 차단했습니다"))
      .catch((e) => toast(e?.message || "차단에 실패했습니다"));
  };

  const add = async () => {
    if (!text.trim()) return;
    if (!authed) return requireAuth();
    await addComment(petitionId, text);
    setText("");
  };

  const addReply = async (parentId) => {
    if (!replyText.trim()) return;
    if (!authed) return requireAuth();
    await addComment(petitionId, replyText, parentId);
    setReplyText("");
    setReplyTo(null);
  };

  return (
    <>
      {reportId !== null && <ReportDialog target="댓글" onClose={() => setReportId(null)} onSubmit={(reasonType, reasonDetail) => reportComment(reportId, reasonType, reasonDetail)} />}
      {blockId !== null && <BlockConfirmDialog title="이 댓글을 쓴 사용자를 차단할까요?" onConfirm={confirmBlock} onClose={() => setBlockId(null)} />}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-strong)", margin: "0 0 4px" }}>댓글 {total}</h2>
      <Card>
        {list.map((c) => (
          <div key={c.id}>
            <CommentRow c={c} onToggleLike={toggleLike} onEdit={editComment} onDelete={removeComment} onReport={report} onBlock={block} />
            <button
              type="button"
              onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", margin: "8px 0 8px 48px" }}
            >
              답글달기
            </button>
            {(c.replies ?? []).map((r) => (
              <CommentRow key={r.id} c={r} reply onToggleLike={toggleLike} onEdit={editComment} onDelete={removeComment} onReport={report} onBlock={block} />
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
  const authed = useSession((s) => s.authed);
  const navigate = useNavigate();
  const location = useLocation();

  const [missing, setMissing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // 동의(공감)를 포함한 로그인 필요 동작 — 게스트가 시도하면 로그인 후 이 청원으로 복귀한다.
  const requireAuth = () => navigate(`/login?next=${encodeURIComponent(location.pathname)}`);

  useEffect(() => {
    window.scrollTo(0, 0);
    setMissing(false);
    // 잘못된 id(비숫자 등)는 서버가 404가 아닌 다른 오류로 응답할 수 있다 — 어떤 오류든
    // "찾을 수 없음"으로 처리한다. catch 없이 두면 그 케이스만 무한 로딩에 빠진다.
    loadPetition(pid)
      .then((found) => setMissing(!found))
      .catch(() => setMissing(true));
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
      {reportOpen && <ReportDialog target="게시글" onClose={() => setReportOpen(false)} onSubmit={(reasonType, reasonDetail) => reportPetition(p.id, reasonType, reasonDetail)} />}
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
              onClick={() => (authed ? setReportOpen(true) : requireAuth())}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, padding: "7px 4px", display: "flex", alignItems: "center", gap: 4 }}
            >
              <Icon name="flag" size={14} />
              신고
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
            onToggle={() => (authed ? toggleVoteWithConfirm(vote, p.id, voted) : requireAuth())}
          />
          <IconButton
            variant={bookmarked ? "solid" : "outline"}
            size={52}
            ariaLabel={bookmarked ? "북마크 해제" : "북마크"}
            aria-pressed={bookmarked}
            onClick={async () => {
              if (!authed) return requireAuth();
              toast((await bookmark(p.id)) ? "북마크에 저장했습니다" : "북마크를 해제했습니다");
            }}
          >
            <Icon name="bookmark" size={20} />
          </IconButton>
        </div>

        <ShareLink url={`${window.location.origin}/p/${p.id}`} />
      </Card>

      {answer && <div style={{ marginTop: 18 }}><AdminAnswer a={answer} /></div>}

      <div style={{ marginTop: 26 }}><CommentsSection petitionId={pid} authed={authed} requireAuth={requireAuth} /></div>
    </div>
  );
}
