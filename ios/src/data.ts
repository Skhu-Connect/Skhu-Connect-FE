/* 타입·표시용 상수. SEED/SEED_COMMENTS 는 이제 앱 런타임이 아니라 selfcheck.ts(순수 로직
   유닛 테스트)의 픽스처로만 쓴다 — 실 데이터는 src/api.ts 가 백엔드에서 받아온다. */

export type CategoryKey = "scholarship" | "facility" | "dorm" | "library" | "department";
export type StatusKey = "received" | "reviewing" | "answered";
export type BasisLabel = "전체 학생" | "학과 정원" | "기숙사 정원";

export type Petition = {
  id: number;
  title: string;
  excerpt: string;
  body: string;
  category: CategoryKey;
  status: StatusKey;
  current: number;
  threshold: number;
  basis: BasisLabel;
  author: string;
  /** 등록 시각(ISO). 표시 문구는 `logic.ts` 의 `ddayLabel` 이 만든다 — 30일 만료 기준 D-day. */
  createdAt: string;
  comments: number;
  views: string;
  /** "답변 완료" 여부는 별도 필드가 아니라 `status === "answered"` 로 판단한다. */
  mine?: boolean;
  bookmarked?: boolean;
  /** 청원 상세 GET(`/connect/petitions/{id}`)에만 온다 — 목록 응답에는 없어 상세 진입 시에만 채워진다. */
  answer?: AdminAnswer | null;
};

export type AdminAnswer = { body: string; dept: string; date: string };

export type Comment = { id?: number; author: string; body: string; date: string };

/** MY 화면 "내가 쓴 댓글" 전용 — 웹 src/api/index.js의 adaptMyComment와 동일하게 title은 없다. */
export type MyComment = { id: number; petitionId: number; body: string; date: string };

export const CAT_LABEL: Record<CategoryKey, string> = {
  scholarship: "장학",
  facility: "시설",
  dorm: "기숙사",
  library: "도서관",
  department: "학부",
};

/** 필터 칩 순서 — "전체" 를 앞에 둔다. */
export const CAT_CHIPS: { key: CategoryKey | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "scholarship", label: "장학" },
  { key: "facility", label: "시설" },
  { key: "dorm", label: "기숙사" },
  { key: "library", label: "도서관" },
  { key: "department", label: "학부" },
];

export const BASIS_NOTE: Record<BasisLabel, string> = {
  "전체 학생": "전체 재학생 4,800명의 10% 기준 · 480명",
  "학과 정원": "소프트웨어융합학부 정원 360명의 50% 기준 · 180명",
  "기숙사 정원": "기숙사 정원 800명의 30% 기준 · 240명",
};

/* 시드 등록 시각은 앱을 켠 시점 기준으로 만든다 — 고정 날짜를 박으면 시간이 지날수록 전부 만료된다. */
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const hoursAgo = (n: number) => new Date(Date.now() - n * 3600000).toISOString();

