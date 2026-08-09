/* 관리자 세션. 학생 세션(stores/session.js)과 별도 스토어 — 토큰 상태 자체가 api 쪽에서 분리돼 있다. */

import { create } from "zustand";
import * as api from "../api";

export const useAdminSession = create((set) => ({
  authed: false,
  restored: false, // 새로고침 후 adminRefreshToken 쿠키로 세션 복구를 시도했는지

  restore: async () => {
    const authed = await api.restoreAdminSession();
    set({ authed, restored: true });
  },

  login: async (loginId, password) => {
    await api.adminLogin(loginId, password);
    set({ authed: true });
  },

  logout: async () => {
    await api.adminLogout();
    set({ authed: false });
  },
}));
