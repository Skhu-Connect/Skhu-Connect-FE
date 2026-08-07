/* 환경설정 모달 (ROADMAP 1-7). 원본: web-app-v7.jsx 529–572행.
   알림 설정 토글 섹션은 마이페이지로 옮겼다(이슈 #39) — 여기는 계정 정보 표시만 남는다. */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button, Icon } from "../ui";

export default function SettingsModal({ user, onClose }) {
  // Escape 는 document 에서 받는다 — dialog 의 onKeyDown 으로 두면
  // 포커스가 모달 밖으로 나간 순간(트랩 없음) 키가 안 잡힌다.
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* body 로 포털한다: 호출부가 <header> 안이고 그 헤더에 backdrop-filter 가 걸려 있어
     position:fixed 의 containing block 이 헤더(66px)로 좁혀진다 — 그대로 두면 모달 상단이 잘린다. */
  return createPortal(
    /* 스크림 클릭으로 닫기(원본 545행). Escape 는 위 document 리스너가 받는다. */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="환경설정"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(30,30,60,.45)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: 460, maxWidth: "100%", background: "var(--surface-card)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--text-strong)" }}>환경설정</h2>
          <button autoFocus type="button" onClick={onClose} aria-label="닫기" style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "inline-flex" }}>
            <Icon name="x" size={20} />
          </button>
        </div>
        <div style={{ background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", padding: "13px 16px", fontSize: 13.5, color: "var(--text-body)" }}>
          <b style={{ color: "var(--text-strong)" }}>{user.dept}</b> · {user.loginId}
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>개인정보는 인증에만 사용되며 건의는 익명 처리됩니다.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <Button variant="primary" onClick={onClose}>확인</Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
