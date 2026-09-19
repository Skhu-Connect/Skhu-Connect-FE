/* 남은 목 데이터. **오직 src/api/index.js 만 이 파일을 import 한다.**

   학생 화면 데이터(세션·청원·댓글·공감·북마크·알림·학부)와 관리자 콘솔(로그인·청원 목록·공식
   답변·숨김복원·임계치 설정)은 이제 전부 실 백엔드에서 온다. 여기 남은 건 하나뿐이다.

   CATEGORY_META — 카테고리 라벨·임계치 기준 문구는 대응 엔드포인트가 없어 클라이언트 상수로
   유지한다. threshold 필드는 초기값일 뿐이고, api/index.js 의 ensureCategoryThresholds() 가
   공개 GET /connect/threshold-settings 로 받은 실제 값으로 세션당 1회 덮어쓴다. */

export const CATEGORY_META = {
  scholarship: {
    label: "장학",
    threshold: 480,
    basis: "전체 학생",
  },
  facility: {
    label: "시설",
    threshold: 480,
    basis: "전체 학생",
  },
  dorm: {
    label: "기숙사",
    threshold: 240,
    basis: "기숙사 정원",
  },
  library: {
    label: "도서관",
    threshold: 480,
    basis: "전체 학생",
  },
  department: {
    label: "학부",
    threshold: 180,
    basis: "학과 정원",
  },
};
