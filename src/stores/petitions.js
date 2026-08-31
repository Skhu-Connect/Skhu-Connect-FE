/* Web·Admin 공용 도메인 스토어. src/api 만 import 한다(mockDb·컴포넌트 금지).
   Admin 의 answer 액션이 Web 상세의 AdminAnswer 를 만드는 지점이 여기 하나다 (의존 B).

   여기 넣지 않는 것: 모달 열림, 입력 중 텍스트, 필터 칩·정렬 선택, 검색창 열림,
   드롭다운 열림, 토스트 문구 — 전부 화면 useState. */

import { create } from "zustand";
import * as api from "../api";

const upsert = (list, p) => (list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [...list, p]);
const flags = (list, key) => Object.fromEntries(list.filter((p) => p[key]).map((p) => [p.id, true]));
const answers = (list) => Object.fromEntries(list.filter((p) => p.answer).map((p) => [p.id, p.answer]));

/* 댓글 트리는 root + root.replies 딱 1단계다(서버가 대댓글의 대댓글을 지원 안 함) — id 로 찾기/패치/삭제 공용 */
const findComment = (list, id) => list.flatMap((c) => [c, ...(c.replies ?? [])]).find((x) => x.id === id);
const patchComment = (list, id, patch) =>
  list.map((root) => (root.id === id ? { ...root, ...patch } : { ...root, replies: (root.replies ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
const removeComment = (list, id) =>
  list.some((c) => c.id === id) ? list.filter((c) => c.id !== id) : list.map((root) => ({ ...root, replies: (root.replies ?? []).filter((r) => r.id !== id) }));

export const usePetitions = create((set, get) => ({
  petitions: [],
  categories: [],
  notifications: [],
  notifLogs: [],
  reports: [],
  commentsById: {},
  answersById: {},
  voted: {},
  bookmarked: {},
  myComments: [],
  // 마이페이지 통계용 — petitions 배열(최근 100건)을 세지 않고 서버가 센 전체 개수를 그대로 쓴다.
  myTotals: { mine: 0, voted: 0, bookmarked: 0, answered: 0 },
  loading: false,

  /** 학생 웹 로드. WebLayout 이 마운트 시 한 번 부른다.
      내부 알림 로그는 부르지 않는다 — 학생 화면이 쓰지 않는 관리자 데이터다. */
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
        myTotals: api.getMyTotals(),
      });
    } finally {
      set({ loading: false });
    }
  },

  /** 관리자 콘솔 로드. AdminLayout 이 부른다 — 알림 로그는 여기서만 온다. */
  loadAdmin: async () => {
    set({ loading: true });
    try {
      const [petitions, categories, notifLogs, reports] = await Promise.all([
        api.listAdminPetitions(),
        api.listCategories(),
        api.listNotifLogs(),
        api.listAdminReports(),
      ]);
      set({ petitions, categories, notifLogs, reports, answersById: answers(petitions) });
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

  /** @returns {boolean} 공감한 상태인지 — 토스트 문구를 화면이 고른다.
      취소(DELETE)는 서버가 갱신된 agreementCount 를 안 준다(204 no body) — 토글 직후 잇달아 부르는
      getPetition 이 아직 반영 전 값을 주면 "취소했는데 숫자가 그대로" 로 보인다. 방금 누른 방향만큼은
      낙관적으로 반영하고, 서버 값이 그보다 더 진행돼 있으면(동시에 다른 사람이 공감/취소) 그 값을 따른다. */
  vote: async (id) => {
    const before = get().petitions.find((x) => x.id === id)?.current;
    const p = await api.toggleEmpathy(id);
    const current = before == null ? p.current : p.voted ? Math.max(p.current, before + 1) : Math.min(p.current, before - 1);
    set((s) => ({ petitions: upsert(s.petitions, { ...p, current }), voted: { ...s.voted, [p.id]: p.voted }, myTotals: api.getMyTotals() }));
    return p.voted;
  },

  /** @returns {boolean} 북마크된 상태인지 */
  bookmark: async (id) => {
    const p = await api.toggleBookmark(id);
    set((s) => ({ petitions: upsert(s.petitions, p), bookmarked: { ...s.bookmarked, [p.id]: p.bookmarked }, myTotals: api.getMyTotals() }));
    return p.bookmarked;
  },

  submit: async ({ category, title, body }) => {
    const p = await api.createPetition({ category, title, body });
    set((s) => ({ petitions: [p, ...s.petitions], myTotals: api.getMyTotals() }));
    return p;
  },

  /** 작성자 영구 차단. 성공하면 이 청원을 스토어에서 바로 지운다 — 서버는 이후 재조회부터
      이 작성자의 글을 걸러주지만(청원 목록/상세 auth 필터), 지금 화면에도 즉시 반영해야 한다. */
  blockPetitionAuthor: async (id) => {
    await api.blockPetitionAuthor(id);
    set((s) => ({ petitions: s.petitions.filter((p) => p.id !== id) }));
    /* 차단은 작성자 단위라 그 사람이 쓴 다른 글도 사라져야 한다. 청원 응답에 작성자 정보가 없어
       로컬에서는 형제 글을 못 고른다 — 서버가 걸러준 목록으로 갈아끼운다. 위에서 누른 글은 이미
       지웠으므로 이건 뒤늦게 정리돼도 된다(실패해도 다음 로드에서 맞춰진다). */
    try {
      set({ petitions: await api.listPetitions() });
    } catch {
      /* 목록 갱신 실패는 차단 자체를 되돌릴 이유가 아니다 */
    }
  },

  /** 댓글 작성자 영구 차단. 청원 차단과 같은 API 다(targetType 만 다르다) — 서버가 청원·댓글 조회
      양쪽에서 이 작성자를 걸러주므로 둘 다 다시 불러 정리한다. */
  blockCommentAuthor: async (petitionId, commentId) => {
    await api.blockCommentAuthor(commentId);
    try {
      const [comments, petitions] = await Promise.all([api.listComments(petitionId), api.listPetitions()]);
      set((s) => ({ commentsById: { ...s.commentsById, [petitionId]: comments }, petitions }));
    } catch {
      /* 차단은 이미 성공했다 — 갱신 실패는 되돌릴 이유가 아니고 다음 로드에서 맞춰진다 */
    }
  },

  reportPetition: (id, reasonType, reasonDetail) => api.reportPetition(id, reasonType, reasonDetail),

  reportComment: (id, reasonType, reasonDetail) => api.reportComment(id, reasonType, reasonDetail),

  /** parentCommentId 를 주면 그 root 댓글 아래 대댓글로 붙인다. */
  addComment: async (petitionId, body, parentCommentId = null) => {
    const c = await api.addComment(petitionId, body, parentCommentId);
    set((s) => {
      const list = s.commentsById[petitionId] ?? [];
      const nextList = parentCommentId
        ? list.map((root) => (root.id === parentCommentId ? { ...root, replies: [...(root.replies ?? []), c] } : root))
        : [...list, c];
      return {
        commentsById: { ...s.commentsById, [petitionId]: nextList },
        petitions: s.petitions.map((p) => (p.id === Number(petitionId) ? { ...p, comments: p.comments + 1 } : p)),
      };
    });
    return c;
  },

  /** Admin 공식 답변 조회 — AnswerModal 이 기존 답변 수정 진입 시 프리필에 쓴다. */
  getAnswer: (petitionId) => api.getAdminAnswer(petitionId),

  /** Admin 답변 등록/수정. isEdit 이면 PUT(기존 답변 갱신), 아니면 POST(신규 등록 + 상태가
      답변완료로 바뀐다). 답변 엔드포인트는 청원 객체를 돌려주지 않아 로컬에서 상태만 패치한다. */
  submitAnswer: async (id, content, answerSource, isEdit) => {
    const answer = isEdit
      ? await api.updateAdminAnswer(id, content, answerSource)
      : await api.createAdminAnswer(id, content, answerSource);
    set((s) => ({
      petitions: s.petitions.map((p) => (p.id === Number(id) ? { ...p, status: "answered", answered: true } : p)),
      answersById: { ...s.answersById, [Number(id)]: answer },
    }));
    return answer;
  },

  /** Admin 청원 숨김/복원. 목록·상세를 다시 부르지 않고 hidden 상태만 로컬 패치한다. */
  hidePetition: async (id, reason) => {
    const { hidden, hiddenReason } = await api.hideAdminPetition(id, reason);
    set((s) => ({ petitions: s.petitions.map((p) => (p.id === Number(id) ? { ...p, hidden, hiddenReason } : p)) }));
  },

  restorePetition: async (id) => {
    const { hidden, hiddenReason } = await api.restoreAdminPetition(id);
    set((s) => ({ petitions: s.petitions.map((p) => (p.id === Number(id) ? { ...p, hidden, hiddenReason } : p)) }));
  },

  processReport: async (id, status, reason, actionType) => {
    const report = await api.processAdminReport(id, status, reason, actionType);
    set((s) => ({ reports: s.reports.map((r) => (r.id === report.id ? report : r)) }));
  },

  markAllNotifRead: async () => {
    const notifications = await api.markAllNotifRead();
    set({ notifications });
  },

  markNotifRead: async (id) => {
    await api.markNotifRead(id);
    set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
  },

  toggleCommentLike: async (petitionId, commentId) => {
    const c = findComment(get().commentsById[petitionId] ?? [], commentId);
    const { votes, liked } = await api.toggleCommentLike(petitionId, commentId, !!c?.liked);
    set((s) => ({ commentsById: { ...s.commentsById, [petitionId]: patchComment(s.commentsById[petitionId] ?? [], commentId, { votes, liked }) } }));
  },

  updateComment: async (petitionId, commentId, body) => {
    const c = await api.updateComment(petitionId, commentId, body);
    set((s) => ({ commentsById: { ...s.commentsById, [petitionId]: patchComment(s.commentsById[petitionId] ?? [], commentId, { body: c.body }) } }));
  },

  deleteComment: async (petitionId, commentId) => {
    await api.deleteComment(petitionId, commentId);
    set((s) => ({
      commentsById: { ...s.commentsById, [petitionId]: removeComment(s.commentsById[petitionId] ?? [], commentId) },
      petitions: s.petitions.map((p) => (p.id === Number(petitionId) ? { ...p, comments: Math.max(0, p.comments - 1) } : p)),
    }));
  },

  /** 내 청원 삭제. 목록·댓글 캐시와 플래그에서도 지운다 — 남겨두면 피드에 계속 보이고
      눌러 들어가면 404 가 뜬다. */
  removePetition: async (id) => {
    const pid = Number(id);
    await api.deletePetition(pid);
    set((s) => {
      const { [pid]: _comments, ...commentsById } = s.commentsById;
      const { [pid]: _voted, ...voted } = s.voted;
      const { [pid]: _bookmarked, ...bookmarked } = s.bookmarked;
      return {
        petitions: s.petitions.filter((p) => p.id !== pid),
        commentsById,
        voted,
        bookmarked,
        myTotals: api.getMyTotals(),
      };
    });
  },

  loadMyComments: async () => {
    const myComments = await api.listMyComments();
    set({ myComments });
  },

  /** WebLayout 이 로그인 중 주기적으로 부른다 — 알림은 loadFeed 때 한 번만 오면 이후로 절대 안 갱신됐다. */
  refreshNotifications: async () => {
    try {
      const notifications = await api.listNotifications();
      set({ notifications });
    } catch {
      /* 폴링 실패는 조용히 넘어간다 — 다음 주기에 재시도 */
    }
  },
}));
