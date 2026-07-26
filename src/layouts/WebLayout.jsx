/* 학생 웹 셸. 미인증 진입은 /login?next=<원래경로> 로 보내고 로그인 후 복귀한다 (의존 G).

   검색어를 여기 두는 이유: 입력은 Header(셸)에 있고 결과는 FeedScreen(Outlet)에서 렌더된다.
   URL 파라미터가 아니라 로컬 상태다(원본도 그렇다) — 공유는 Outlet context 로 한다. */

import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../stores/session";
import { usePetitions } from "../stores/petitions";
import { Toaster } from "../components/Toast";
import Header from "../components/web/Header";

const FEED_PATHS = ["/", "/answered", "/mine"];

export default function WebLayout() {
  const authed = useSession((s) => s.authed);
  const loadFeed = usePetitions((s) => s.loadFeed);
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (authed) loadFeed();
  }, [authed, loadFeed]);

  if (!authed) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  const onSearch = (q) => {
    setQuery(q);
    if (q && !FEED_PATHS.includes(location.pathname)) navigate("/");
  };

  return (
    <>
      <Header search={query} onSearch={onSearch} />
      <Outlet context={{ query }} />
      <Toaster />
    </>
  );
}
