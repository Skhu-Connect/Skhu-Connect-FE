# 실행 로드맵

**이 파일은 목차다.** 실행 항목은 아래 4개 파일에 있다.
원래 한 파일이었고 559줄이 되면서 쪼갰다.

| 파일 | 대상 | 상태 |
|---|---|---|
| [roadmap-web.md](roadmap-web.md) | 학생 웹 6화면 + **공용 Foundation** | 완료 · 배포됨 |
| [roadmap-admin.md](roadmap-admin.md) | 관리자 콘솔 4화면 + 답변 모달 | 완료 · 배포됨 |
| [roadmap-ios.md](roadmap-ios.md) | iOS 앱(Expo/React Native) 5화면 | M0 완료, M1~M3 남음 |
| [roadmap-android.md](roadmap-android.md) | 안드로이드 | 계획 없음(범위 밖) |

## 어디에 무엇이 있나

**Foundation 은 웹 문서에 있다.** 토큰·`Icon`·DS 프리미티브 14종·`src/api/`·zustand 스토어·
라우터 셸은 학생 웹과 관리자 콘솔이 같이 쓴다. 관리자 콘솔은 별도 앱이 아니라 같은 Vite
빌드 안의 `/admin` 경로이므로, **검증(Phase 3)과 배포(Phase 4)도 웹 문서 하나에 있다.**
관리자 문서에는 관리자 고유 화면(Phase 2)만 있다.

**iOS 는 코드를 공유하지 않는다.** 번들이 분리돼 있어 `src/api/` 를 재사용할 수 없고
목데이터를 `ios/src/data.ts` 에 따로 둔다. 공유되는 것은 디자인 토큰 값과 컴포넌트 수치뿐이다.
그래서 iOS 문서는 자체 Foundation(Phase M0)을 따로 갖는다.

**안드로이드는 별도 코드베이스가 아니다.** `ios/` 의 Expo 앱이 크로스 플랫폼이고
`app.json` 에 안드로이드 블록이 이미 있다. 그 문서는 실행 항목이 아니라 착수 전 확인 목록이다.

## 읽는 법

체크 표시는 "구현했다"가 아니라 **"완료 조건을 확인했다"**는 뜻이다. 각 항목의 `완료:` 줄이
그 조건이고, 확인 근거는 문서 안의 검증 기록 절에 남긴다.

## 이슈 분할

Phase 5(신규 기능 확장, 학생 웹) 실행 항목은 [roadmap-web.md](roadmap-web.md) 에 있다.

- [FEAT] 모바일 MY 화면 알림 전체 읽음 버튼 추가 — 선행 없음. 웹은 알림 목록에 "전체 읽음" 버튼이 있지만 모바일 MY 화면은 개별 읽음만 가능해 기능 격차가 있다. 벨을 누르면 드롭다운이 아니라 MY 화면으로 가는 기존 모바일 설계([roadmap-ios.md](roadmap-ios.md) M2-6)는 유지하고, 그 화면 안에 웹과 동일한 전체 읽음 버튼만 추가한다.
- [FEAT] 관리자 로그인·인증 게이트 추가 — 선행 없음, 아래 4건의 선행 조건. `/connect/admin/auth/{login,logout,token/refresh}` 연동. 지금 `/admin`은 로그인 게이트가 전혀 없다(AdminLayout.jsx·routes/admin.jsx에 "목 단계엔 인증 게이트 없음" 이라고 명시돼 있던 known 갭). 관리자 로그인 화면 신설 + AdminLayout 인증 가드. 학생 로그인(api/index.js login/restoreSession)과 같은 패턴(accessToken 메모리, refreshToken 쿠키)이되, 쿠키명이 `adminRefreshToken`으로 분리돼 있어 토큰 상태·리프레시 경로도 학생과 별도로 둔다.
- [FEAT] 관리자 청원·댓글 목록을 실 백엔드로 전환 — 선행: 관리자 로그인·인증 게이트. `GET /connect/admin/petitions`, `GET .../comments`. `listAdminPetitions()` mock을 실 API로 교체.
- [FEAT] 관리자 공식 답변 등록·수정 화면 보강 — 선행: 관리자 로그인·인증 게이트, 관리자 청원·댓글 목록 전환. `GET/PUT/POST .../answer`. 지금 AnswerModal은 등록(POST)만 있고 기존 답변 조회·수정 진입점이 없어 새로 만든다.
- [FEAT] 관리자 콘텐츠 숨김·복원 기능 신규 추가 — 선행: 관리자 로그인·인증 게이트, 관리자 청원·댓글 목록 전환. 청원/댓글 hide·restore 4건. UI가 아예 없는 신규 기능.
- [FEAT] 관리자 임계치 설정 화면 신규 추가 — 선행: 관리자 로그인·인증 게이트. `GET/PUT /connect/admin/threshold-settings`. 완전 신규 화면 + 사이드바 메뉴. `CATEGORY_META.threshold`가 학생 웹(청원 상세 진행률 등)도 같이 읽는 공용 상수라 서버값 전환 시 학생 웹 쪽 후속 이슈가 필요할 수 있다.
- [FEAT] 회원가입 화면 구현 — 선행 없음
- [FEAT] 마이페이지 화면 구현 — 선행 없음
- [FEAT] 청원 만료 30일 처리 — 선행 없음
- [FEAT] 피드 카드 제목만 표시 및 히어로 배너 정리 — 선행 없음
- [FEAT] 상태·분류 배지 컬러 리디자인 — 선행 없음
