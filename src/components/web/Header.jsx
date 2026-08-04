/* sticky Header + 4개 하위 부품 (ROADMAP 1-2). 원본: web-app-v7.jsx 61–178행.
   한 덩어리로 두는 이유: WordMark·SearchBox·NotifBell·AvatarMenu 는 이 헤더 밖에서 쓰이지 않는다.

   검색어는 URL 이 아니라 WebLayout 의 useState 다 — 검색 결과는 피드 화면 안에서 렌더된다.
   드롭다운 열림도 여기 로컬 상태다. */

import { useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSession } from "../../stores/session";
import { usePetitions } from "../../stores/petitions";
import { Avatar, Button, Icon, IconButton } from "../ui";
import SettingsModal from "./SettingsModal";

function WordMark() {
  return (
    <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
      <img src="/logo.png" alt="" width={34} height={34} style={{ borderRadius: 10, display: "block" }} />
      <div style={{ lineHeight: 1.05 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: "var(--indigo-600)", letterSpacing: "-.01em" }}>청원시스템</div>
        <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 600 }}>성공회대학교</div>
      </div>
    </Link>
  );
}

function SearchBox({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const show = open || !!value;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, background: show ? "var(--gray-100)" : "transparent", borderRadius: "var(--radius-pill)", padding: show ? "3px 4px 3px 14px" : 0 }}>
      {show && <Icon name="search" size={17} color="var(--text-muted)" />}
      {show && (
        <input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              onChange("");
              setOpen(false);
            }
          }}
          placeholder="청원 검색"
          aria-label="청원 검색"
          style={{ width: 180, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-strong)" }}
        />
      )}
      {show ? (
        <IconButton variant="ghost" size={32} ariaLabel="검색어 지우기" onClick={() => { onChange(""); setOpen(false); }}>
          <Icon name="x" size={16} />
        </IconButton>
      ) : (
        <IconButton variant="ghost" ariaLabel="검색" onClick={() => setOpen(true)}>
          <Icon name="search" size={20} />
        </IconButton>
      )}
    </div>
  );
}

const NOTIF_META = {
  threshold: { icon: "trending", bg: "var(--status-review-bg)", fg: "var(--status-review-fg)" },
  answer: { icon: "checkCircle", bg: "var(--status-answered-bg)", fg: "var(--status-answered-fg)" },
  empathy: { icon: "heart", bg: "#FCE7E9", fg: "var(--coral-600)" },
};

/** 투명 오버레이로 외부 클릭을 닫는다(원본 position:fixed;inset:0). Escape 는 컨테이너에서 받는다. */
function Dropdown({ open, onClose, width, children, trigger }) {
  const ref = useRef(null);
  return (
    <div
      ref={ref}
      style={{ position: "relative" }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          onClose();
          ref.current?.querySelector("button")?.focus();
        }
      }}
    >
      {trigger}
      {open && (
        <>
          <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 30 }} onClick={onClose} />
          <div style={{ position: "absolute", right: 0, top: 48, width, background: "var(--surface-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-lg)", zIndex: 31, overflow: "hidden" }}>
            {children}
          </div>
        </>
      )}
    </div>
  );
}

function NotifBell() {
  const [open, setOpen] = useState(false);
  const items = usePetitions((s) => s.notifications);
  const markAllRead = usePetitions((s) => s.markAllNotifRead);
  const navigate = useNavigate();
  const unread = items.filter((n) => !n.read).length;

  return (
    <Dropdown
      open={open}
      onClose={() => setOpen(false)}
      width={350}
      trigger={
        <div style={{ position: "relative" }}>
          <IconButton variant="ghost" ariaLabel="알림" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <Icon name="bell" size={20} />
          </IconButton>
          {unread > 0 && (
            <span style={{ position: "absolute", top: -2, right: -2, minWidth: 17, height: 17, borderRadius: 99, background: "var(--coral-500)", color: "#fff", fontSize: 10.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", pointerEvents: "none" }}>{unread}</span>
          )}
        </div>
      }
    >
      <div style={{ display: "flex", alignItems: "center", padding: "14px 18px 10px" }}>
        <span style={{ fontWeight: 800, fontSize: 15, color: "var(--text-strong)" }}>알림</span>
        {unread > 0 && <span style={{ marginLeft: 7, fontSize: 12, fontWeight: 700, color: "var(--coral-500)" }}>{unread}건 안 읽음</span>}
        <button type="button" onClick={markAllRead} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, color: "var(--indigo-600)" }}>
          모두 읽음
        </button>
      </div>
      {items.map((n) => {
        const m = NOTIF_META[n.type];
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => { setOpen(false); navigate(`/p/${n.petitionId}`); }}
            style={{ display: "flex", gap: 11, width: "100%", textAlign: "left", padding: "13px 18px", background: n.read ? "transparent" : "var(--indigo-50)", border: "none", borderTop: "1px solid var(--border-subtle)", cursor: "pointer", fontFamily: "var(--font-sans)" }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: m.bg, color: m.fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={m.icon} size={17} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, color: "var(--text-body)", lineHeight: 1.55 }}>
                <b style={{ color: "var(--text-strong)" }}>{n.title}</b> · {n.body}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 3 }}>{n.date}</div>
            </div>
          </button>
        );
      })}
    </Dropdown>
  );
}

