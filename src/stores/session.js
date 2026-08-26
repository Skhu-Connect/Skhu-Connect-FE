/* 학생 웹 세션. Admin 은 목 관리자라 세션을 쓰지 않는다.
   화면 로컬 UI 상태(모달 열림, 입력 중 텍스트 …)는 여기 넣지 않는다 — useState 다. */

import { create } from "zustand";
import * as api from "../api";

export const useSession = create((set) => ({
  authed: false,
  user: null,
  restored: false, // 새로고침 후 refreshToken 쿠키로 세션 복구를 시도했는지

  restore: async () => {
    const session = await api.restoreSession();
    set(session ? { authed: true, user: session.user, restored: true } : { restored: true });
  },

  login: async (sid, password) => {
    const { user } = await api.login(sid, password);
    set({ authed: true, user });
    return user;
  },

  signup: async (form) => {
    const { user } = await api.signup(form);
    set({ authed: true, user });
    return user;
  },

  logout: async () => {
    await api.logout();
    set({ authed: false, user: null });
  },

  deleteAccount: async (password) => {
    await api.deleteAccount(password);
    set({ authed: false, user: null });
  },

  /** 토글 하나만 보내고 서버가 돌려준 5개 전체로 덮는다(계약: 갱신 후 전체 반환). */
  updateNotificationSettings: async (patch) => {
    const notificationSettings = await api.updateNotificationSettings(patch);
    set((s) => ({ user: { ...s.user, notificationSettings } }));
    return notificationSettings;
  },

  updateDepartment: async (departmentId, departmentName) => {
    const user = await api.updateDepartment(departmentId, departmentName);
    set({ user });
    return user;
  },
}));
