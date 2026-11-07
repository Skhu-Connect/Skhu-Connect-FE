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
      { id: 4, petitionCategory: "OTHER" },
    ] });
    // 서버 정렬이 바뀌어도 코드로 매핑하는지 보려고 일부러 enum 순서와 다르게 준다.
    if (path === "/connect/admin/threshold-settings") return json([{ category: "SOFTWARE_CONVERGENCE" }, { category: "NEW_CATEGORY" }, { category: "OTHER" }]);
    if (path === "/connect/threshold-settings") return json([{ category: "OTHER", targetAgreementCount: 40 }]);
    const put = path.match(/^\/connect\/admin\/threshold-settings\/(\w+)$/);
    if (put) {
      if (forbidden) return json({ title: "ADMIN_FORBIDDEN" }, 403);
      return json({ category: put[1], ...JSON.parse(options.body), targetAgreementCount: 10 });
    }
    if (path === "/connect/petitions" && options.method === "POST") {
      return json({ id: 9, ...JSON.parse(options.body), status: "OPEN", agreementCount: 0, targetAgreementCount: 40, agreementDeadline: "2099-01-01T00:00:00", createdAt: "2026-11-08T00:00:00" });
    }
    if (path === "/connect/auth/login") return json({ accessToken: "test-user-token" });
    if (path === "/connect/users/me") return json({ id: 2, loginId: "test-user", departmentName: "소프트웨어융합학부" });
    if (path === "/connect/petitions/categories") {
      if (categoriesStatus !== 200) return json({ title: "Unavailable" }, categoriesStatus);
      // 옛 값(DEPARTMENT)이 섞여 와도 작성 선택지가 되지 않아야 한다.
      return json(["SCHOLARSHIP", "FACILITY", "OTHER", "DEPARTMENT", ...(software ? ["SOFTWARE_CONVERGENCE"] : [])]);
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
  assert.deepEqual(reports.map((r) => r.petitionCategory), ["software", "facility", null, "other"]);
  assert.deepEqual((await api.listAdminThresholdSettings()).map((s) => s.category), ["software", "other"], "모르는 행은 기타로 뭉개지 않고 버린다");
  await assert.rejects(() => api.updateAdminThresholdSetting(undefined, { changeReason: "x" }), { message: "알 수 없는 카테고리입니다." });
  const patch = { totalStudentCount: 100, thresholdRate: 0.1, minimumCount: 5, changeReason: "최초 설정" };
  assert.equal((await api.updateAdminThresholdSetting("software", patch)).category, "software");
  assert.equal(calls.at(-1).method, "PUT");
  assert.deepEqual(JSON.parse(calls.at(-1).body), patch);
  assert.equal((await api.updateAdminThresholdSetting("other", patch)).category, "other");
  assert.equal(calls.at(-1).path, "/connect/admin/threshold-settings/OTHER");
  forbidden = true;
  await assert.rejects(() => api.updateAdminThresholdSetting("software", patch), (e) => e.status === 403 && e.body.title === "ADMIN_FORBIDDEN");
  assert.equal(useAdminSession.getState().authed, true, "권한 거부는 로그아웃 사유가 아니다");

  await api.login("test-user", "test-password");
  assert.deepEqual(await api.listWritableCategories(), ["scholarship", "facility", "other", "software"]);
  assert.equal(calls.at(-1).headers.Authorization, "Bearer test-user-token");
  software = false;
  assert.deepEqual(await api.listWritableCategories(), ["scholarship", "facility", "other"], "같은 토큰으로 재조회한 목록을 사용한다");
  categoriesStatus = 503;
  assert.equal(await api.listWritableCategories(), null, "조회 실패를 전체 목록으로 바꾸지 않는다");

  const created = await api.createPetition({ category: "other", title: "제목", body: "본문" });
  assert.equal(JSON.parse(calls.at(-1).body).category, "OTHER");
  assert.deepEqual([created.category, created.basis], ["other", "전체 학생"]);
  const cats = await api.listCategories();
  assert.deepEqual(cats.map((c) => c.label), ["장학", "시설", "기숙사", "도서관", "기타", "소프트웨어융합학부"]);
  assert.equal(cats.find((c) => c.key === "other").threshold, 40, "공개 임계치의 OTHER 행이 기타에 붙는다");
  console.log("admin API contract check ok");
} finally {
  globalThis.fetch = originalFetch;
  await server.close();
}
