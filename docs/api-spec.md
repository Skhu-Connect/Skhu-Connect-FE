# 실 백엔드 API 계약 (2026-08-07 조사)

`https://skhu-connect-be-production.up.railway.app` — 스웨거 `/swagger-ui/index.html`, 스펙 `/v3/api-docs`.
`src/api/index.js` 를 fetch 로 교체할 때 이 문서를 원본으로 삼는다. mock 계약(`README.md` "API 계약"
절)과의 차이만 적는다 — 같은 것은 다시 안 적는다.

## 인증

- `bearerAuth` (Authorization: Bearer, JWT). `POST /connect/auth/token/refresh`, `POST /connect/auth/logout` 은
  `refreshToken` 을 **쿠키**로 받는다(서버가 로그인 시 Set-Cookie 로 내려줄 것으로 추정 — 실제 응답 헤더는
  구현하면서 확인). **access token 은 응답 바디로 오므로 메모리(zustand)에만 두고 `localStorage` 에 두지
  않는다** — README 보안 항목 2 그대로.
- `POST /connect/auth/login` — `{loginId, password}` → `{accessToken, expiresInSeconds}`. 실패 시 `401
  {status:401, title:"Invalid credentials"}` — 학번 미등록/비번 틀림을 구분하지 않는다(README 보안 항목 6 이미
  서버가 지킴, 프론트는 title 을 그대로 쓰거나 고정 문구로 감싸면 된다).
- `POST /connect/auth/signup` — `{verificationToken, loginId, password, departmentId, termsAgreed:true, termsVersion:"1.0"}`. **이름 필드 없음.** 이용약관 동의는 필수이며, `termsAgreed`가 `true`가 아니거나 `termsVersion`이 `"1.0"`이 아니면 400.
  가입 전에 이메일 인증이 **필수**:
  1. `POST /connect/auth/email-verifications` `{email, purpose:"SIGN_UP"}` → 코드 발송 (스팸 방지 위해
     이메일 존재 여부 등은 응답에 안 실림)
  2. `POST /connect/auth/email-verifications/confirm` `{email, code(6자리), purpose}` →
     `{verificationToken, expiresInSeconds}`
  3. `POST /connect/auth/signup` 에 그 `verificationToken` 을 실어 가입
  같은 `purpose` enum(`SIGN_UP`/`PASSWORD_RESET`)을 `POST /connect/auth/password/reset` (`{verificationToken,
  newPassword}`) 흐름도 공유한다 — 이번 라운드 범위 밖(사용자 지시).
- `GET /connect/users/me` → `{email, loginId, departmentCode, departmentName, notificationEnabled}`.
  **이름·프로필 이미지 없음.** 학부 변경 PATCH 엔드포인트 없음 — 마이페이지 학부 수정은 이번 라운드 범위 밖.
- `DELETE /connect/users/me` `{password}` → 204(성공)/400(비밀번호 누락)/401(토큰 무효 또는 비밀번호
  불일치)/404(사용자 없음). 동일 학교 이메일은 탈퇴 후 30일 재가입 제한(서버 처리, 프론트 확인 불필요).
  웹·iOS 모두 연동 완료(2026-08-11 확인).

## 청원

- `GET /connect/petitions?keyword&category&status&page&size&sort` → `PetitionPageResponse`
  (`{content[], page, size, totalElements, totalPages, first, last}`). **인증 불필요.**
- `category` enum: `SCHOLARSHIP FACILITY DORMITORY LIBRARY DEPARTMENT` (mock 키:
  `scholarship facility dorm library department` — `dorm`→`DORMITORY`만 이름이 다르다).
- `status` enum: `OPEN UNDER_REVIEW ANSWERED EXPIRED` (mock: `received reviewing answered` + 클라이언트가
  30일 경과로 계산하던 `expired` 가 이제 **서버 값**이다).
- `PetitionQueryResponse`/`PetitionResponse` 필드: `id category status title content agreementCount
  targetAgreementCount createdAt updatedAt` (+ `PetitionResponse` 는 `agreementDeadline`, `Query` 는
  `expiresAt`). **`excerpt`·`views`·`author`·`owner`·`threshold`(카테고리 아님, 청원 자체)·`basis` 없음.**
  **`voted`(내 공감 여부)·`bookmarked`(내 북마크 여부) 도 목록/상세 응답에 없다** — 아래 "voted/bookmarked
  파생" 절 참고.
- `excerpt` 는 `content.slice(0, 120)` 로 클라이언트에서 파생(mock 의 `createPetition` 이 하던 것과 동일 로직
  재사용).
- 카테고리 라벨·기준 문구(`basis`)·담당자(`owner`) — 서버에 이 정보를 주는 엔드포인트가 없어 `mockDb.js` 의
  `CATEGORY_META`(공개 정보 — 실명 없는 부서명 수준)를 클라이언트 상수로 쓴다.
