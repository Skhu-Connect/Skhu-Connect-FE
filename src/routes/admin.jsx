/* 관리자 콘솔 라우트. Phase 2 는 이 파일과 src/pages/admin/* 만 건드린다.
   /admin/login 은 AdminLayout 밖의 형제 경로다 — 안에 넣으면 그 레이아웃의 인증 가드가
   로그인 화면 자체를 다시 로그인으로 튕겨내는 순환이 생긴다. */

import { Route } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import AdminLoginScreen from "../pages/admin/Login";
import Dashboard from "../pages/admin/Dashboard";
import Manage from "../pages/admin/Manage";
import Logs from "../pages/admin/Logs";
import ThresholdSettings from "../pages/admin/ThresholdSettings";
import Reports from "../pages/admin/Reports";

export function adminRoutes() {
  return (
    <>
      <Route path="/admin/login" element={<AdminLoginScreen />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="manage" element={<Manage />} />
        <Route path="logs" element={<Logs />} />
        <Route path="threshold-settings" element={<ThresholdSettings />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </>
  );
}
