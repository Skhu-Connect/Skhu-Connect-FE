// 서버가 타임존 없는 UTC LocalDateTime을 내려준다 — 그대로 new Date()에 넣으면 브라우저가 로컬시간(KST)으로
// 오인해 9시간 밀린다. 타임존 표기가 없을 때만 'Z'를 붙여 UTC로 명시한다.
export function parseServerDate(iso) {
  return new Date(/[Zz]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
}

/** 서버 Petition.isAgreementOpenAt 과 같은 규칙: OPEN 이고 기한이 지금보다 뒤. 기한 없음은 거짓.
    ponytail: 클라이언트 시계 기준이라 경계 몇 초는 toggleEmpathy 의 409 처리가 받아 낸다. */
export function isAgreeable(status, deadline, now = Date.now()) {
  return status === "OPEN" && deadline != null && parseServerDate(deadline).getTime() > now;
}
