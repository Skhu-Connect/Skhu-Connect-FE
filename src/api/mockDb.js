/* Phase 6(백엔드 연동) 이후 남은 목 데이터. **오직 src/api/index.js 만 이 파일을 import 한다.**

   학생 화면 데이터(세션·청원·댓글·공감·북마크·알림·학부)는 이제 실 백엔드에서 온다 — 그쪽 목은
   전부 지웠다. 여기 남은 건 두 가지뿐이다.

   1. CATEGORY_META — 카테고리 라벨·공감 임계치 기준 문구·담당자. 실 백엔드에 대응 엔드포인트가
      없어서(2026-08-07 스웨거 기준) 클라이언트 상수로 유지한다. 학생 SubmitScreen 미리보기와
      관리자 Owners 화면이 같은 출처를 읽는다. `ponytail: /connect/categories 같은 엔드포인트가
      생기면 이 상수를 지우고 그걸로 교체한다.`
   2. adminDb — 관리자 콘솔 전용 데모 데이터(청원·답변·처리 로그). 관리자 답변 등록 API가 백엔드에
      없어(exec-plans/roadmap-web.md Phase 6 "범위 밖" 참고) 관리자 콘솔은 이번 라운드에서 손대지
      않고 계속 이 목으로 돈다. **학생 웹의 실제 청원과는 별개의 데이터셋이다** — 관리자가 여기서
      답변해도 학생 웹 실 청원에는 반영되지 않는다(알려진 한계, 백엔드가 답변 API를 주면 해소). */

export const CATEGORY_META = {
  scholarship: {
    label: "장학",
    threshold: 480,
    basis: "전체 학생",
    owner: { team: "학생지원팀", name: "정명희", email: "scholarship@example.com", phone: "02-0000-0000" },
  },
  facility: {
    label: "시설",
    threshold: 480,
    basis: "전체 학생",
    owner: { team: "시설관리팀", name: "박준호", email: "facility@example.com", phone: "02-0000-0000" },
  },
  dorm: {
    label: "기숙사",
    threshold: 240,
    basis: "기숙사 정원",
    owner: { team: "생활관행정실", name: "김도윤", email: "dorm@example.com", phone: "02-0000-0000" },
  },
  library: {
    label: "도서관",
    threshold: 480,
    basis: "전체 학생",
    owner: { team: "학술정보관", name: "이동수", email: "library@example.com", phone: "02-0000-0000" },
  },
  department: {
    label: "학부",
    threshold: 180,
    basis: "학과 정원",
    owner: { team: "교학팀", name: "최주하", email: "haksa@example.com", phone: "02-0000-0000" },
  },
};

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

export const adminDb = {
  petitions: [
    {
      id: 1,
      title: "중앙도서관 시험기간 24시간 개방 요청",
      excerpt: "시험기간만이라도 열람실을 24시간 운영해 주세요. 밤 12시에 문을 닫으면 자리 경쟁이 너무 심합니다.",
      category: "library",
      status: "reviewing",
      current: 512,
      createdAt: daysAgo(2),
    },
    {
      id: 2,
      title: "기숙사 세탁기 추가 설치 건의",
      excerpt: "세탁기 대수가 부족해 주말마다 1시간 이상 기다립니다. 층당 최소 2대씩 증설이 필요합니다.",
      category: "dorm",
      status: "reviewing",
      current: 243,
      createdAt: daysAgo(4),
    },
    {
      id: 3,
      title: "소프트웨어융합학부 실습실 야간 개방",
      excerpt: "팀 프로젝트 기간에 실습실을 밤 10시까지 열어 주세요. 조별 작업 공간이 부족합니다.",
      category: "department",
      status: "received",
      current: 88,
      createdAt: daysAgo(1),
    },
    {
      id: 4,
      title: "교내 장학금 신청 절차 간소화",
      excerpt: "매 학기 동일 서류를 반복 제출합니다. 종합정보시스템 연동으로 자동화해 주세요.",
      category: "scholarship",
      status: "answered",
      current: 631,
      createdAt: daysAgo(14),
    },
    {
      id: 5,
      title: "학생회관 남녀 화장실 리모델링",
      excerpt: "노후된 학생회관 화장실 위생 상태가 심각합니다. 전면 보수를 요청합니다.",
      category: "facility",
      status: "received",
      current: 154,
      createdAt: daysAgo(1),
    },
  ],

  answers: {
    4: {
      petitionId: 4,
      dept: "학생지원팀",
      manager: "정명희",
      date: "2026.05.22",
      body: "안녕하세요, 학생지원팀입니다. 교내에서 확인 가능한 성적·재학 정보는 2026학년도 2학기 신청분부터 종합정보시스템 연동으로 자동 첨부되도록 개선하였습니다. 소중한 의견 감사합니다.",
    },
  },

  notifLogs: [
    { id: 1, time: "2026.07.25 14:02", type: "threshold", petitionId: 2, msg: "공감 243/240 도달 — 생활관행정실 김도윤에게 검토 요청을 발송했습니다." },
    { id: 2, time: "2026.07.24 09:31", type: "threshold", petitionId: 1, msg: "공감 512/480 도달 — 학술정보관 이동수에게 검토 요청을 발송했습니다." },
    { id: 3, time: "2026.05.22 16:45", type: "answer", petitionId: 4, msg: "학생지원팀 공식 답변 등록 — 청원 상태가 답변 완료로 변경되었습니다." },
  ],
};
