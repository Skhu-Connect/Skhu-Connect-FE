/* 남은 목 데이터. **오직 src/api/index.js 만 이 파일을 import 한다.**

   학생 화면 데이터(세션·청원·댓글·공감·북마크·알림·학부)와 관리자 콘솔(로그인·청원 목록·공식
   답변·숨김복원·임계치 설정)은 이제 전부 실 백엔드에서 온다. 여기 남은 건 두 가지뿐이다.

   1. CATEGORY_META — 카테고리 라벨·담당자 연락처는 대응 엔드포인트가 없어 클라이언트 상수로
      유지한다. threshold 필드는 초기값일 뿐이고, api/index.js 의 ensureCategoryThresholds() 가
      공개 GET /connect/threshold-settings 로 받은 실제 값으로 세션당 1회 덮어쓴다.
   2. adminDb.notifLogs — 관리자 알림 로그. 대응 엔드포인트가 없어 계속 이 목으로 돈다. */

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

export const adminDb = {
  notifLogs: [
    { id: 1, time: "2026.07.25 14:02", type: "threshold", petitionId: 2, msg: "공감 243/240 도달 — 생활관행정실 김도윤에게 검토 요청을 발송했습니다." },
    { id: 2, time: "2026.07.24 09:31", type: "threshold", petitionId: 1, msg: "공감 512/480 도달 — 학술정보관 이동수에게 검토 요청을 발송했습니다." },
    { id: 3, time: "2026.05.22 16:45", type: "answer", petitionId: 4, msg: "학생지원팀 공식 답변 등록 — 청원 상태가 답변 완료로 변경되었습니다." },
  ],
};
