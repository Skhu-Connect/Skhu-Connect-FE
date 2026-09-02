/* 학생 웹 셸. 미인증 진입은 /login?next=<원래경로> 로 보내고 로그인 후 복귀한다 (의존 G).

   검색어를 여기 두는 이유: 입력은 Header(셸)에 있고 결과는 FeedScreen(Outlet)에서 렌더된다.
   URL 파라미터가 아니라 로컬 상태다(원본도 그렇다) — 공유는 Outlet context 로 한다. */

import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { listNotices } from "../api";
import { useSession } from "../stores/session";
import { usePetitions } from "../stores/petitions";
import { Toaster } from "../components/Toast";
import Header from "../components/web/Header";
import MobileShareHeader from "../components/web/MobileShareHeader";
import AppInstallBanner from "../components/web/AppInstallBanner";
import { useIsMobile } from "../utils/useIsMobile";

const FEED_PATHS = ["/", "/answered", "/mine"];
// 공유받은 청원 상세는 비로그인도 볼 수 있다(의존 G) — 동의·댓글·신고 같은 개별 동작은
// DetailScreen 이 authed 를 직접 확인해 로그인으로 보낸다.
// 숫자 id로 한정하지 않는다 — 오타난 id(/p/abc)도 DetailScreen이 기존 404("찾을 수 없음") 처리로
// 이미 다루므로, 여기서 걸러 로그인으로 보내면 정상 not-found와 처리가 갈린다.
const GUEST_PATH = /^\/p\/[^/]+$/;

export default function WebLayout() {
  const authed = useSession((s) => s.authed);
  const restored = useSession((s) => s.restored);
  const restore = useSession((s) => s.restore);
  const loadFeed = usePetitions((s) => s.loadFeed);
  const refreshNotifications = usePetitions((s) => s.refreshNotifications);
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  /* 공지는 홈 배너(FeedScreen)와 헤더 확성기 양쪽이 쓴다 — 형제라 공통 부모인 여기서 한 번만 부르고
     검색어와 같은 방식으로 내려준다. 닫힘은 세션 한정이라 useState 다(localStorage 안 쓴다 — iOS 앱과 맞춤).
     실패하면 빈 배열이라 배너도 확성기도 그려지지 않는다. 공지는 부가 정보라 오류 문구를 띄우지 않는다. */
  const [notices, setNotices] = useState([]);
  const [noticeClosed, setNoticeClosed] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!authed && !restored) restore();
  }, [authed, restored, restore]);

  useEffect(() => {
    if (authed) loadFeed();
  }, [authed, loadFeed]);

  /** 알림은 loadFeed 로 로그인 시 한 번만 오고 끝이었다 — 30초마다 다시 불러와 벨 배지가 실제로 갱신되게 한다. */
  useEffect(() => {
    if (!authed) return;
    const id = setInterval(refreshNotifications, 30000);
    return () => clearInterval(id);
  }, [authed, refreshNotifications]);

  useEffect(() => {
    if (authed) listNotices().then(setNotices, () => {});
  }, [authed]);

  if (!authed && !restored) return null; // refreshToken 쿠키로 세션 복구 시도 중 — 결과 나오기 전엔 로그인으로 안 튕긴다

  if (!authed && !GUEST_PATH.test(location.pathname)) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  const onSearch = (q) => {
    setQuery(q);
    if (q && !FEED_PATHS.includes(location.pathname)) navigate("/");
  };

  const mobileShare = isMobile && GUEST_PATH.test(location.pathname);
  /* 확성기는 배너가 있는 홈에서만 띄운다 — 다른 화면에서 누르면 되살릴 배너가 없어 닫힘만 조용히 풀린다. */
  const onOpenNotice = location.pathname === "/" && noticeClosed && notices.length > 0 ? () => setNoticeClosed(false) : null;

  return (
    <>
      {mobileShare ? <MobileShareHeader /> : <Header search={query} onSearch={onSearch} onOpenNotice={onOpenNotice} />}
      {mobileShare ? <AppInstallBanner /> : null}
      <Outlet context={{ query, notices: noticeClosed ? [] : notices, onCloseNotice: () => setNoticeClosed(true) }} />
      <Toaster />
    </>
  );
}
