/* 학생 웹 셸. 미인증 진입은 /login?next=<원래경로> 로 보내고 로그인 후 복귀한다 (의존 G).
   Header 는 플레이스홀더다 — Phase 1-2 가 sticky Header(66px, blur, 검색·알림·아바타)로 교체한다. */

import { useEffect } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "../stores/session";
import { usePetitions } from "../stores/petitions";
import { Toaster } from "../components/Toast";

export default function WebLayout() {
  const authed = useSession((s) => s.authed);
  const loadFeed = usePetitions((s) => s.loadFeed);
  const location = useLocation();

  useEffect(() => {
    if (authed) loadFeed();
  }, [authed, loadFeed]);

  if (!authed) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return (
    <>
      <PlaceholderHeader />
      <Outlet />
      <Toaster />
    </>
  );
}

/* TODO(Phase 1-2): 실제 Header 로 교체 */
function PlaceholderHeader() {
  const logout = useSession((s) => s.logout);
  const linkStyle = ({ isActive }) => ({
    fontSize: 15,
    fontWeight: isActive ? 700 : 500,
    color: isActive ? "var(--indigo-600)" : "var(--text-body)",
    padding: "8px 2px",
    borderBottom: isActive ? "2.5px solid var(--indigo-600)" : "2.5px solid transparent",
    textDecoration: "none",
  });
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(255,255,255,.9)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--border-subtle)" }}>
      <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "0 var(--page-gutter)", height: 66, display: "flex", alignItems: "center", gap: 22 }}>
        <Link to="/" style={{ fontWeight: 800, fontSize: 18, color: "var(--indigo-600)", textDecoration: "none" }}>
          청원시스템
        </Link>
        <NavLink to="/" end style={linkStyle}>
          전체 청원
        </NavLink>
        <NavLink to="/answered" style={linkStyle}>
          답변 완료
        </NavLink>
        <NavLink to="/mine" style={linkStyle}>
          내 청원
        </NavLink>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <NavLink to="/submit" style={linkStyle}>
            청원 등록
          </NavLink>
          <NavLink to="/bookmarks" style={linkStyle}>
            북마크
          </NavLink>
          <button type="button" onClick={logout} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, color: "var(--coral-600)" }}>
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
