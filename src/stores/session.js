/* 학생 웹 세션. Admin 은 목 관리자라 세션을 쓰지 않는다.
   화면 로컬 UI 상태(모달 열림, 입력 중 텍스트 …)는 여기 넣지 않는다 — useState 다. */

import { create } from "zustand";
import * as api from "../api";

export const useSession = create((set) => ({
  authed: false,
  user: null,
  prefs: null,

  login: async (sid, password) => {
    const { user, prefs } = await api.login(sid, password);
    set({ authed: true, user, prefs });
    return user;
  },

  signup: async (form) => {
    const { user, prefs } = await api.signup(form);
    set({ authed: true, user, prefs });
    return user;
  },

  logout: async () => {
    await api.logout();
    set({ authed: false, user: null, prefs: null });
  },

  savePrefs: async (patch) => {
    const prefs = await api.savePrefs(patch);
    set({ prefs });
    return prefs;
  },
}));
