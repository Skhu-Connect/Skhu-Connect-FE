/* 공유 링크로 들어온 모바일 방문자에게만 뜨는 앱 안내 바.

   사파리라면 index.html 의 Smart App Banner 메타 태그가 알아서 네이티브 배너를 띄우지만,
   에타 같은 앱의 인앱 브라우저에서는 그게 안 뜬다 — Universal Link 가 안 걸리는 것과 같은
   이유다. 그 자리를 이 바가 대신한다.

   커스텀 스킴(skhupetition://)으로 앱을 직접 열지 않는다. 앱이 없는 기기에서는 사파리가
   "주소가 올바르지 않습니다" 오류창을 먼저 띄워, 첫인상이 오류 팝업이 된다. App Store 링크는
   iOS 가 설치 여부를 보고 열기/받기로 알아서 갈라주므로 감지 로직도 타이머도 필요 없다.

   막지 않는다 — 공감·댓글·북마크는 웹에서도 다 된다. 진짜 마찰은 앱 유무가 아니라 로그인이라,
   설치를 강제하면 참여가 오히려 줄어든다. 닫으면 다시 띄우지 않는다. */

import { useState } from "react";
import { Icon } from "../ui";

const APP_STORE_URL = "https://apps.apple.com/kr/app/id6800192649";
const DISMISS_KEY = "skhu.appBanner.dismissed";

export default function AppInstallBanner() {
  // 프라이빗 모드 등 localStorage 가 막힌 환경에서도 배너 자체는 떠야 한다 — 읽기 실패는 "안 닫음"으로 본다.
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* 저장이 막힌 환경 — 이번 세션 동안만 숨긴다 */
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px var(--page-gutter)",
        background: "var(--indigo-50)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <img src="/logo.png" alt="" width={30} height={30} style={{ borderRadius: 8, display: "block", flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--text-strong)", lineHeight: 1.35 }}>
        성공잇다 앱에서 더 편하게 보기
      </span>
      {/* target 을 열지 않는다 — 인앱 브라우저에서 새 웹뷰가 뜨면 App Store 앱으로 못 넘어간다. */}
      <a
        href={APP_STORE_URL}
        style={{
          flexShrink: 0,
          background: "var(--color-primary)",
          color: "#fff",
          fontSize: 12.5,
          fontWeight: 700,
          padding: "7px 14px",
          borderRadius: "var(--radius-pill)",
          textDecoration: "none",
        }}
      >
        열기
      </a>
      <button
        type="button"
        onClick={dismiss}
        aria-label="앱 안내 닫기"
        style={{ flexShrink: 0, background: "none", border: "none", padding: 4, cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}
