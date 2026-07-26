/* 환경설정 모달 (ROADMAP 1-7). 원본: web-app-v7.jsx 529–572행.
   44×26px 토글은 DS 14종에 없어서 여기서 만든다 — 이 모달 밖에서 쓰이지 않는다.
   토글 상태는 session 스토어 prefs 다(모달을 닫았다 열어도 유지). */

import { useSession } from "../../stores/session";
import { Button, Icon } from "../ui";

function Toggle({ on, label, onClick }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      style={{ width: 44, height: 26, borderRadius: 99, border: "none", cursor: "pointer", background: on ? "var(--indigo-600)" : "var(--gray-150)", position: "relative", flexShrink: 0, padding: 0 }}
    >
      <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "var(--shadow-sm)", transition: "left .15s ease" }} />
    </button>
  );
}

const ROWS = [
  ["threshold", "임계치 도달 알림", "내 청원이 임계치에 도달하면 알려드립니다."],
  ["answer", "답변 등록 알림", "공감한 청원에 공식 답변이 등록되면 알려드립니다."],
  ["empathy", "공감 알림", "내 청원의 공감 수 변화를 알려드립니다."],
];

export default function SettingsModal({ user, onClose }) {
  const prefs = useSession((s) => s.prefs) ?? {};
  const savePrefs = useSession((s) => s.savePrefs);

  return (
    /* 스크림 클릭으로 닫기(원본 545행). Escape 는 onKeyDown 이 받는다 —
       열릴 때 닫기 버튼이 autoFocus 라 포커스가 항상 모달 안에 있다. */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="환경설정"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(30,30,60,.45)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: 460, maxWidth: "100%", background: "var(--surface-card)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--text-strong)" }}>환경설정</h2>
          <button autoFocus type="button" onClick={onClose} aria-label="닫기" style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "inline-flex" }}>
            <Icon name="x" size={20} />
          </button>
        </div>
        <div style={{ background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", padding: "13px 16px", marginBottom: 18, fontSize: 13.5, color: "var(--text-body)" }}>
          <b style={{ color: "var(--text-strong)" }}>{user.name}</b> · {user.dept} {user.year}학년 · {user.sid}
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>개인정보는 인증에만 사용되며 청원은 익명 처리됩니다.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {ROWS.map(([key, title, desc]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 2px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--text-strong)" }}>{title}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{desc}</div>
              </div>
              <Toggle on={!!prefs[key]} label={title} onClick={() => savePrefs({ [key]: !prefs[key] })} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <Button variant="primary" onClick={onClose}>확인</Button>
        </div>
      </div>
    </div>
  );
}
