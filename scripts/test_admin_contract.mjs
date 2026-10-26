import assert from "node:assert/strict";
import { createServer } from "vite";

// 실제 서버 요청 없이 인증·역할·신고·카테고리 계약을 검증한다.
const originalFetch = globalThis.fetch;
const server = await createServer({ server: { middlewareMode: true, hmr: false }, logLevel: "error" });
try {
  const api = await server.ssrLoadModule("/src/api/index.js");
  const { useAdminSession } = await server.ssrLoadModule("/src/stores/adminSession.js");
  let role = "EMERGENCY_COMMITTEE";
  let software = true;
  let categoriesStatus = 200;
  let forbidden = false;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    const path = new URL(url).pathname;
    calls.push({ path, ...options });
    const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
    if (path === "/connect/admin/auth/login") return json({ accessToken: "test-admin-token" });
    if (path === "/connect/admin/me") return json({ id: 1, loginId: "test-admin", role });
    if (path === "/connect/admin/reports") return json({ content: [
      { id: 1, petitionCategory: "SOFTWARE_CONVERGENCE" },
      { id: 2, petitionCategory: "FACILITY" },
      { id: 3 },
    ] });
    if (path === "/connect/admin/threshold-settings/SOFTWARE_CONVERGENCE") {
      if (forbidden) return json({ title: "ADMIN_FORBIDDEN" }, 403);
      return json({ category: "SOFTWARE_CONVERGENCE", ...JSON.parse(options.body), targetAgreementCount: 10 });
    }
    if (path === "/connect/auth/login") return json({ accessToken: "test-user-token" });
    if (path === "/connect/users/me") return json({ id: 2, loginId: "test-user", departmentName: "소프트웨어융합학부" });
    if (path === "/connect/petitions/categories") {
      if (categoriesStatus !== 200) return json({ title: "Unavailable" }, categoriesStatus);
      return json(["SCHOLARSHIP", "FACILITY", ...(software ? ["SOFTWARE_CONVERGENCE"] : [])]);
    }
    throw new Error(`테스트에 없는 요청: ${path}`);
  };

  for (role of ["EMERGENCY_COMMITTEE", "STUDENT_COUNCIL"]) {
    await useAdminSession.getState().login("test-admin", "test-password");
    assert.equal(useAdminSession.getState().role, role);
    assert.equal(calls.at(-1).path, "/connect/admin/me");
    assert.equal(calls.at(-1).headers.Authorization, "Bearer test-admin-token");
  }
  role = "UNKNOWN";
  await useAdminSession.getState().login("test-admin", "test-password");
  assert.equal(useAdminSession.getState().role, null);

  const reports = await api.listAdminReports();
  assert.deepEqual(reports.map((r) => r.petitionCategory), ["software", "facility", null]);
  const patch = { totalStudentCount: 100, thresholdRate: 0.1, minimumCount: 5, changeReason: "최초 설정" };
  assert.equal((await api.updateAdminThresholdSetting("software", patch)).category, "software");
  assert.equal(calls.at(-1).method, "PUT");
  assert.deepEqual(JSON.parse(calls.at(-1).body), patch);
  forbidden = true;
  await assert.rejects(() => api.updateAdminThresholdSetting("software", patch), (e) => e.status === 403 && e.body.title === "ADMIN_FORBIDDEN");
  assert.equal(useAdminSession.getState().authed, true, "권한 거부는 로그아웃 사유가 아니다");

  await api.login("test-user", "test-password");
  assert.deepEqual(await api.listWritableCategories(), ["scholarship", "facility", "software"]);
  assert.equal(calls.at(-1).headers.Authorization, "Bearer test-user-token");
  software = false;
  assert.deepEqual(await api.listWritableCategories(), ["scholarship", "facility"], "같은 토큰으로 재조회한 목록을 사용한다");
  categoriesStatus = 503;
  assert.equal(await api.listWritableCategories(), null, "조회 실패를 전체 목록으로 바꾸지 않는다");
  console.log("admin API contract check ok");
} finally {
  globalThis.fetch = originalFetch;
  await server.close();
}
