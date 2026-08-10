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

export const adminDb = {
  notifLogs: [
    { id: 1, time: "2026.07.25 14:02", type: "threshold", petitionId: 2, msg: "공감 243/240 도달 — 생활관행정실 김도윤에게 검토 요청을 발송했습니다." },
    { id: 2, time: "2026.07.24 09:31", type: "threshold", petitionId: 1, msg: "공감 512/480 도달 — 학술정보관 이동수에게 검토 요청을 발송했습니다." },
    { id: 3, time: "2026.05.22 16:45", type: "answer", petitionId: 4, msg: "학생지원팀 공식 답변 등록 — 청원 상태가 답변 완료로 변경되었습니다." },
  ],
};
