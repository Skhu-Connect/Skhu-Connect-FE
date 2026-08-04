/* 가변 목데이터. **오직 src/api/index.js 만 이 파일을 import 한다.**
   백엔드 연동 시 index.js 를 fetch 로 다시 쓰고 이 파일을 지우면 끝난다.

   시드 출처
   - design-handoff/project/app/data-v4.js (user / categories / petitions / notifications / comments)
   - design-handoff/project/app/admin-app-v4.jsx 61행 OWNERS, 177–183행 OWNER_DETAILS,
     282–287행 NOTI_LOGS

   스키마 결정
   - categories[]: threshold / basis / owner 를 여기에만 둔다. Web Submit 미리보기와
     Admin 담당자 화면이 같은 출처를 읽는다 (ROADMAP 의존 C). 청원 레코드에는
     threshold·basis 를 두지 않는다 — 카테고리에서 파생한다.
   - answers: 전역 단일 객체가 아니라 petitionId 키로 정규화한다 (ROADMAP 의존 B).
   - comments: petitionId 키. */

/* 소속 학부 11개. 교육과정이 두 벌이고 재학생이 양쪽에 걸쳐 있어 전부 들어간다(이슈 #16 결정, 교무처 교무팀 페이지 출처).
   회원가입·마이페이지가 이 목록을 같이 쓴다 — src/api/index.js listDepartments() 로만 노출한다. */
export const DEPARTMENTS = [
  "인문융합콘텐츠학부",
  "경영학부",
  "사회융합학부",
  "미디어콘텐츠융합학부",
  "미래융합학부",
  "소프트웨어융합학부",
  "국제학부",
  "인문융합자율학부",
  "사회융합자율학부",
  "미디어콘텐츠융합자율학부",
  "IT융합자율학부",
];

