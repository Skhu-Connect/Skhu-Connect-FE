# Skhu-Connect — 성공회대 익명 건의·청원 시스템

성공회대학교 익명 건의·청원 시스템. 학생이 익명으로 건의를 올리고, 다른 학생이 **공감**을 누른다.
공감 수가 임계치(학과 정원 또는 전체 학생 대비 %)를 넘으면 담당 부서로 자동 전달되고 공식 답변이 등록된다.

- **학생 웹** (`/`) — 로그인, 청원 피드, 상세(공감·임계치·댓글·에타 공유), 청원 등록, 북마크
- **관리자 콘솔** (`/admin`) — 대시보드, 청원 관리, 카테고리 담당자, 알림 로그, 답변 작성

## 스택

Vite + React 19 + Tailwind CSS v4 + React Router 7 + zustand 5. 디자인 토큰은 Tailwind `@theme` 으로 이식.

**배포**: https://petition-system-two.vercel.app (Vercel · production)
> 프로젝트 이름을 `skhu-connect` 로 바꿨지만 **Vercel 프로젝트명과 GitHub 리포명(`skhu-petition`)은
> 그대로다.** 둘은 외부 서비스에서 각각 바꿔야 하고, 바꾸면 배포 URL 과 remote 가 함께 바뀐다.

## 백엔드 연동

- API 명세는 백엔드가 관리한다 (프런트 레포에는 없음)
- 화면 보드: Figma 채널 `ga2ate9v` (화면 24셀 + 요청/응답 패널 24개)

## 실행

```bash
npm install
npm run dev          # http://localhost:5173
npm run lint
node src/api/selfcheck.js   # 임계치 전이 로직 self-check
```

## 배포 (Vercel)

```bash
vercel deploy --prod
```

프레임워크 감지(Vite)로 빌드·정적 서빙은 자동이고, `vercel.json` 은 **한 줄짜리 SPA 폴백**만 갖는다.

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

정적 호스팅에서 `/p/3`·`/admin` 직접 진입이 404 가 되는 유일한 지점이므로 지우지 말 것 — 라우팅이
URL 에 있다는 전제(ROADMAP 0-8, 의존 G)가 배포에서 깨진다. rewrite 는 파일 시스템 조회 뒤에 걸리므로
`/assets/*` 는 그대로 정적 파일로 나간다.

`/_ds` 는 DS 프리미티브 14종의 전 variant 를 늘어놓은 이식 확인 페이지다.

## 구조

```
src/
  index.css            디자인 토큰 130개 (Tailwind @theme + :root)
  api/                 데이터 접근 계약 — 화면·스토어는 이 밖을 모른다
    index.js           async 함수 19개
    mockDb.js          인메모리 목 데이터 (index.js 만 import)
    selfcheck.js       임계치 전이 assert
  stores/              zustand — session(Web 전용) · petitions(Web·Admin 공용)
  components/ui/       DS 프리미티브 14종 + Icon 36종
  components/web/      Header · FeedParts · SettingsModal
  components/admin/    Sidebar 부속 · PetitionTable · AnswerModal · PageHead
  pages/web/           로그인 · 피드 · 상세 · 등록 · 북마크
  pages/admin/         대시보드 · 청원 관리 · 담당자 · 알림 로그
  layouts/             WebLayout(sticky Header + 인증 가드) · AdminLayout(navy 사이드바)
  routes/              트랙별 라우트 정의 (web.jsx · admin.jsx)
```

**상태 분담**: 모달 열림·입력 중 텍스트·필터 칩·정렬 토글·검색창 열림은 화면 `useState`.
화면 간 공유되는 세션·도메인 상태만 zustand. 스토어가 `src/api/` 를 호출하고 화면은 셀렉터만 본다.

## 백엔드 연동 (`src/api/index.js` 만 교체)

데이터는 현재 인메모리 목이다. **화면·스토어는 `src/api/` 의 아래 함수만 호출한다.**
연동은 `index.js` 내부를 `fetch` 로 다시 쓰고 `mockDb.js`·`selfcheck.js` 를 지우는 것으로 끝난다 —
스토어와 화면 코드는 바뀌지 않는다.

| 함수 | 반환 |
| --- | --- |
| `login(sid, password)` | `{ user, prefs }` — 빈 값이면 throw |
| `logout()` | `void` |
| `getMe()` | `user \| null` |
| `getPrefs()` / `savePrefs(patch)` | `prefs` |
| `listPetitions()` | `Petition[]` — 담당자를 부서명까지만 내린다(학생용) |
| `listAdminPetitions()` | `Petition[]` — 담당자 실명·이메일·전화 포함(관리자 스코프) |
| `getPetition(id)` | `Petition \| null` |
| `createPetition({ category, title, body })` | `Petition` — 카테고리·제목·본문 필수 |
| `toggleEmpathy(id)` | `Petition` — 임계치 도달 시 `status: received → reviewing` |
| `toggleBookmark(id)` | `Petition` |
| `listComments(petitionId)` | `Comment[]` |
| `addComment(petitionId, body)` | `Comment` — 빈 본문이면 throw |
| `listCategories()` | `Category[]` |
| `listOwners()` | `{ key, label, team, name, email, phone }[]` |
| `listNotifications()` / `markAllNotifRead()` | `Notification[]` |
| `listNotifLogs()` | `NotifLog[]` |
| `answerPetition(id, body)` | `{ petition, answer }` — 임계치 미달·중복 답변이면 throw |