function AvatarMenu({ user, onSelect }) {
  const [open, setOpen] = useState(false);
  const item = (icon, label, key) => (
    <button
      type="button"
      onClick={() => { setOpen(false); onSelect(key); }}
      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, color: key === "logout" ? "var(--coral-600)" : "var(--text-body)", textAlign: "left" }}
    >
      <Icon name={icon} size={17} />
      {label}
    </button>
  );
  return (
    <Dropdown
      open={open}
      onClose={() => setOpen(false)}
      width={240}
      trigger={
        <button type="button" aria-label="내 메뉴" aria-expanded={open} onClick={() => setOpen((o) => !o)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "inline-flex" }}>
          <Avatar name={user.name.slice(1)} size={38} ring />
        </button>
      }
    >
      <div style={{ padding: "6px 0" }}>
        <div style={{ padding: "10px 16px 12px", borderBottom: "1px solid var(--border-subtle)", marginBottom: 4 }}>
          <div style={{ fontWeight: 800, fontSize: 14.5, color: "var(--text-strong)" }}>{user.name}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{user.dept} · {user.year}학년</div>
        </div>
        {item("user", "마이페이지", "mypage")}
        {item("bookmark", "북마크", "bookmarks")}
        {item("sliders", "환경설정", "settings")}
        <div style={{ borderTop: "1px solid var(--border-subtle)", margin: "4px 0" }} />
        {item("logOut", "로그아웃", "logout")}
      </div>
    </Dropdown>
  );
}

const navLinkStyle = ({ isActive }) => ({
  background: "none",
  border: "none",
  fontFamily: "var(--font-sans)",
  fontSize: 15,
  fontWeight: isActive ? 700 : 500,
  // 원본은 nav 를 <button> 으로 짜서 UA 의 line-height:normal 이었다. 여기는 NavLink(<a>)라
  // body 의 1.5 를 상속받아 링크 박스가 4.5px 두꺼워지고 활성 밑줄이 그만큼 내려간다.
  lineHeight: "normal",
  color: isActive ? "var(--indigo-600)" : "var(--text-body)",
  padding: "8px 2px",
  borderBottom: isActive ? "2.5px solid var(--indigo-600)" : "2.5px solid transparent",
  textDecoration: "none",
});

export default function Header({ search, onSearch }) {
  const user = useSession((s) => s.user);
  const logout = useSession((s) => s.logout);
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const onMenu = (key) => {
    if (key === "mypage") navigate("/mypage");
    else if (key === "bookmarks") navigate("/bookmarks");
    else if (key === "settings") setSettingsOpen(true);
    else if (key === "logout") logout();
  };

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(255,255,255,.9)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--border-subtle)" }}>
      <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "0 var(--page-gutter)", height: 66, display: "flex", alignItems: "center", gap: 28 }}>
        <WordMark />
        <nav style={{ display: "flex", alignItems: "center", gap: 22, marginLeft: 8 }}>
          <NavLink to="/" end style={navLinkStyle} onClick={() => onSearch("")}>전체 청원</NavLink>
          <NavLink to="/answered" style={navLinkStyle} onClick={() => onSearch("")}>답변 완료</NavLink>
          <NavLink to="/mine" style={navLinkStyle} onClick={() => onSearch("")}>내 청원</NavLink>
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
          <SearchBox value={search} onChange={onSearch} />
          <NotifBell />
          <Button variant="primary" size="sm" leadingIcon={<Icon name="plus" size={16} />} onClick={() => navigate("/submit")}>청원 등록</Button>
          {user && <AvatarMenu user={user} onSelect={onMenu} />}
        </div>
      </div>
      {settingsOpen && <SettingsModal user={user} onClose={() => setSettingsOpen(false)} />}
    </header>
  );
}
