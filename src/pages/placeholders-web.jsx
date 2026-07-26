/* Phase 0 의 라우트 플레이스홀더. Phase 1(Web)·Phase 2(Admin) 가 화면별 파일로 교체하고
   src/App.jsx 의 import 만 갈아 끼우면 된다. LoginScreen 만 실제 동작한다 —
   0-8 의 딥링크 복귀(/p/3 → /login?next=/p/3 → /p/3)를 검증해야 하기 때문. */

import { useEffect } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSession } from "../stores/session";
import { usePetitions } from "../stores/petitions";
import { Button, Card, EmpathyButton, Input, StatusBadge } from "../components/ui";
import { toast } from "../components/Toast";

const page = { maxWidth: "var(--page-max)", margin: "0 auto", padding: "28px var(--page-gutter) 80px", display: "flex", flexDirection: "column", gap: 16 };
const heading = { margin: 0, fontSize: 22, fontWeight: 800, color: "var(--text-strong)" };

export function LoginScreen() {
  const authed = useSession((s) => s.authed);
  const login = useSession((s) => s.login);
  const [params] = useSearchParams();
  const next = params.get("next") || "/";

  if (authed) return <Navigate to={next} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await login(form.get("sid"), form.get("password"));
    } catch (err) {
      toast(err.message);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--gradient-hero)", padding: 20 }}>
      <form onSubmit={submit} style={{ width: 400, maxWidth: "100%", background: "#fff", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: 36, display: "flex", flexDirection: "column", gap: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--indigo-600)", textAlign: "center" }}>청원시스템</h1>
        <Input label="학번" name="sid" defaultValue="202214139" required />
        <Input label="비밀번호" name="password" type="password" defaultValue="password" required />
        <Button type="submit" size="lg" block>
          로그인
        </Button>
      </form>
    </div>
  );
}

/** `/`, `/answered`, `/mine` 공용 플레이스홀더 */
export function FeedScreen({ nav = "feed" }) {
  const petitions = usePetitions((s) => s.petitions);
  const voted = usePetitions((s) => s.voted);
  const vote = usePetitions((s) => s.vote);
  const navigate = useNavigate();
  const list = nav === "answered" ? petitions.filter((p) => p.status === "answered") : nav === "mine" ? petitions.filter((p) => p.mine) : petitions;

  return (
    <div style={page}>
      <h1 style={heading}>{nav === "answered" ? "답변 완료" : nav === "mine" ? "내 청원" : "전체 청원"} {list.length}건</h1>
      {list.map((p) => (
        <Card key={p.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" onClick={() => navigate(`/p/${p.id}`)} style={{ flex: 1, textAlign: "left", background: "none", border: "none", cursor: "pointer", font: "var(--text-h3)", color: "var(--text-strong)" }}>
            {p.title}
          </button>
          <StatusBadge status={p.status} size="sm" />
          <EmpathyButton
            size="sm"
            count={p.current}
            active={!!voted[p.id]}
            onToggle={async () => toast((await vote(p.id)) ? "공감했습니다" : "공감을 취소했습니다")}
          />
        </Card>
      ))}
    </div>
  );
}

export function DetailScreen() {
  const { id } = useParams();
  const loadPetition = usePetitions((s) => s.loadPetition);
  const petition = usePetitions((s) => s.petitions.find((p) => p.id === Number(id)));
  const answer = usePetitions((s) => s.answersById[Number(id)]);
  const bookmarked = usePetitions((s) => !!s.bookmarked[Number(id)]);
  const bookmark = usePetitions((s) => s.bookmark);

  useEffect(() => {
    loadPetition(id);
  }, [id, loadPetition]);

  if (!petition) return <div style={page}>불러오는 중…</div>;

  return (
    <div style={{ ...page, maxWidth: 760 }}>
      <h1 style={heading}>{petition.title}</h1>
      <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
        {petition.current.toLocaleString()} / {petition.threshold.toLocaleString()} · {petition.basis} · 담당 {petition.owner.team} {petition.owner.name}
      </div>
      <Button variant={bookmarked ? "primary" : "outline"} onClick={async () => toast((await bookmark(petition.id)) ? "북마크에 저장했습니다" : "북마크를 해제했습니다")}>
        {bookmarked ? "북마크 해제" : "북마크"}
      </Button>
      {answer && (
        <Card style={{ background: "var(--status-answered-bg)" }}>
          <b>{answer.dept} · 공식 답변</b>
          <p style={{ margin: "8px 0 0" }}>{answer.body}</p>
        </Card>
      )}
    </div>
  );
}

export function SubmitScreen() {
  return (
    <div style={page}>
      <h1 style={heading}>청원 등록</h1>
    </div>
  );
}

export function BookmarkScreen() {
  // 셀렉터는 원시 상태만 고른다. 새 배열을 만드는 셀렉터는 zustand 5 에서 무한 렌더가 된다 —
  // 파생은 렌더 중에 계산한다.
  const petitions = usePetitions((s) => s.petitions);
  const bookmarked = usePetitions((s) => s.bookmarked);
  const list = petitions.filter((p) => bookmarked[p.id]);
  return (
    <div style={page}>
      <h1 style={heading}>북마크 {list.length}건</h1>
      {list.map((p) => (
        <Card key={p.id}>{p.title}</Card>
      ))}
    </div>
  );
}
