# 청원시스템 (SKHU Petition System)

성공회대학교 익명 건의·청원 시스템. 학생이 익명으로 건의를 올리고, 다른 학생이 **공감**을 누른다.
공감 수가 임계치(학과 정원 또는 전체 학생 대비 %)를 넘으면 담당 부서로 자동 전달되고 공식 답변이 등록된다.

- **학생 웹** (`/`) — 로그인, 청원 피드, 상세(공감·임계치·댓글·에타 공유), 청원 등록, 북마크
- **관리자 콘솔** (`/admin`) — 대시보드, 청원 관리, 카테고리 담당자, 알림 로그, 답변 작성

## 스택

Vite + React 19 + Tailwind CSS v4 + React Router 7 + zustand 5. 디자인 토큰은 Tailwind `@theme` 으로 이식.

## 실행

```bash
npm install
npm run dev          # http://localhost:5173
npm run lint
node src/api/selfcheck.js   # 임계치 전이 로직 self-check
```

`/_ds` 는 DS 프리미티브 14종의 전 variant 를 늘어놓은 이식 확인 페이지다.

## 구조

```
src/
  index.css            디자인 토큰 130개 (Tailwind @theme + :root)
  api/                 데이터 접근 계약 — 화면·스토어는 이 밖을 모른다
    index.js           async 함수 18개
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
| `listPetitions()` | `Petition[]` |
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

### 연동 시 반드시 닫아야 할 항목

목 단계에서 의도적으로 열어둔 것들이다. `security-reviewer` 검토 결과를 반영해 기록한다.

1. **`/admin` 인증 게이트가 없다.** 라우트 가드만으로 부족하다 — `AdminLayout` 이 학생 웹과 같은
   엔드포인트를 쓰므로 API 쪽에서 관리자 스코프를 걸어야 한다. 담당자 연락처·전체 청원·답변 등록이
   전부 이 뒤에 있다.
2. **로그인이 자격 증명을 검증하지 않는다.** 세션은 zustand 메모리에만 있다(스토리지 사용 0건).
   토큰은 HttpOnly 쿠키로 가고 `localStorage` 로 가지 않는다.
3. **`mine` 플래그는 서버가 요청자 세션 기준으로 계산해야 한다.** 작성자 ID 를 클라이언트로 내려
   비교하게 만들면 익명성이 그 자리에서 깨진다.
4. **답변 권한을 카테고리 담당 부서로 좁힐지 결정.** `answerPetition` 이 `category.owner` 명의로
   서명하는데 현재는 서명자와 실행자가 무관하다. 임계치·중복 가드는 이미 계약에 들어가 있다.
5. **Pretendard 를 self-host 로 바꾼다.** 지금은 jsDelivr CDN `@import` 라 SRI 를 걸 수 없다.
6. **`Avatar` 의 `background: url(${src})`** — 프로필 이미지 URL 을 서버가 주기 시작하면
   따옴표 없는 CSS `url()` 주입 지점이 된다. 현재 `src` 를 넘기는 호출부는 0건.
7. **새로고침 시 세션·목 데이터가 초기화된다.** 백엔드가 붙으면 자연히 해결된다.

## 설계 원본

`claude.ai/design` 핸드오프 번들(`../design-handoff/`)의 HTML/CSS/JS 프로토타입을 옮긴 것이다.

- `project/청원시스템 Web.dc.html`, `project/app/web-app-v7.jsx` — 학생 웹
- `project/청원시스템 Admin.dc.html`, `project/app/admin-app-v4.jsx` — 관리자 콘솔
- `project/_ds/…/tokens/*.css`, `_ds_bundle.js` — 디자인 토큰·컴포넌트 14종

프로토타입과 **의도적으로 다르게 한 것 3가지**와 그 근거는 `exec-plans/ROADMAP.md` 의
"크로스 트랙 의존" 절에 기록돼 있다.