export const db = {
  session: null, // login 이 user 를 넣는다

  // 가상 학생. 실제 학번·실명을 목데이터에 두지 않는다 — 번들에 박혀 공개 배포로 새 나간다.
  user: { name: "김한울", dept: "소프트웨어융합학부", year: 3, sid: "20260000" },

  prefs: { threshold: true, answer: true, empathy: false },

  /* 담당자 5명은 **전부 가상 인물**이고 연락처도 자리표시자다. 원본 프로토타입에는 실제
     대표번호(02-2610-4114)와 실도메인이 들어 있었는데, 가상 실명과 실제 기관 연락처를
     나란히 두면 레포를 본 사람이 실제 인적사항으로 읽고 그 번호로 전화한다.
     실제 부서 연락처로 교체할 때는 여기만 고치면 된다. */
  categories: [
    {
      key: "scholarship",
      label: "장학",
      threshold: 480,
      basis: "전체 학생",
      owner: { team: "학생지원팀", name: "정명희", email: "scholarship@example.com", phone: "02-0000-0000" },
    },
    {
      key: "facility",
      label: "시설",
      threshold: 480,
      basis: "전체 학생",
      owner: { team: "시설관리팀", name: "박준호", email: "facility@example.com", phone: "02-0000-0000" },
    },
    {
      key: "dorm",
      label: "기숙사",
      threshold: 240,
      basis: "기숙사 정원",
      owner: { team: "생활관행정실", name: "김도윤", email: "dorm@example.com", phone: "02-0000-0000" },
    },
    {
      key: "library",
      label: "도서관",
      threshold: 480,
      basis: "전체 학생",
      owner: { team: "학술정보관", name: "이동수", email: "library@example.com", phone: "02-0000-0000" },
    },
    {
      key: "department",
      label: "학부",
      threshold: 180,
      basis: "학과 정원",
      owner: { team: "교학팀", name: "최주하", email: "haksa@example.com", phone: "02-0000-0000" },
    },
  ],

  petitions: [
    {
      id: 1,
      title: "중앙도서관 시험기간 24시간 개방 요청",
      excerpt: "시험기간만이라도 열람실을 24시간 운영해 주세요. 밤 12시에 문을 닫으면 자리 경쟁이 너무 심합니다. 인근 대학은 이미 시행 중입니다.",
      body: "시험기간만이라도 열람실을 24시간 운영해 주세요. 밤 12시에 문을 닫으면 자리 경쟁이 너무 심합니다. 인근 대학은 이미 시행 중입니다.\n\n특히 시험 2주 전부터는 오후 9시만 되어도 3·4층 열람실에 빈자리가 없습니다. 폐관 후에는 24시간 카페로 이동하는 학생이 많은데, 비용 부담과 안전 문제가 함께 따라옵니다. 전 기간이 어렵다면 시험기간 2주만이라도 시범 운영해 주시기 바랍니다.",
      category: "library",
      status: "reviewing",
      current: 512,
      author: "익명",
      date: "2일 전",
      views: 1204,
    },
    {
      id: 2,
      title: "기숙사 세탁기 추가 설치 건의",
      excerpt: "세탁기 대수가 부족해 주말마다 1시간 이상 기다립니다. 층당 최소 2대씩 증설이 필요합니다.",
      body: "세탁기 대수가 부족해 주말마다 1시간 이상 기다립니다. 층당 최소 2대씩 증설이 필요합니다.\n\n현재 한 층에 세탁기 2대·건조기 1대가 배치되어 있습니다. 주말 오후에는 대기 인원이 열 명을 넘어 세탁을 포기하는 경우가 많습니다. 예산 문제로 즉시 증설이 어렵다면 예약제 운영이라도 먼저 도입해 주시기 바랍니다.",
      category: "dorm",
      status: "reviewing",
      current: 243,
      author: "익명",
      date: "4일 전",
      views: 862,
    },
    {
      id: 3,
      title: "소프트웨어융합학부 실습실 야간 개방",
      excerpt: "팀 프로젝트 기간에 실습실을 밤 10시까지 열어 주세요. 조별 작업 공간이 부족합니다.",
      body: "팀 프로젝트 기간에 실습실을 밤 10시까지 열어 주세요. 조별 작업 공간이 부족합니다.\n\n학기말 프로젝트 기간에는 조별로 모여 개발할 공간이 필요한데, 실습실은 오후 6시에 문을 닫습니다. 고사양 장비가 필요한 과목이 많아 개인 노트북으로는 대체가 어렵습니다. 조교 근로 배치가 가능한 기간만이라도 연장 운영을 검토해 주시기 바랍니다.",
      category: "department",
      status: "received",
      current: 88,
      author: "익명",
      date: "6시간 전",
      views: 341,
      mine: true,
    },
    {
      id: 4,
      title: "교내 장학금 신청 절차 간소화",
      excerpt: "매 학기 동일 서류를 반복 제출합니다. 종합정보시스템 연동으로 자동화해 주세요.",
      body: "매 학기 동일 서류를 반복 제출합니다. 종합정보시스템 연동으로 자동화해 주세요.\n\n성적증명서·재학증명서처럼 학교가 이미 보유한 정보를 매 학기 다시 발급받아 제출하고 있습니다. 발급 비용과 대기 시간도 부담이지만, 마감 직전 창구가 혼잡해 신청을 놓치는 학생도 있습니다. 교내에서 확인 가능한 서류는 시스템 연동으로 자동 첨부되도록 개선해 주시기 바랍니다.",
      category: "scholarship",
      status: "answered",
      current: 631,
      author: "익명",
      date: "2주 전",
      views: 2417,
      mine: true,
    },
    {
      id: 5,
      title: "학생회관 남녀 화장실 리모델링",
      excerpt: "노후된 학생회관 화장실 위생 상태가 심각합니다. 전면 보수를 요청합니다.",
      body: "노후된 학생회관 화장실 위생 상태가 심각합니다. 전면 보수를 요청합니다.\n\n배수가 자주 막히고 환기가 되지 않아 냄새가 복도까지 퍼집니다. 세면대 온수도 나오지 않는 곳이 있습니다. 전면 보수가 어렵다면 우선 배수·환기 설비만이라도 이번 방학 중에 점검해 주시기 바랍니다.",
      category: "facility",
      status: "received",
      current: 154,
      author: "익명",
      date: "1일 전",
      views: 508,
    },
    {
      id: 6,
      title: "도서관 노트북 대여 대수 확대",
      excerpt: "노트북 대여가 오전 중 전부 소진됩니다. 최소 20대 추가 확보가 필요합니다.",
      body: "노트북 대여가 오전 중 전부 소진됩니다. 최소 20대 추가 확보가 필요합니다.\n\n대여 가능 대수가 30대인데 오전 10시면 모두 나갑니다. 과제·발표 준비로 수요가 몰리는 학기 중반에는 예약조차 어렵습니다. 노후 장비 교체와 함께 대여 대수를 확대해 주시기 바랍니다.",
      category: "library",
      status: "received",
      current: 96,
      author: "익명",
      date: "3일 전",
      views: 297,
    },
  ],

  /* petitionId → 답변 레코드 (의존 B). 시드 답변은 청원 4(장학)의 담당 부서인
     학생지원팀 명의다 — 원본 data-v4.js 의 전역 adminAnswer 는 학술정보관 문구였으나
     그것은 청원 1 용 본문이 전역에 하나만 있던 프로토타입의 한계다. */
  answers: {
    4: {
      petitionId: 4,
      dept: "학생지원팀",
      manager: "정명희",
      date: "2026.05.22",
      body: "안녕하세요, 학생지원팀입니다. 교내에서 확인 가능한 성적·재학 정보는 2026학년도 2학기 신청분부터 종합정보시스템 연동으로 자동 첨부되도록 개선하였습니다. 소득분위 증빙 등 외부 기관 발급 서류는 기존 절차가 유지됩니다. 세부 안내는 장학 공지사항으로 게시하겠습니다. 소중한 의견 감사합니다.",
    },
  },

  /* petitionId → 댓글 목록 */
  comments: {
    1: [
      { id: 1, author: "익명 1", body: "정말 필요합니다. 시험기간에 항상 자리 없어서 고생했어요.", date: "2일 전", votes: 24 },
      { id: 2, author: "익명 2", body: "타 대학도 다 하는데 우리만 안 하는 게 이상해요.", date: "1일 전", votes: 12 },
      { id: 3, author: "익명 3", body: "안전 문제로 최소 인력만 배치해도 충분할 것 같습니다.", date: "20시간 전", votes: 7 },
    ],
    2: [
      { id: 1, author: "익명 1", body: "주말 오후엔 대기 인원이 정말 많습니다. 예약제라도 먼저 도입해 주세요.", date: "3일 전", votes: 18 },
      { id: 2, author: "익명 2", body: "건조기도 한 대뿐이라 세탁 후에 또 기다립니다.", date: "2일 전", votes: 9 },
      { id: 3, author: "익명 3", body: "층마다 대수가 달라서 특정 층만 몰리는 문제도 있어요.", date: "1일 전", votes: 4 },
    ],
    3: [
      { id: 1, author: "익명 1", body: "팀플 기간엔 실습실만큼 작업하기 좋은 공간이 없습니다.", date: "5시간 전", votes: 7 },
      { id: 2, author: "익명 2", body: "야간 개방하면 장비 관리 인력이 필요할 텐데 조교 근로로 충분할 것 같아요.", date: "3시간 전", votes: 3 },
    ],
    4: [
      { id: 1, author: "익명 1", body: "매번 같은 서류를 다시 내는 게 제일 번거로웠습니다.", date: "2주 전", votes: 31 },
      { id: 2, author: "익명 2", body: "종합정보시스템에 이미 있는 정보인데 왜 다시 제출해야 하는지 의문이었어요.", date: "2주 전", votes: 22 },
      { id: 3, author: "익명 3", body: "답변대로 자동 첨부가 되면 정말 편해질 것 같습니다.", date: "1주 전", votes: 14 },
    ],
    5: [
      { id: 1, author: "익명 1", body: "학생회관 화장실은 환기가 안 돼서 냄새가 심합니다.", date: "1일 전", votes: 12 },
      { id: 2, author: "익명 2", body: "칸 문 잠금장치가 고장난 곳도 여러 군데 있어요.", date: "20시간 전", votes: 6 },
    ],
    6: [
      { id: 1, author: "익명 1", body: "오전 10시면 이미 대여 가능 노트북이 없습니다.", date: "3일 전", votes: 5 },
    ],
  },

  notifications: [
    { id: 1, type: "answer", petitionId: 4, title: "공식 답변 등록", body: "‘교내 장학금 신청 절차 간소화’에 학생지원팀의 답변이 등록되었습니다.", date: "3시간 전", read: false },
    { id: 2, type: "threshold", petitionId: 1, title: "임계치 도달", body: "‘중앙도서관 시험기간 24시간 개방 요청’이 임계치를 넘어 검토가 시작되었습니다.", date: "1일 전", read: false },
    { id: 3, type: "empathy", petitionId: 3, title: "공감 알림", body: "내 청원 ‘소프트웨어융합학부 실습실 야간 개방’이 공감 50개를 넘었습니다.", date: "2일 전", read: true },
  ],

  notifLogs: [
    { id: 1, time: "2026.07.25 14:02", type: "threshold", petitionId: 2, msg: "공감 243/240 도달 — 생활관행정실 김도윤에게 검토 요청을 발송했습니다." },
    { id: 2, time: "2026.07.24 09:31", type: "threshold", petitionId: 1, msg: "공감 512/480 도달 — 학술정보관 이동수에게 검토 요청을 발송했습니다." },
    { id: 3, time: "2026.05.22 16:45", type: "answer", petitionId: 4, msg: "학생지원팀 공식 답변 등록 — 청원 상태가 답변 완료로 변경되었습니다." },
    { id: 4, time: "2026.05.20 11:12", type: "reminder", petitionId: 4, msg: "검토 기한 임박 — 학생지원팀 정명희에게 리마인더를 발송했습니다." },
  ],

  voted: new Set(),
  bookmarked: new Set(),
};
