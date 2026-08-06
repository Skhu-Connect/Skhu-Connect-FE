/* 목 데이터 — 디자인 원본 스크립트의 SEED·NOTIFS·ANSWER 를 그대로 옮겼다.
   백엔드가 붙으면 이 파일만 fetch 로 바꾼다. */

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
  date: string;
  comments: number;
  views: string;
  answered?: boolean;
  mine?: boolean;
};

export type Comment = { author: string; body: string; date: string };

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

export const STATUS_CHIPS: { key: StatusKey | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "received", label: "접수" },
  { key: "reviewing", label: "검토중" },
  { key: "answered", label: "답변 완료" },
];

/** 로그인 화면의 학부/전공 선택지. 학교 포털의 전공 목록을 그대로 옮겼다. */
export const MAJORS: string[] = [
  "경영학부",
  "미디어콘텐츠융합학부(미디어콘텐츠융합자율학부)",
  "미래융합학부",
  "사회융합학부(사회융합자율학부)",
  "소프트웨어융합학부(IT융합자율학부)",
  "인문융합콘텐츠학부(인문융합자율학부)",
];

export const BASIS_NOTE: Record<BasisLabel, string> = {
  "전체 학생": "전체 재학생 4,800명의 10% 기준 · 480명",
  "학과 정원": "소프트웨어융합학부 정원 360명의 50% 기준 · 180명",
  "기숙사 정원": "기숙사 정원 800명의 30% 기준 · 240명",
};

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
    date: "2일 전",
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
    date: "4일 전",
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
    date: "6시간 전",
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
    date: "2주 전",
    comments: 58,
    views: "2,391",
    answered: true,
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
    date: "1일 전",
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
    date: "3일 전",
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

export const ANSWER = {
  dept: "학생지원팀",
  manager: "이동수",
  date: "2026.05.22",
  body: "안녕하세요, 학생지원팀입니다. 2026학년도 2학기부터 교내 장학금 신청 시 종합정보시스템에 등록된 서류는 자동 연동되도록 개선하겠습니다. 소중한 의견 감사합니다.",
};

export type Notification = {
  petitionId: number;
  title: string;
  body: string;
  date: string;
  read: boolean;
  iconBg: string;
  iconFg: string;
};

export const NOTIFS: Notification[] = [
  {
    petitionId: 4,
    title: "공식 답변 등록",
    body: "‘교내 장학금 신청 절차 간소화’에 학생지원팀 답변이 등록되었습니다.",
    date: "3시간 전",
    read: false,
    iconBg: "#DDF3E7",
    iconFg: "#22A06B",
  },
  {
    petitionId: 1,
    title: "도달률 달성",
    body: "‘중앙도서관 24시간 개방’이 도달률 100%를 달성해 검토가 시작되었습니다.",
    date: "1일 전",
    read: false,
    iconBg: "#FCEFD6",
    iconFg: "#B26A00",
  },
  {
    petitionId: 3,
    title: "도달률 달성",
    body: "'중앙도서관 24시간 개방’이 도달률 50%를 넘었습니다.",
    date: "2일 전",
    read: true,
    iconBg: "#FCE7E9",
    iconFg: "#F0808A",
  },
];

export const USER = { name: "김석환", initial: "석환", dept: "소프트웨어융합학부", year: 3, sid: "202214139" };

export const PREF_ROWS: { key: PrefKey; title: string; desc: string }[] = [
  { key: "threshold", title: "도달률 알림", desc: "내 건의가 도달률 100%에 도달하면 알려드립니다." },
  { key: "answer", title: "답변 등록 알림", desc: "공감한 건의에 공식 답변이 등록되면 알려드립니다." },
];

export type PrefKey = "threshold" | "answer" | "empathy";
