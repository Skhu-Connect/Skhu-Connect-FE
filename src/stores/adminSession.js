/* 관리자 세션. 학생 세션(stores/session.js)과 별도 스토어 — 토큰 상태 자체가 api 쪽에서 분리돼 있다.

   역할(role)은 로그인·복구 직후 GET /connect/admin/me 로 한 번 받는다. authed 를 세우기 전에 받아 두므로
   콘솔이 그려질 때 role 은 이미 정해져 있다 — null 이면 "불러오지 못함"(404·5xx·네트워크)이고 쓰기는 전부 막힌다.
   권한 규칙은 아래 두 함수에만 둔다(docs/admin-roles-backend-request.md). 화면 판정은 편의고 최종 판정은 서버다. */

import { create } from "zustand";
import * as api from "../api";

export const ROLE_LABEL = { EMERGENCY_COMMITTEE: "비상대책위원회", STUDENT_COUNCIL: "학생회" };

/** 비대위는 소프트웨어융합학부만, 학생회는 그 외 전부. 역할·카테고리를 모르면 거짓. */
export function canManage(role, category) {
  if (!category) return false;
  if (role === "EMERGENCY_COMMITTEE") return category === "software";
  if (role === "STUDENT_COUNCIL") return category !== "software";
  return false;
}

export function canManageNotices(role) {
  return role === "STUDENT_COUNCIL";
}

/** 401 이면 세션이 죽은 것(재발급까지 실패) — 로그인 화면으로 보낸다. 그 외 실패는 조회 전용으로 연다. */
async function fetchMe() {
  try {
    const me = await api.getAdminMe();
    return { authed: true, loginId: me?.loginId ?? null, role: ROLE_LABEL[me?.role] ? me.role : null };
  } catch (e) {
    return { authed: e.status !== 401, loginId: null, role: null };
  }
}

export const useAdminSession = create((set) => ({
  authed: false,
  restored: false, // 새로고침 후 adminRefreshToken 쿠키로 세션 복구를 시도했는지
  loginId: null,
  role: null,

  restore: async () => {
    const authed = await api.restoreAdminSession();
    set({ ...(authed ? await fetchMe() : { authed: false }), restored: true });
  },

  login: async (loginId, password) => {
    await api.adminLogin(loginId, password);
    set(await fetchMe());
  },

  logout: async () => {
    await api.adminLogout();
    set({ authed: false, loginId: null, role: null });
  },
}));
