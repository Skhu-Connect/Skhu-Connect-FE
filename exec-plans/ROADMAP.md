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
- [FEAT] 마이페이지 웹 회원탈퇴 화면 추가 — 선행 없음. 마이페이지(로그아웃 버튼 아래)에 회원탈퇴 진입점을 추가한다. 가입 비밀번호 입력 확인 모달 + "30일간 재가입 불가" 안내. 대응 백엔드 엔드포인트가 아직 없어 화면·흐름만 먼저 만든다.
- [FEAT] 마이페이지 iOS 회원탈퇴 화면 추가 — 선행 없음. 웹과 같은 정책(비밀번호 확인, 30일 재가입 제한 안내)을 iOS MY 화면에 반영한다. 코드를 공유하지 않으므로 별도 구현.
- [FEAT] 청원 상세 게스트 열람 지원 — 선행 없음. `/p/:id`가 지금 `WebLayout`의 인증 게이트 안에 있어 비로그인 진입이 전부 `/login`으로 튕긴다(known 갭, [roadmap-web.md](roadmap-web.md) 참고). 비로그인도 상세를 볼 수 있게 게이트를 우회하되, 공감(동의) 버튼을 누르면 그때 `/login?next=/p/:id`로 보낸다(기존 next 복귀 메커니즘 재사용). `ShareLink`가 보여주는 URL을 하드코딩된 `cheongwon.skhu.ac.kr` 대신 실제 origin 기준으로 만든다. 삭제·숨김·존재하지 않는 청원은 기존 `getPetition`의 404→null 처리로 이미 "찾을 수 없음" 화면이 뜨므로 게스트 경로에서도 그대로 재사용한다.
- [FEAT] 회원가입 완료 후 원래 경로로 복귀 — 선행: 청원 상세 게스트 열람 지원. `SignupScreen`이 지금 `next` 쿼리를 안 읽고 완료 후 항상 `/`로 보낸다. `LoginScreen`과 같은 오픈 리다이렉트 방지 로직으로 `next`를 보존·복귀시킨다.
- [FEAT] 모바일 공유 진입 전용 화면 — 선행: 청원 상세 게스트 열람 지원. 모바일 뷰포트로 `/p/:id`에 게스트로 진입하면 전체 네비게이션(피드·검색·마이페이지 등) 없이 그 청원과 로그인/회원가입/동의만 되는 축소 셸을 보여준다. PC는 기존 전체 웹을 그대로 유지하고, 이 제한은 공유 진입 플로우에만 적용한다(사이트의 다른 기존 모바일 동작은 손대지 않는다 — 사용자 확인 완료).
- [FEAT] iOS Universal Link로 공유 청원 열기 — 선행: 청원 상세 게스트 열람 지원(공유 URL 형식 확정). 웹 레포에 `apple-app-site-association`을 실배포 도메인(`petition-system-two.vercel.app`, 사용자 확인 완료)에 정적 파일로 배포하고, iOS 앱(`ios/`)에 `associatedDomains` 엔타이틀먼트와 앱 내 딥링크 수신(청원 상세 화면 이동) 로직을 추가한다. Apple Developer Portal의 Associated Domains capability 활성화·프로비저닝 프로파일 갱신·실기기 검증은 범위 밖이다(제가 대신 못 하는 수동 단계 — 사용자 확인 완료).