- 임계치(`threshold`, 카테고리별 목표 공감 수)는 `GET /connect/threshold-settings`(**인증 불필요**, `[{category,
  targetAgreementCount}]`)로 관리자가 설정한 실제 값을 받아 `CATEGORY_META` 를 덮어쓴다(Skhu-Connect-BE #43).
  이미 등록된 청원의 `threshold` 는 응답의 `targetAgreementCount` 를 그대로 쓴다 — 청원마다 등록 시점의 값이
  고정되므로 그 뒤 관리자가 임계치를 바꿔도 기존 청원 목표는 유지된다.
- `POST /connect/petitions` `{category, title, content}` → 201 `PetitionResponse`. `PUT`/`DELETE` 는 작성자만
  (403/409 가능) — Admin 답변 기능 아님, 그냥 본인 글 수정·삭제.
- **관리자 답변(`answerPetition`) 엔드포인트가 없다.** 관리자 콘솔은 이번 라운드 범위 밖 — 계속 mock.

### voted / bookmarked 파생

목록·상세 응답에 없으므로, 로그인 시 `GET /connect/users/me/agreements`·`GET /connect/users/me/bookmarks`
(둘 다 `PetitionPageResponse`, size 를 크게 줘서 한 번에 가져온다 — 페이지네이션 UI는 범위 밖)를 불러
`Set<petitionId>` 를 만들고 `src/stores/petitions.js` 의 기존 `voted`/`bookmarked` Set 자리에 채운다.
공감/북마크 토글 성공 시 그 Set 을 갱신(기존 mock 로직과 동일 패턴).

- `POST/DELETE /connect/petitions/{id}/agreements` → 201 `AgreementResponse{petitionId,agreementCount,status}`
  / 204. 중복 시 409 — mock 의 `toggleEmpathy` 처럼 프론트가 미리 상태를 안 뒤 토글하되, 409 가 오면 이미
  반영된 것으로 간주하고 서버 값으로 재동기화.
- `POST/DELETE /connect/petitions/{id}/bookmarks` → 201 `BookmarkResponse{petitionId,bookmarked}` / 204.
- `GET /connect/petitions/bookmarks?page&size` → `BookmarkPageResponse`(북마크 화면 전용, `bookmarkedAt` 포함).

## 댓글

- `GET /connect/petitions/{id}/comments?page&size` → `CommentPageResponse`. **인증 불필요.**
- `CommentResponse`: `id parentCommentId content anonymousNumber likeCount myComment liked hidden createdAt
  updatedAt replies[]`. **1단계 대댓글 지원**(mock 은 flat) — `anonymousNumber` 가 "익명 N" 을 그대로 준다.
  이번 라운드는 대댓글 UI까지는 범위 밖으로 두고 root 댓글만 노출해도 된다(사용자가 "되는 것부터" 지시) —
  `ponytail: replies 는 받아서 무시, 필요해지면 CommentsSection 에 들여쓰기 한 단만 추가.`
- `POST /connect/petitions/{id}/comments` `{content, parentCommentId?}` → 201.
- `PUT/DELETE .../comments/{commentId}` — 본인 댓글만(수정/삭제, mock 에 없던 기능. 이번 라운드는 등록만
  연동해도 충분 — 있으면 좋지만 필수는 아님).
- `POST/DELETE .../comments/{commentId}/likes` → `CommentLikeResponse{commentId,likeCount,liked}` (mock 의
  댓글 `votes` 는 읽기 전용이었는데 이제 좋아요 토글이 가능해진다 — 추가 기능, 범위 밖이어도 무방).

## 알림

- `GET /connect/notifications?page&size` → `NotificationPageResponse`. `GET
  /connect/notifications/unread-count` → `{unreadCount}`.
- `NotificationResponse`: `id type message petitionId commentId read createdAt`. **`message` 를 서버가 이미
  완성된 문장으로 준다** — mock 처럼 `title`+`body` 를 프론트가 조립하지 않는다. 그대로 렌더.
- `type` enum **8종**: `PETITION_AGREEMENT_60_PERCENT PETITION_AGREEMENT_100_PERCENT PETITION_UNDER_REVIEW
  PETITION_ANSWERED COMMENT_REPLY COMMENT_LIKE REPLY_LIKE NOTICE`.
- `PATCH /connect/notifications/{id}/read`, `PATCH /connect/notifications/read-all`.
- `POST`/`DELETE /connect/notifications/fcm-tokens` `{token}` — 기기 푸시 토큰 등록·해제. iOS 만 쓴다
  (웹은 firebase 의존성이 없다). 로그인 시 등록, 로그아웃 시 해제(ios/src/push.ts).

### 알림 발생 지점 5곳 (이슈 #86, 2026-08-27 확인)

백엔드 `NotificationEventService` 의 공개 메서드 5개가 알림을 만드는 전부다. 위 8종이 이 5곳으로
빠짐없이 나뉜다 — 프론트는 이 표를 `src/components/web/notifMeta.js`(웹)·`ios/src/data.ts`(iOS)에
같은 모양으로 두고, 양쪽 self-check 가 8종 전부 덮였는지 검사한다.

| 포인트 | 백엔드 메서드 | type |
| --- | --- | --- |
| 공감 도달 | `onAgreementAdded` | `..._60_PERCENT`, `..._100_PERCENT`, `PETITION_UNDER_REVIEW` |
| 답변 등록 | `onPetitionAnswered` | `PETITION_ANSWERED` |
| 답글 | `onReplyCreated` | `COMMENT_REPLY` |
| 댓글 공감 | `onCommentLiked` | `COMMENT_LIKE`, `REPLY_LIKE` |
| 공지사항 | `onNoticePublished` | `NOTICE` |

- **포인트별 on/off 엔드포인트는 아직 없다.** 서버 스위치는 `User.notificationEnabled` 하나뿐이고
  변경 엔드포인트가 없다(엔티티에 `changeNotificationEnabled` 는 있는데 컨트롤러가 안 뚫려 있다).
  푸시 페이로드에도 알림 종류가 없어(`FcmPushService` 는 `notificationId`·`petitionId` 만 실어 보낸다)
  클라이언트가 종류별로 거를 수도 없다.
- → 저장 안 되던 토글 3종을 걷어내고, **`docs/be-notification-settings-spec.md` 의 계약에 맞춰
  포인트별 토글을 미리 붙였다**(웹·iOS 동일):
  - `GET /connect/users/me` 응답의 `notificationSettings`(5개 boolean)를 읽는다. **없으면 `null`**
    → 토글이 잠기고 "준비 중" 안내가 뜬다.
  - 토글을 누르면 `PATCH /connect/users/me/notification-settings` 에 **바뀐 키 하나만** 보내고,
    응답으로 온 5개 전체로 상태를 덮는다. 404/405 는 "아직 준비 중" 문구로 바꿔 보여준다.
  - 엔드포인트가 배포되면 **프론트 수정 없이** 풀린다.
- 기기 단위 on/off 는 iOS 알림 권한이 담당한다(NotifSettings.tsx).

## 차단 (2026-08-18 추가 확인)

- `POST /connect/users/me/blocks` `{targetType: "PETITION"|"COMMENT", contentId}` → 201
  `{createdAt}`. 청원 또는 댓글·대댓글 id로 **작성자를 영구 차단**한다 — 단방향, 해제 불가, 차단
  대상에게 알리지 않는다. 400(본인 차단)/404(콘텐츠·작성자 없음)/409(이미 차단, 성공 취급).
  **목록 endpoint 없음** — 차단한 사용자 목록 화면은 서버 지원 밖.
- `GET /connect/petitions`·`GET /connect/petitions/{id}`: **로그인한 사용자에게는 차단한 작성자의
  청원이 걸러진다**(목록에서 빠짐, 상세는 404). 그런데 이 판단은 요청의 Authorization 토큰으로 하므로,
  로그인 중에도 `auth:false` 로 부르면(과거 관성) 필터가 안 걸린다 — `listPetitions`/`getPetition` 은
  기본 auth(토큰 있으면 첨부)로 부른다.
- "게시글만 차단(작성자는 그대로)"에 대응하는 서버 기능은 없다 — 그래서 그 옵션은 만들지 않았다.
  차단은 작성자 단위로만 가능하다(청원 카드의 차단 버튼은 항상 "작성자 차단").

## 학부

- `GET /connect/departments` → `[{id, code, name}]`. **인증 불필요.**
- **현재 프로덕션 DB 가 빈 상태**(`[]` 응답 확인, 2026-08-07). 시드되기 전까지 회원가입 화면에서 학부
  드롭다운이 비어 실제 가입을 끝까지 테스트할 수 없다 — 백엔드 쪽에 데이터 시드 필요(이 레포 밖의 작업).
  프론트 구현·코드 리뷰는 시드와 무관하게 진행 가능.

## 값이 비어 있는 엔드포인트 (2026-08-07 확인)

`GET /connect/petitions` → `{content:[], totalElements:0}`, `GET /connect/departments` → `[]`.
DB 가 빈 상태이므로 브라우저로 실제 데이터 흐름(피드에 글이 뜨는지 등)을 끝까지 확인하려면 최소 1개
청원·부서 시드가 필요하다. 그 전까지는 "내가 직접 가입 시도 → 로그인 → 글 작성 → 피드에 뜨는지" 순서로
셀프 시드하며 검증한다(부서가 비어 있으면 가입 자체가 막히므로 그 지점이 최소 확인선).

## 이번 라운드 범위 밖 (백엔드 미지원 또는 사용자 지시)

1. 관리자 콘솔 전체(답변 등록·담당자 연락처·처리 로그) — 대응 엔드포인트 없음. mock 유지.
2. 마이페이지 학부 수정 — `PATCH /users/me` 없음. mock 유지(또는 읽기 전용으로 축소).
3. 알림 포인트별 on/off 저장 — 엔드포인트 대기 중(계약은 docs/be-notification-settings-spec.md, 프론트는 붙여 둠).
4. 비밀번호 재설정 화면 — 엔드포인트는 있으나 현재 앱에 화면 자체가 없다. 신규 기능이라 범위 밖.
5. 댓글 수정·삭제·대댓글 UI, 댓글 좋아요 — 엔드포인트는 있으나 mock 에 없던 신규 기능이라 필수 아님.
6. 페이지네이션 UI(무한 스크롤 등) — 우선 큰 `size` 로 한 번에 받아 기존 화면 동작을 유지한다.
