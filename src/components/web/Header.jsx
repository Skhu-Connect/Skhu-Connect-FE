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

/** 늘 열린 검색 칸. 아이콘만 있다가 눌러야 펴지던 것을 걷어냈다 — 한 번 더 누르게 하고,
    펴질 때 옆 항목을 밀어 헤더가 흔들렸다. 알약 + --gray-100 원시 회색도 같이 나갔다.
    모양은 index.css 의 .web-header-search 가 맡는다(모바일에서 한 줄을 통째로 쓴다). */
function SearchBox({ value, onChange }) {
  return (
    <div className="web-header-search">
      <Icon name="search" size={18} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onChange("");
        }}
        placeholder="건의 검색"
        aria-label="건의 검색"
      />
      {value && (
        <IconButton variant="ghost" size={28} ariaLabel="검색어 지우기" onClick={() => onChange("")}>
          <Icon name="x" size={15} />
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
            /* 코럴(옛 액센트) + 10.5px 를 의미색 + 13px 바닥으로 올렸다. 배지가 그만큼 커진다. */
            <span style={{ position: "absolute", top: -3, right: -3, minWidth: 19, height: 19, borderRadius: "var(--radius-xs)", background: "var(--danger-fill)", color: "#fff", fontSize: "var(--fs-caption)", fontWeight: "var(--fw-bold)", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", pointerEvents: "none", fontVariantNumeric: "tabular-nums" }}>{unread}</span>
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
                <div className="notif-tile" style={{ width: 32, height: 32 }}>
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
          <Avatar size={38} />
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

/** onOpenNotice 는 "공지가 있고 + 배너가 닫혀 있을 때"만 WebLayout 이 넘긴다 — 그때만 확성기를 띄운다.
    활성 표시는 NavLink 가 붙여 주는 aria-current="page" 로 고른다 — 스타일 함수 대신 index.css
    (.web-header-nav)가 맡는다. 모바일에서 헤더가 세 줄로 접히는 데 미디어 쿼리가 필요하다. */
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
    <header className="web-header">
      <div className="web-header-inner">
        <WordMark />
        <nav className="web-header-nav" aria-label="주 메뉴">
          <NavLink to="/" end onClick={() => onSearch("")}>전체 건의</NavLink>
          <NavLink to="/answered" onClick={() => onSearch("")}>답변 완료</NavLink>
          <NavLink to="/mine" onClick={() => onSearch("")}>내 건의</NavLink>
        </nav>
        <SearchBox value={search} onChange={onSearch} />
        <div className="web-header-actions">
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
