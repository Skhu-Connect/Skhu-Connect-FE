# 백엔드 변경 요청: 소프트웨어융합학부 카테고리 · 관리자 권한 2종 (2026-10-26)

프론트(웹·iOS·관리자 콘솔)는 이 문서의 계약대로 먼저 만들어 두고, **서버가 배포된 뒤에** main 에 올린다.
프론트는 백엔드 코드를 고치지 않는다. 아래는 백엔드 `origin/main`(37807df) 코드를 읽고 쓴 것이다.

## 요구사항

- 청원 카테고리에 **소프트웨어융합학부**를 추가한다.
- 관리자 계정을 **비상대책위원회(비대위)** 와 **학생회** 두 종류로 나눈다.

| 작업 | 비대위 | 학생회 |
|---|---|---|
| 청원·댓글·신고·임계치·대시보드·운영 로그 **조회** | 전 카테고리 | 전 카테고리 |
| 공식 답변 등록·수정, 청원·댓글 숨김·복구, 신고 처리, 임계치 수정 | **소프트웨어융합학부만** | **소프트웨어융합학부 빼고 전부** |
| 공지사항 작성·수정·발행·숨김·재공개 | 불가 | 가능 |

## 1. 카테고리 값 추가

- `PetitionCategory` 에 `SOFTWARE_CONVERGENCE` 추가. 프론트 표시명은 "소프트웨어융합학부"다.
- **배포 전에 운영 DB 작업이 필요하다** (ERD.md 26절, 2026-08-30 장애와 같은 구조):
  `petitions.category`·`threshold_settings.category` 는 `@Enumerated(STRING)` 이라 Hibernate 가 CHECK 제약을 만들었을 수 있다.
  `SHOW CREATE TABLE petitions;`·`SHOW CREATE TABLE threshold_settings;` 로 확인하고, 있으면 DROP 하거나 새 값을 넣어 다시 만든다.
  `category` 를 가진 다른 테이블(유사 청원 임베딩 등)이 있으면 같이 확인한다.
- `threshold_settings` 에 `SOFTWARE_CONVERGENCE` 행을 넣는다. 행이 없으면 그 카테고리로 청원을 만들 때 실패한다.
  `total_student_count`·`threshold_rate`·`minimum_count` 초기값은 **비대위와 정해야 한다** (확정 전까지는 `DEPARTMENT` 행 값을 복사하자고 제안).

## 2. 관리자 역할

- `admins.role` 컬럼 추가. 값은 `EMERGENCY_COMMITTEE`(비대위) · `STUDENT_COUNCIL`(학생회).
  26절 규칙을 따르려면 `Notification.type` 처럼 String 으로 매핑해 CHECK 제약이 생기지 않게 하는 것을 제안한다.
- 기존 관리자 행은 `STUDENT_COUNCIL` 로 채운다. 비대위 계정은 기존 정책대로 DB 에서 직접 만든다(BCrypt).
- 권한 규칙은 한 곳에 둔다. 예: `AdminRole.canManage(PetitionCategory)`, `AdminRole.canManageNotices()`.

## 3. 서버에서 막아야 하는 곳 (프론트에서 숨기는 것만으로는 안 된다)

위반 시 **403**, ProblemDetail `title` 은 `ADMIN_FORBIDDEN` 으로 통일해 주면 프론트가 한 문구로 처리한다.

| API | 판정 기준 카테고리 |
|---|---|
| `POST`·`PUT /connect/admin/petitions/{id}/answer` | 그 청원 |
| `PATCH /connect/admin/petitions/{id}/hide`·`/restore` | 그 청원 |
| `PATCH /connect/admin/petitions/{id}/comments/{cid}/hide`·`/restore` | 댓글이 달린 청원 |
| `PATCH /connect/admin/reports/{id}` (숨김·로그인 정지 조치 포함) | 신고 대상 청원(댓글 신고면 댓글의 청원) |
| `PUT /connect/admin/threshold-settings/{category}` | 경로의 category |
| `POST`·`PUT`·`PATCH /connect/admin/notices/**` | 학생회만 |

조회 API(`GET`)는 지금처럼 두 역할 모두 연다.

## 4. 프론트가 새로 쓰는 응답

- **`GET /connect/admin/me`** (관리자 토큰 필수) → `{ "id": 1, "loginId": "council", "role": "STUDENT_COUNCIL" }`
  콘솔이 메뉴·버튼을 역할에 맞게 그리는 데 쓴다. 지금은 관리자 프로필 API 가 없어 사이드바 이름이 자리표시자다.
- **`ReportResponse` 에 `petitionCategory` 필드 추가** — 신고 대상 청원의 카테고리(댓글 신고면 그 댓글의 청원).
  신고 목록에서 처리 버튼을 역할별로 막으려면 필요하다. 지금은 `petitionId` 만 있다.

## 5. 배포 순서

1. 운영 DB: CHECK 제약 확인·정리 → `threshold_settings` 행 추가
2. 백엔드 배포 (`admins.role` 은 `ddl-auto=update` 가 추가) → 기존 관리자 `role` 채우기 → 비대위 계정 생성
3. 프론트 배포 (웹·관리자 콘솔은 Vercel, iOS 는 앱 심사)

구버전 iOS 앱은 모르는 카테고리를 "학부"로 표시한다(`CATEGORY_ENUM_TO_KEY[...] ?? "department"`). 깨지지는 않지만 새 앱이 나오기 전까지는 표시명이 틀리게 나온다.
