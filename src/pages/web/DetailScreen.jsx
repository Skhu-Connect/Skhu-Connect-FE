/* 청원 상세 + 댓글 (ROADMAP 1-4 · 1-5). 원본: web-app-v7.jsx 300–411행.
   원본 370행의 p.excerpt 2회 반복 렌더는 목데이터 분량 때문이므로 body 필드로 정상화했다.
   답변 카드는 전역 단일 객체가 아니라 answersById[p.id] 를 읽는다 (의존 B). */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePetitions } from "../../stores/petitions";
import { Avatar, Button, Card, CategoryTag, EmpathyButton, Icon, IconButton, StatusBadge, ThresholdBar } from "../../components/ui";
import { toast } from "../../components/Toast";

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
          <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--status-answered-fg)" }}>{a.dept} · 공식 답변</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>담당자 {a.manager} · {a.date}</div>
        </div>
        <div style={{ marginLeft: "auto" }}><StatusBadge status="answered" size="sm" /></div>
      </div>
      <p style={{ margin: 0, fontSize: 14.5, color: "var(--gray-800)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{a.body}</p>
    </Card>
  );
}

function CommentsSection({ petitionId }) {
  const comments = usePetitions((s) => s.commentsById[petitionId]);
  const addComment = usePetitions((s) => s.addComment);
  const [text, setText] = useState("");
  const list = comments ?? [];

  const add = async () => {
    if (!text.trim()) return;
    await addComment(petitionId, text);
    setText("");
  };

  return (
    <>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-strong)", margin: "0 0 4px" }}>댓글 {list.length}</h2>
      <Card>
        {list.map((c) => (
          <div key={c.id} style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: "1px solid var(--border-subtle)" }}>
            <Avatar name="익" size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text-strong)" }}>{c.author}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.date}</span>
              </div>
              <p style={{ margin: "5px 0 0", fontSize: 14, color: "var(--text-body)", lineHeight: 1.6 }}>{c.body}</p>
            </div>
            <button type="button" aria-label={`댓글 공감 ${c.votes}`} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: "var(--coral-500)", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
              <Icon name="heart" size={16} />
              {c.votes}
            </button>
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
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    loadPetition(pid);
  }, [pid, loadPetition]);

  if (!p) return <div style={{ maxWidth: 760, margin: "0 auto", padding: "22px var(--page-gutter) 90px", color: "var(--text-muted)" }}>불러오는 중…</div>;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "22px var(--page-gutter) 90px" }}>
      <button type="button" onClick={() => navigate(-1)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text-body)", fontWeight: 600, fontSize: 14, marginBottom: 18, fontFamily: "var(--font-sans)" }}>
        <Icon name="arrowLeft" size={18} /> 목록으로
      </button>

      <Card padding="var(--pad-card-lg)" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CategoryTag category={p.category} />
          <StatusBadge status={p.status} />
          <div style={{ marginLeft: "auto" }}>
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
            onToggle={async () => toast((await vote(p.id)) ? "공감했습니다" : "공감을 취소했습니다")}
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
