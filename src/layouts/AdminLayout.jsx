/* 관리자 콘솔 셸: 232px navy 사이드바 고정 + 본문만 스크롤.
   인증 가드: adminRefreshToken 쿠키로 세션 복구를 시도하기 전엔 아무것도 안 그린다(깜빡 리다이렉트
   방지, WebLayout 과 같은 패턴) — 실패하면 /admin/login 으로 보낸다.
   원본: design-handoff/project/app/admin-app-v4.jsx 63–83행.
   로고 타일은 Web 과 같은 /logo.png 다 — 브랜드 마크는 화면마다 다르게 그리지 않는다.
   Sidebar 는 이 레이아웃에서만 쓰이므로 파일을 쪼개지 않는다. */

import { useEffect } from "react";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { usePetitions } from "../stores/petitions";
import { useAdminSession } from "../stores/adminSession";
import { Avatar, Icon } from "../components/ui";

const NAV = [
  { to: "/admin", end: true, icon: "dashboard", label: "대시보드" },
  { to: "/admin/manage", icon: "megaphone", label: "청원 관리" },
  { to: "/admin/owners", icon: "users", label: "카테고리 담당자" },
  { to: "/admin/threshold-settings", icon: "sliders", label: "임계치 설정" },
  { to: "/admin/logs", icon: "bell", label: "알림 로그" },
];

export default function AdminLayout() {
  const loadAdmin = usePetitions((s) => s.loadAdmin);
  const authed = useAdminSession((s) => s.authed);
  const restored = useAdminSession((s) => s.restored);
  const restore = useAdminSession((s) => s.restore);
  const logout = useAdminSession((s) => s.logout);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authed && !restored) restore();
  }, [authed, restored, restore]);

  useEffect(() => {
    if (authed) loadAdmin();
  }, [authed, loadAdmin]);

  if (!authed && !restored) return null;
  if (!authed) return <Navigate to="/admin/login" replace />;

  const onLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--surface-page)" }}>
      <aside style={{ width: 232, background: "var(--navy-900)", color: "#fff", display: "flex", flexDirection: "column", flexShrink: 0, padding: "22px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 22px" }}>
          <img src="/logo.png" alt="" width={34} height={34} style={{ borderRadius: 9, display: "block" }} />
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>성공잇다 관리자</div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.55)" }}>ADMIN CONSOLE</div>
          </div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "11px 12px",
                borderRadius: "var(--radius-md)",
                background: isActive ? "rgba(255,255,255,.12)" : "transparent",
                color: isActive ? "#fff" : "rgba(255,255,255,.65)",
                fontSize: 14,
                fontWeight: isActive ? 700 : 500,
                // 원본은 <button> 이라 UA line-height:normal 이었다. NavLink(<a>)는 body 의
                // 1.5 를 상속받아 항목마다 2px 두꺼워지고 4개가 누적돼 하단 프로필이 밀린다.
                lineHeight: "normal",
                textDecoration: "none",
              })}
            >
              <Icon name={n.icon} size={19} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", borderTop: "1px solid rgba(255,255,255,.1)" }}>
          <Avatar name="관리" size={34} />
          {/* 관리자 프로필 조회 API 가 없어 이름·이메일은 여전히 자리표시자다 — 로그인 자체는
              실 세션이므로 로그아웃만 실제로 동작한다. */}
          <div style={{ fontSize: 12.5, flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700 }}>총괄 관리자</div>
            <div style={{ color: "rgba(255,255,255,.5)", fontSize: 11 }}>admin@example.com</div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,.55)", padding: 4 }}
          >
            로그아웃
          </button>
        </div>
      </aside>
      <Outlet />
    </div>
  );
}
