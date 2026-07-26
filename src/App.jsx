/* 라우터 셸 (ROADMAP 0-8). 프로토타입의 nav 상태(feed/answered/mine)를 URL 로 승격한다 —
   Header 활성 밑줄이 경로에서 파생되고 ShareLink 의 /p/1029 가 실제 주소가 된다.

   경로 정의는 트랙별 파일에 있다: routes/web.jsx · routes/admin.jsx. */

import { Navigate, Route, Routes } from "react-router-dom";
import { webRoutes } from "./routes/web";
import { adminRoutes } from "./routes/admin";
import DsGallery from "./pages/DsGallery";

export default function App() {
  return (
    <Routes>
      {webRoutes()}
      {adminRoutes()}

      {/* DS 이식 확인용 임시 페이지 */}
      <Route path="/_ds" element={<DsGallery />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