export const SEED: Petition[] = [
  {
    id: 1,
    title: "중앙도서관 시험기간 24시간 개방 요청",
    excerpt: "시험기간만이라도 열람실을 24시간 운영해 주세요. 밤 12시에 문을 닫으면 자리 경쟁이 너무 심합니다.",
    body: "시험기간만이라도 열람실을 24시간 운영해 주세요. 밤 12시에 문을 닫으면 자리 경쟁이 너무 심하고, 인근 카페로 이동하는 학생이 많습니다. 인근 대학은 이미 시행 중이며 안전 문제는 최소 인력 배치로 해결할 수 있다고 생각합니다.",
    category: "library",
    status: "reviewing",
    current: 512,
    threshold: 480,
    basis: "전체 학생",
    author: "익명",
    createdAt: daysAgo(2),
    comments: 47,
    views: "1,204",
  },
  {
    id: 2,
    title: "기숙사 세탁기 추가 설치 건의",
    excerpt: "세탁기 대수가 부족해 주말마다 1시간 이상 기다립니다. 층당 최소 2대씩 증설이 필요합니다.",
    body: "세탁기 대수가 부족해 주말마다 1시간 이상 기다립니다. 층당 최소 2대씩 증설이 필요하고, 건조기도 함께 고려해 주시면 좋겠습니다.",
    category: "dorm",
    status: "reviewing",
    current: 243,
    threshold: 240,
    basis: "기숙사 정원",
    author: "익명",
    createdAt: daysAgo(4),
    comments: 31,
    views: "742",
  },
  {
    id: 3,
    title: "소프트웨어융합학부 실습실 야간 개방",
    excerpt: "팀 프로젝트 기간에 실습실을 밤 10시까지 열어 주세요. 조별 작업 공간이 부족합니다.",
    body: "팀 프로젝트 기간에 실습실을 밤 10시까지 열어 주세요. 조별 작업 공간이 부족해 강의실을 전전하고 있습니다.",
    category: "department",
    status: "received",
    current: 88,
    threshold: 180,
    basis: "학과 정원",
    author: "익명",
    createdAt: hoursAgo(6),
    comments: 12,
    views: "318",
    mine: true,
  },
  {
    id: 4,
    title: "교내 장학금 신청 절차 간소화",
    excerpt: "매 학기 동일 서류를 반복 제출합니다. 종합정보시스템 연동으로 자동화해 주세요.",
    body: "매 학기 동일한 서류를 반복 제출합니다. 종합정보시스템에 이미 있는 정보는 자동으로 불러오도록 개선해 주세요.",
    category: "scholarship",
    status: "answered",
    current: 631,
    threshold: 480,
    basis: "전체 학생",
    author: "익명",
    createdAt: daysAgo(14),
    comments: 58,
    views: "2,391",
    mine: true,
  },
  {
    id: 5,
    title: "학생회관 화장실 리모델링 요청",
    excerpt: "노후된 학생회관 화장실 위생 상태가 심각합니다. 전면 보수를 요청합니다.",
    body: "노후된 학생회관 화장실 위생 상태가 심각합니다. 환기와 배수 문제가 반복되고 있어 전면 보수를 요청합니다.",
    category: "facility",
    status: "received",
    current: 268,
    threshold: 480,
    basis: "전체 학생",
    author: "익명",
    createdAt: daysAgo(1),
    comments: 19,
    views: "486",
  },
  {
    id: 6,
    title: "도서관 노트북 대여 대수 확대",
    excerpt: "노트북 대여가 오전 중 전부 소진됩니다. 최소 20대 추가 확보가 필요합니다.",
    body: "노트북 대여가 오전 중 전부 소진됩니다. 최소 20대 추가 확보와 대여 시간 연장을 함께 검토해 주세요.",
    category: "library",
    status: "received",
    current: 96,
    threshold: 480,
    basis: "전체 학생",
    author: "익명",
    createdAt: daysAgo(3),
    comments: 8,
    views: "271",
  },
];

export const SEED_COMMENTS: Record<number, Comment[]> = {
  1: [
    { author: "익명 1", body: "정말 필요합니다. 시험기간에 항상 자리가 없어 고생했어요.", date: "2일 전" },
    { author: "익명 2", body: "타 대학도 하는데 우리만 안 하는 게 아쉽습니다.", date: "1일 전" },
    { author: "익명 3", body: "안전 문제는 최소 인력 배치로 충분할 것 같습니다.", date: "20시간 전" },
  ],
  4: [{ author: "익명 1", body: "답변 감사합니다. 다음 학기부터 체감되면 좋겠습니다.", date: "1주 전" }],
};

/** id 는 markNotifRead 호출에 쓴다. */
export type Notification = {
  id: number;
  petitionId: number;
  title: string;
  body: string;
  date: string;
  read: boolean;
  iconBg: string;
  iconFg: string;
};

/* PREF_ROWS(알림 설정)는 서버에 대응 API가 없어(GET /connect/users/me 의 notificationEnabled 는
   읽기 전용, PATCH 없음 — 웹 src/api/index.js 와 동일한 결론) 로컬 전용 토글로 유지한다. */
export const PREF_ROWS: { key: PrefKey; title: string; desc: string }[] = [
  { key: "threshold", title: "도달률 알림", desc: "내 건의가 도달률 100%에 도달하면 알려드립니다." },
  { key: "answer", title: "답변 등록 알림", desc: "공감한 건의에 공식 답변이 등록되면 알려드립니다." },
];

export type PrefKey = "threshold" | "answer" | "empathy";