```
Petition  { id, title, excerpt, body, category, status, current, author, date,
            views, mine?, threshold, basis, owner, comments, voted, bookmarked,
            answered, answer }
Category  { key, label, threshold, basis, owner { team, name, email, phone } }
```

`threshold`·`basis`·`owner` 는 **청원에 저장되지 않고 카테고리에서 파생된다** — 학생 웹 등록 화면의
임계치 미리보기와 관리자 담당자 화면이 같은 출처를 읽어야 하기 때문이다.
`answer` 는 청원별 레코드다(전역 단일 객체가 아니다) — 그렇지 않으면 어느 청원에 답변해도
학생 웹에 같은 답변이 뜬다.

### 연동 시 반드시 닫아야 할 항목 (보안)

목 단계에서 의도적으로 열어둔 것들이다. `security-reviewer` 검토 2회 결과를 반영해 기록한다.

1. **`/admin` 에 인증 게이트가 없다.** 라우트 가드만으로 부족하다 — **스코프는 라우트가 아니라
   응답 필드에 있어야 한다.** 관리자 전용 데이터는 `listAdminPetitions()`·`listOwners()`·
   `listNotifLogs()` 세 함수에 모여 있고, 학생용 `listPetitions()`/`getPetition()` 은 담당자를
   부서명까지만 내린다(`owner.team`). 이 경계를 백엔드에서도 그대로 유지할 것.
2. **로그인이 자격 증명을 검증하지 않는다.** 세션은 zustand 메모리에만 있다(스토리지 사용 0건).
   토큰은 HttpOnly 쿠키로 가고 `localStorage` 로 가지 않는다.
3. **`mine` 플래그는 서버가 요청자 세션 기준으로 계산해야 한다.** 작성자 ID 를 클라이언트로 내려
   비교하게 만들면 익명성이 그 자리에서 깨진다.
4. **공감·북마크의 1인 1회를 서버가 소유해야 한다.** 계약 `toggleEmpathy(id)` 에 사용자 인자가
   없다(목은 `db.voted` Set 이 소유). 백엔드가 세션에서 파생하지 않고 단순 증분으로 구현하면
   한 사람이 반복 호출로 임계치를 넘긴다 — 임계치가 부서 대응을 트리거하는 유일한 게이트다.
5. **답변 권한을 카테고리 담당 부서로 좁힐지 결정.** `answerPetition` 이 `category.owner` 명의로
   서명하는데 현재는 서명자와 실행자가 무관하다. 임계치 미달·중복 답변 가드는 계약에 이미 있다.
6. **로그인 실패 문구를 서버 텍스트로 렌더하지 않는다.** `LoginScreen` 은 고정 문구를 쓴다 —
   "등록되지 않은 학번" 과 "비밀번호 불일치" 를 구분해 던지면 학번 순차 대입으로 재학생 명단이
   만들어진다. 시도 횟수 제한은 백엔드 몫.
7. **CSP 가 없다.** `index.html` 에 헤더·메타 0건. 최소 `default-src 'self'`.
8. **Pretendard 를 self-host 로 바꾼다.** 지금은 jsDelivr CDN `@import` 라 SRI 를 걸 수 없다.
   self-host 후 `style-src 'self' 'unsafe-inline'`.
9. **`Avatar` 의 `background: url(${src})`** — 프로필 이미지 URL 을 서버가 주기 시작하면
   따옴표 없는 CSS `url()` 주입 지점이 된다. 현재 `src` 를 넘기는 호출부는 0건.

목데이터의 담당자 5명은 **전부 가상 인물**이고 이메일·전화는 자리표시자다(`src/api/mockDb.js`).

### 목 단계 제약 (보안 항목 아님)

- 새로고침하면 세션과 목 데이터가 초기화된다. 백엔드가 붙으면 자연히 해결된다.
- 관리자 콘솔에서 학생 웹으로 가는 링크가 없다(앱 내 왕복 경로 없음).

## 설계 원본

`claude.ai/design` 핸드오프 번들(`../design-handoff/`)의 HTML/CSS/JS 프로토타입을 옮긴 것이다.

- `project/청원시스템 Web.dc.html`, `project/app/web-app-v7.jsx` — 학생 웹
- `project/청원시스템 Admin.dc.html`, `project/app/admin-app-v4.jsx` — 관리자 콘솔
- `project/_ds/…/tokens/*.css`, `_ds_bundle.js` — 디자인 토큰·컴포넌트 14종

프로토타입과 **의도적으로 다르게 한 것 3가지**와 그 근거는 `exec-plans/roadmap-web.md` 의
"크로스 트랙 의존" 절에 기록돼 있다. 로드맵은 대상별로 나뉘어 있고 목차는
`exec-plans/ROADMAP.md` 다.
