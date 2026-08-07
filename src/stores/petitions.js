/* Web·Admin 공용 도메인 스토어. src/api 만 import 한다(mockDb·컴포넌트 금지).
   Admin 의 answer 액션이 Web 상세의 AdminAnswer 를 만드는 지점이 여기 하나다 (의존 B).

   여기 넣지 않는 것: 모달 열림, 입력 중 텍스트, 필터 칩·정렬 선택, 검색창 열림,
   드롭다운 열림, 토스트 문구 — 전부 화면 useState. */

import { create } from "zustand";
import * as api from "../api";

const upsert = (list, p) => (list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [...list, p]);
const flags = (list, key) => Object.fromEntries(list.filter((p) => p[key]).map((p) => [p.id, true]));
const answers = (list) => Object.fromEntries(list.filter((p) => p.answer).map((p) => [p.id, p.answer]));

export const usePetitions = create((set) => ({
  petitions: [],
  categories: [],
  owners: [],
  notifications: [],
  notifLogs: [],
  commentsById: {},
  answersById: {},
  voted: {},
  bookmarked: {},
  myComments: [],
  loading: false,

  /** 학생 웹 로드. WebLayout 이 마운트 시 한 번 부른다.
      담당자 목록·내부 알림 로그는 부르지 않는다 — 학생 화면이 쓰지 않는 관리자 데이터다. */
  loadFeed: async () => {
    set({ loading: true });
    try {
      const [petitions, categories, notifications] = await Promise.all([
        api.listPetitions(),
        api.listCategories(),
        api.listNotifications(),
      ]);
      set({
        petitions,
        categories,
        notifications,
        voted: flags(petitions, "voted"),
        bookmarked: flags(petitions, "bookmarked"),
        answersById: answers(petitions),
      });
    } finally {
      set({ loading: false });
    }
  },

  /** 관리자 콘솔 로드. AdminLayout 이 부른다 — 담당자 연락처·알림 로그는 여기서만 온다. */
  loadAdmin: async () => {
    set({ loading: true });
    try {
      const [petitions, categories, owners, notifLogs] = await Promise.all([
        api.listAdminPetitions(),
        api.listCategories(),
        api.listOwners(),
        api.listNotifLogs(),
      ]);
      set({ petitions, categories, owners, notifLogs, answersById: answers(petitions) });
    } finally {
      set({ loading: false });
    }
  },

  /** 상세 진입(딥링크 포함). 목록에 없던 청원도 채워 넣는다. */
  loadPetition: async (id) => {
    set({ loading: true });
    try {
      const p = await api.getPetition(id);
      if (!p) return null;
      const comments = await api.listComments(p.id);
      set((s) => ({
        petitions: upsert(s.petitions, p),
        commentsById: { ...s.commentsById, [p.id]: comments },
        answersById: p.answer ? { ...s.answersById, [p.id]: p.answer } : s.answersById,
        voted: { ...s.voted, [p.id]: p.voted },
        bookmarked: { ...s.bookmarked, [p.id]: p.bookmarked },
      }));
      return p;
    } finally {
      set({ loading: false });
    }
  },

  /** @returns {boolean} 공감한 상태인지 — 토스트 문구를 화면이 고른다. */
  vote: async (id) => {
    const p = await api.toggleEmpathy(id);
    set((s) => ({ petitions: upsert(s.petitions, p), voted: { ...s.voted, [p.id]: p.voted } }));
    return p.voted;
  },

  /** @returns {boolean} 북마크된 상태인지 */
  bookmark: async (id) => {
    const p = await api.toggleBookmark(id);
    set((s) => ({ petitions: upsert(s.petitions, p), bookmarked: { ...s.bookmarked, [p.id]: p.bookmarked } }));
    return p.bookmarked;
  },

  submit: async ({ category, title, body }) => {
    const p = await api.createPetition({ category, title, body });
    set((s) => ({ petitions: [p, ...s.petitions] }));
    return p;
  },

  addComment: async (petitionId, body) => {
    const c = await api.addComment(petitionId, body);
    set((s) => ({
      commentsById: { ...s.commentsById, [petitionId]: [...(s.commentsById[petitionId] ?? []), c] },
      petitions: s.petitions.map((p) => (p.id === Number(petitionId) ? { ...p, comments: p.comments + 1 } : p)),
    }));
    return c;
  },

  /** Admin 답변 등록 — 여기서 만든 레코드를 Web 상세가 answersById[id] 로 읽는다. */
  answer: async (id, body) => {
    const { petition, answer } = await api.answerPetition(id, body);
    set((s) => ({ petitions: upsert(s.petitions, petition), answersById: { ...s.answersById, [petition.id]: answer } }));
    return answer;
  },

  markAllNotifRead: async () => {
    const notifications = await api.markAllNotifRead();
    set({ notifications });
  },

  loadMyComments: async () => {
    const myComments = await api.listMyComments();
    set({ myComments });
  },
}));
