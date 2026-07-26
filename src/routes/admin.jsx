/* 관리자 콘솔 라우트. Phase 2 는 이 파일과 src/pages/admin/* 만 건드린다.
   목 단계에서 인증 게이트 없음 — Phase 3-2 security review 기록 항목. */

import { Route } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import Dashboard from "../pages/admin/Dashboard";
import Manage from "../pages/admin/Manage";
import Owners from "../pages/admin/Owners";
import Logs from "../pages/admin/Logs";

export function adminRoutes() {
  return (
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={<Dashboard />} />
      <Route path="manage" element={<Manage />} />
      <Route path="owners" element={<Owners />} />
      <Route path="logs" element={<Logs />} />
    </Route>
  );
}
