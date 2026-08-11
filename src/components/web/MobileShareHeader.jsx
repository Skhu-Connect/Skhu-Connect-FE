/* 모바일에서 공유받은 청원(/p/:id)에 진입했을 때만 쓰는 축소 헤더 — 전체 네비게이션(피드·검색·
   알림·건의 등록)이 없다. 모바일 웹은 전체 서비스를 제공하지 않고 공유받은 청원만 보여준다. */

import { WordMark } from "./Header";

export default function MobileShareHeader() {
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(255,255,255,.9)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--border-subtle)" }}>
      <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "0 var(--page-gutter)", height: 66, display: "flex", alignItems: "center" }}>
        <WordMark />
      </div>
    </header>
  );
}
