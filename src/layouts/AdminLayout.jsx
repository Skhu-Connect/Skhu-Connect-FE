/* 관리자 콘솔 셸: 232px navy 사이드바 고정 + 본문만 스크롤.
   목 단계에서 /admin 에는 인증 게이트가 없다 — Phase 3-2 security review 에 기록할 항목.
   Sidebar 는 플레이스홀더다 — Phase 2-1 이 "청" 타일·관리자 프로필까지 채운다. */

import { useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { usePetitions } from "../stores/petitions";
import { Icon } from "../components/ui";

const NAV = [
  { to: "/admin", end: true, icon: "dashboard", label: "대시보드" },
  { to: "/admin/manage", icon: "megaphone", label: "청원 관리" },
  { to: "/admin/owners", icon: "users", label: "카테고리 담당자" },
  { to: "/admin/logs", icon: "bell", label: "알림 로그" },
];

export default function AdminLayout() {
  const loadFeed = usePetitions((s) => s.loadFeed);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--surface-page)" }}>
      <aside style={{ width: 232, background: "var(--navy-900)", color: "#fff", display: "flex", flexDirection: "column", flexShrink: 0, padding: "22px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 22px" }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--gradient-mileage)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>청</div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>청원 관리자</div>
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
                textDecoration: "none",
              })}
            >
              <Icon name={n.icon} size={19} />
              {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <Outlet />
    </div>
  );
}
