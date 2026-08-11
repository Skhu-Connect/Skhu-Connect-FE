# App Store Connect "앱 개인정보" 설문 답안

코드 근거: `docs/api-spec.md`, `ios/src/push.ts`. App Store Connect → 앱 → 개인정보 보호 →
"시작하기"에서 아래대로 체크.

## 1. 이메일 주소 (Contact Info → Email Address)
- 수집함: 예
- 이 데이터가 사용자와 연결되나요: 예 (계정 로그인 식별자)
- 추적에 사용되나요: 아니요
- 용도: 앱 기능(App Functionality) — 이메일 인증 기반 가입/로그인

## 2. 사용자 ID (Identifiers → User ID)
- 수집함: 예 (`loginId` = 학번)
- 사용자와 연결: 예
- 추적: 아니요
- 용도: 앱 기능

## 3. 기타 사용자 콘텐츠 (User Content → Other User Content)
- 수집함: 예 (청원 글, 댓글)
- 사용자와 연결: 예 (작성자 식별 가능, 익명 표시와 별개로 서버는 작성자를 안다)
- 추적: 아니요
- 용도: 앱 기능

## 4. 기기 ID (Identifiers → Device ID)
- 수집함: 예 (FCM 푸시 토큰 — `registerFcmToken`)
- 사용자와 연결: 예 (계정에 매핑되어 저장)
- 추적: 아니요
- 용도: 앱 기능 (푸시 알림 발송)

## 5. 제품 상호작용 (Usage Data → Product Interaction)
- 수집함: 예 (청원 동의, 댓글/답글 좋아요, 북마크, 알림 읽음 여부)
- 사용자와 연결: 예 (`loginId` 계정에 귀속되어 저장)
- 추적: 아니요
- 용도: 앱 기능 (동의 수 집계, 좋아요 수 표시, 북마크 목록, 읽음 배지 — 분석/광고 목적 아님)

## 체크하지 않아도 되는 것 (코드에 근거 없음)
이름, 프로필 사진, 위치, 연락처, 결제 정보, 브라우징 기록, 검색 기록 — 이런 항목은 수집
안 함으로 둔다. `docs/api-spec.md:26`에 "이름·프로필 이미지 없음"이라고 명시돼 있다.

## 주의
- 여기 답은 지금 코드 기준이다. 이후 기능이 추가되면(예: 이름 필드, 위치 기반 기능) 설문도
  같이 갱신해야 한다 — 코드와 설문이 벌어지는 순간이 심사 리스크다.
- "개인정보처리방침 URL" 필드: `https://petition-system-two.vercel.app/privacy-policy.html`
  (배포 후 유효. `public/privacy-policy.html` — 정적 파일이라 별도 배포 절차 불필요, 다음
  `vercel deploy --prod` 때 같이 올라간다.)
