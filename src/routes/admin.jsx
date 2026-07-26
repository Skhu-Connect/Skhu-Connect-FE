/* 관리자 콘솔 라우트. Phase 2 는 이 파일과 src/pages/admin/* 만 건드린다.
   목 단계에서 인증 게이트 없음 — Phase 3-2 security review 기록 항목. */

import { Route } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import {
  AdminDashboard,
  AdminLogs,
  AdminManage,
  AdminOwners,
} from "../pages/placeholders-admin";

export function adminRoutes() {
  return (
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={<AdminDashboard />} />
      <Route path="manage" element={<AdminManage />} />
      <Route path="owners" element={<AdminOwners />} />
      <Route path="logs" element={<AdminLogs />} />
    </Route>
  );
}
