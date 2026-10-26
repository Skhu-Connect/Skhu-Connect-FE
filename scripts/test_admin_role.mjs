import assert from "node:assert/strict";
import { createServer } from "vite";

/* 관리자 역할 판정(canManage·canManageNotices)과 403 ADMIN_FORBIDDEN 문구.
   api/index.js 가 import.meta.env 를 읽어 node 로 직접 못 불러온다 — vite SSR 로 불러온다.
   실행: node scripts/test_admin_role.mjs (네트워크 요청 없음, fetch 를 가짜로 바꾼다) */
const server = await createServer({ server: { middlewareMode: true }, logLevel: "error" });
try {
  const { canManage, canManageNotices } = await server.ssrLoadModule("/src/stores/adminSession.js");
  const api = await server.ssrLoadModule("/src/api/index.js");

  for (const cat of ["scholarship", "facility", "dorm", "library", "department"]) {
    assert.equal(canManage("EMERGENCY_COMMITTEE", cat), false, cat);
    assert.equal(canManage("STUDENT_COUNCIL", cat), true, cat);
  }
  assert.equal(canManage("EMERGENCY_COMMITTEE", "software"), true);
  assert.equal(canManage("STUDENT_COUNCIL", "software"), false);
  for (const role of [null, undefined, "UNKNOWN"]) assert.equal(canManage(role, "software") || canManage(role, "facility"), false);
  assert.equal(canManage("STUDENT_COUNCIL", null), false, "카테고리 모름(옛 신고 응답)");
  assert.equal(canManageNotices("STUDENT_COUNCIL"), true);
  assert.equal(canManageNotices("EMERGENCY_COMMITTEE"), false);
  assert.equal(canManageNotices(null), false);

  globalThis.fetch = async () => ({ ok: false, status: 403, json: async () => ({ title: "ADMIN_FORBIDDEN", status: 403 }) });
  await assert.rejects(() => api.restoreAdminPetition(1), { message: "이 카테고리를 처리할 권한이 없습니다." });

  console.log("admin role check ok");
} finally {
  await server.close();
}
