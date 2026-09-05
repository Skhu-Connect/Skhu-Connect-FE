/* sticky Header + 4개 하위 부품 (ROADMAP 1-2). 원본: web-app-v7.jsx 61–178행.
   한 덩어리로 두는 이유: SearchBox·NotifBell·AvatarMenu 는 이 헤더 밖에서 쓰이지 않는다.
   WordMark 만 예외 — MobileShareHeader(모바일 공유 진입 축소 헤더)가 재사용한다.

   검색어는 URL 이 아니라 WebLayout 의 useState 다 — 검색 결과는 피드 화면 안에서 렌더된다.
   드롭다운 열림도 여기 로컬 상태다. */

import { useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSession } from "../../stores/session";
import { usePetitions } from "../../stores/petitions";
import { Avatar, Button, Icon, IconButton } from "../ui";
import SettingsModal from "./SettingsModal";
import { pointOf } from "./notifMeta";

export function WordMark() {
  return (
    <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
      <img src="/logo.png" alt="" width={34} height={34} style={{ borderRadius: 10, display: "block" }} />
      <div style={{ lineHeight: 1.05 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: "var(--indigo-600)", letterSpacing: "-.01em" }}>성공잇다</div>
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
          placeholder="건의 검색"
          aria-label="건의 검색"
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

/** 이슈 #39 에서 목록을 마이페이지로 뺐다가, 벨을 눌렀을 때 그 자리에서 바로 보이는 편이 낫다는
    피드백으로 다시 드롭다운으로 되돌렸다(마이페이지 목록은 그대로 둔다 — 전체 보기 진입점). */
function NotifBell() {
  const items = usePetitions((s) => s.notifications);
  const markAllNotifRead = usePetitions((s) => s.markAllNotifRead);
  const markNotifRead = usePetitions((s) => s.markNotifRead);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const unread = items.filter((n) => !n.read).length;

  return (
    <Dropdown
      open={open}
      onClose={() => setOpen(false)}
      width={340}
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
      <div style={{ display: "flex", alignItems: "center", padding: "13px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
        <span style={{ fontWeight: 800, fontSize: 14.5, color: "var(--text-strong)" }}>{unread > 0 ? `${unread}건 안 읽음` : "알림"}</span>
        <button type="button" onClick={markAllNotifRead} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, color: "var(--indigo-600)" }}>
          모두 읽음
        </button>
      </div>
      <div style={{ maxHeight: 360, overflowY: "auto" }}>
        {items.length === 0 ? (
          <div style={{ padding: 18, fontSize: 13.5, color: "var(--text-muted)" }}>알림이 없습니다.</div>
        ) : (
          items.map((n) => {
            const m = pointOf(n.type);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (!n.read) markNotifRead(n.id);
                  // 공지(NOTICE) 알림엔 청원이 없다 — /p/undefined 로 튀지 않게 막는다.
                  if (n.petitionId) navigate(`/p/${n.petitionId}`);
                }}
                style={{ display: "flex", gap: 11, width: "100%", textAlign: "left", padding: "12px 16px", background: n.read ? "transparent" : "var(--indigo-50)", border: "none", borderTop: "1px solid var(--border-subtle)", cursor: "pointer", fontFamily: "var(--font-sans)" }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: m.bg, color: m.fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={m.icon} size={16} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "var(--text-body)", lineHeight: 1.5 }}>{n.body}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{n.date}</div>
                </div>
              </button>
            );
          })
        )}
      </div>
      <button
        type="button"
        onClick={() => { setOpen(false); navigate("/mypage"); }}
        style={{ display: "block", width: "100%", textAlign: "center", padding: "11px", background: "none", border: "none", borderTop: "1px solid var(--border-subtle)", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700, color: "var(--indigo-600)" }}
      >
        전체 알림 보기
      </button>
    </Dropdown>
  );
}

function AvatarMenu({ user, onSelect }) {
  const [open, setOpen] = useState(false);
  const item = (icon, label, key) => (
    <button
      type="button"
      onClick={() => { setOpen(false); onSelect(key); }}
      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, color: "var(--text-body)", textAlign: "left" }}
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
          <Avatar size={38} ring />
        </button>
      }
    >
      {/* 서버가 이름을 안 준다(익명 설계) — 아이덴티티는 학부 한 줄 + 아이디로 대체한다.
          "이름 빠진 자리" 가 아니라 익명 서비스에 맞는 표시로 다시 짰다. */}
      <div style={{ padding: "6px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px 12px", borderBottom: "1px solid var(--border-subtle)", marginBottom: 4 }}>
          <Avatar size={34} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 14.5, color: "var(--text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.dept}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{user.loginId}</div>
          </div>
        </div>
        {item("user", "마이페이지", "mypage")}
        {item("bookmark", "북마크", "bookmarks")}
        {item("sliders", "환경설정", "settings")}
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

/** onOpenNotice 는 "공지가 있고 + 배너가 닫혀 있을 때"만 WebLayout 이 넘긴다 — 그때만 확성기를 띄운다. */
export default function Header({ search, onSearch, onOpenNotice }) {
  const user = useSession((s) => s.user);
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const onMenu = (key) => {
    if (key === "mypage") navigate("/mypage");
    else if (key === "bookmarks") navigate("/bookmarks");
    else if (key === "settings") setSettingsOpen(true);
  };

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(255,255,255,.9)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--border-subtle)" }}>
      <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "0 var(--page-gutter)", height: 66, display: "flex", alignItems: "center", gap: 28 }}>
        <WordMark />
        <nav style={{ display: "flex", alignItems: "center", gap: 22, marginLeft: 8 }}>
          <NavLink to="/" end style={navLinkStyle} onClick={() => onSearch("")}>전체 건의</NavLink>
          <NavLink to="/answered" style={navLinkStyle} onClick={() => onSearch("")}>답변 완료</NavLink>
          <NavLink to="/mine" style={navLinkStyle} onClick={() => onSearch("")}>내 건의</NavLink>
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
          <SearchBox value={search} onChange={onSearch} />
          {onOpenNotice && (
            <IconButton variant="ghost" ariaLabel="공지사항 다시 보기" onClick={onOpenNotice}>
              <Icon name="megaphone" size={20} />
            </IconButton>
          )}
          <NotifBell />
          <Button variant="primary" size="sm" leadingIcon={<Icon name="plus" size={16} />} onClick={() => navigate("/submit")}>건의 등록</Button>
          {user && <AvatarMenu user={user} onSelect={onMenu} />}
        </div>
      </div>
      {settingsOpen && <SettingsModal user={user} onClose={() => setSettingsOpen(false)} />}
    </header>
  );
}
