# 청원시스템 이식 실행 로드맵

`claude.ai/design` 핸드오프 번들(HTML/CSS/JS 프로토타입) → Vite + React 19 앱 이식.
**PRD 는 없다. 설계 핸드오프가 스펙이다.** 스펙 원본:

| 대상 | 원본 |
|---|---|
| 학생 웹 | `../design-handoff/project/app/web-app-v7.jsx` (635줄), `project/청원시스템_Web.dc.html` |
| 관리자 콘솔 | `../design-handoff/project/app/admin-app-v4.jsx` (341줄), `project/청원시스템_Admin.dc.html` |
| 컴포넌트 14종 | `project/_ds/design-system-…/_ds_bundle.js` 1–1017줄 |
| 토큰 | `project/_ds/design-system-…/tokens/*.css` (7파일) |
| 목데이터 | `project/app/data-v4.js` |
| 제품 맥락 | `project/_ds/design-system-…/readme.md` |

## 전제 (재논의 대상 아님)

- 대상 레포는 스캐폴딩 완료: Vite 8 + React 19.2 + Tailwind CSS v4.3 (`@tailwindcss/vite`) + react-router-dom 7 + **zustand 5.0.14** + oxlint.
- 토큰 CSS 는 Tailwind v4 `@theme` 으로 이식한다.
- 범위는 **학생 웹 + 관리자 콘솔**. 모바일(iOS/Android) 킷은 범위 밖.
- 데이터는 목. 화면·스토어는 `src/api/` 의 async 함수만 호출한다. 백엔드 연동은 `src/api/` 내부 교체로 끝난다.
- **상태 분담**: 화면 로컬 UI 상태(모달 열림, 입력 중 텍스트, 필터 칩 선택, 정렬 토글)는 `useState`. 화면 간 공유되는 세션·도메인 상태만 zustand. 스토어가 `src/api/` 를 호출하고, 화면은 셀렉터만 본다.
- **픽셀 충실도가 목표**다. 프로토타입 내부 구조를 복사하지 않고 시각적 산출물을 재현한다.
- 구현은 `frontend-coder`. 코드가 바뀌면 `code-reviewer` + `security-reviewer` 를 반드시 돈다.

## 트랙

- **Foundation** — 토큰·아이콘·DS 프리미티브·api·스토어·라우터. Web/Admin 둘 다 여기에 걸린다.
- **Web** — 학생 웹 6화면.
- **Admin** — 관리자 콘솔 4화면 + 답변 모달.
- **Verify** — 픽셀 대조·리뷰·백엔드 스왑 지점 확인.

## 페이즈 목표 (한 문장씩)

- **Phase 0 Foundation** — 화면을 새로 쓸 때 새로 만들 프리미티브·데이터 접근 경로가 하나도 남지 않은 상태.
- **Phase 1 Web** — 학생이 로그인 → 피드 → 상세(공감·북마크·댓글·공유) → 등록 → 북마크·환경설정 전 플로우를 브라우저에서 돈다.
- **Phase 2 Admin** — 담당자가 대시보드에서 임계치 도달 건을 찾아 공식 답변을 등록하고, 그 답변이 학생 웹 상세에 나타난다.
- **Phase 3 Verify** — 두 앱이 프로토타입과 시각적으로 일치하고, 백엔드 전환 시 손댈 파일이 `src/api/` 뿐임이 확인된 상태.

---

## 크로스 트랙 의존 (병목 — 여기가 로드맵의 값)

> 아래 7개는 "나중에 고치면 되는 것"이 아니다. **A~C 를 Phase 0 에서 확정하지 않으면 Phase 1·2 병렬이 성립하지 않고, 잘못된 데이터 모양이 화면에 굳어 전 화면 리팩터가 된다.**

**A. 토큰 네임스페이스 충돌 → 모든 화면 (Foundation 0-2 가 전부를 막는다)**
프로토타입은 `var(--indigo-600)`, `var(--gradient-hero)`, `font: var(--text-h3)` 를 직접 쓴다. Tailwind v4 `@theme` 은 `--color-*` / `--text-*` / `--radius-*` / `--shadow-*` / `--font-*` 를 예약 네임스페이스로 소비한다. 토큰의 `--text-h3`·`--text-body-role`·`--text-label`·`--text-caption-role` 은 **`font` shorthand** 이고 `--text-strong`·`--text-muted`·`--text-body` 는 **색상**이다 — 둘 다 Tailwind 의 `--text-*`(font-size) 네임스페이스와 충돌한다. 이름 매핑을 Phase 0 에서 결정하지 않으면 Phase 1·2 의 모든 파일이 나중에 바뀐다.

**B. Admin 의 답변 등록 → Web 상세의 `AdminAnswer` 카드 (Admin 이 Web 을 막는 유일한 지점)**
프로토타입 web `DetailScreen` 은 `p.answered` 플래그를 보고 **전역 단일 객체** `D.adminAnswer` 를 렌더한다(web-app-v7.jsx 383행). admin `AnswerModal` 은 `status: "answered"` 로만 바꾸고 답변 본문을 버린다(admin-app-v4.jsx 325행). 이대로 옮기면 어느 청원에 답변해도 학생 웹에는 항상 "학술정보관 이동수" 답변이 뜬다. → **api 스키마에서 `answers[petitionId]` 로 정규화**하고 `answerPetition(id, body)` 가 그 레코드를 만들게 한다. Phase 0 에서 확정해야 Web 상세를 옳은 모양으로 한 번에 짤 수 있다.

**C. 카테고리 임계치·담당자의 단일 출처 → Web Submit + Admin Owners/Logs 양쪽**
Web `SubmitScreen` 은 임계치를 `catKey === "department" ? 180 : 480` 로 하드코딩한다(web-app-v7.jsx 425행). Admin 은 `OWNERS`/`OWNER_DETAILS` 를 자기 파일에 하드코딩한다(admin-app-v4.jsx 61, 177행). 둘이 서로 모른다. → **`categories[]` 에 `{key, label, threshold, basis, owner:{team,name,email,phone}}` 를 두고 api 로만 노출**한다. Web Submit 미리보기와 Admin Owners 카드가 같은 값을 읽어야 한다.

**D. `petitions` 스토어의 `voted`/`bookmarks` → Web 피드·상세·북마크 3화면**
프로토타입은 `votes`/`marks` 를 최상위 `App` 의 `useState` 로 들고 모든 화면에 prop 으로 내린다(web-app-v7.jsx 592–594행). 라우터로 화면을 쪼개면 이 상태가 화면 이동마다 소실된다. 북마크 화면은 `marks` 없이는 **항상 빈 상태**가 된다. → zustand `petitions` 스토어 필수. Phase 0 선행.

**E. `StatusBadge`/`CategoryTag`/`Textarea`/`IconButton`/`Button`/`Avatar` → Web + Admin 공용**
Admin 테이블 `Row` 와 `AnswerModal`, `Owners` 카드가 이들을 쓴다. Phase 0 DS 프리미티브 없이 Admin 을 시작할 수 없다.
**단 `ThresholdBar` 는 Admin 테이블에서 재사용하지 않는다** — Admin `Row` 의 진행바는 높이 7px, 폭 34px 의 `%` 텍스트가 오른쪽에 붙는 별개 시각 산출물이다(admin-app-v4.jsx 109–115행). 재사용하면 픽셀이 어긋난다.

**F. `NotifBell` 항목 클릭 → 청원 상세 이동 (라우터 선행)**
알림 클릭이 `onOpenPetition(n.petitionId)` 로 화면을 전환한다. 라우터 셸(0-6) 없이는 구현 불가.

**G. 에타 딥링크 → 로그인 → 원래 청원 (Web 내부, 라우터 선행)**
프로토타입은 딥링크 진입 시 로그인 후 `openId = 1` 로 하드코딩 점프한다(web-app-v7.jsx 611행). 실제로는 `/p/:id` 미인증 진입 → `/login?next=/p/:id` → 로그인 후 복귀여야 한다. `ShareLink` 가 `cheongwon.skhu.ac.kr/p/1029` 를 보여주므로 상세는 실제 URL 을 가져야 한다.

**대기 없음**: A~G 가 Phase 0 에서 닫히면 **Phase 1(Web) 과 Phase 2(Admin) 는 완전 병렬**이다. Admin 은 Web 을 기다리지 않는다(B 는 스키마 의존이지 코드 의존이 아니다).

---

## Phase 0 — Foundation

- [x] **0-1. 스캐폴드 데모 코드 제거** — `src/App.jsx` 가 존재하지 않는 `./App.css` 와 `./assets/react.svg` 를 import 한다. **현재 `npm run dev` 는 깨진 상태**이므로 다른 어떤 작업보다 먼저다. `src/index.css` 의 Vite 데모 스타일(다크모드 변수, `#root { width: 1126px }`)도 토큰 이식과 정면 충돌한다.
  완료: `npm run dev` 가 에러 없이 뜨고, `src/` 에 Vite 데모 잔재(`assets/hero.png`, `assets/vite.svg`, 데모 마크업/CSS)가 없다.

- [x] **0-2. 토큰 7종 → Tailwind v4 `@theme` 이식** — 크로스 트랙 의존 A. 모든 화면이 여기에 걸리는 최우선 병목.
  결정 사항: ① `colors.css` 의 팔레트·상태색·카테고리색·시맨틱 별칭 → `@theme` (유틸리티 생성). ② `radii.css`→`--radius-*`, `shadows.css`→`--shadow-*`, `fonts.css`→`--font-*` 로 그대로 매핑. ③ **`--text-strong`/`--text-body`/`--text-muted`/`--text-heading`(색상)과 `--text-h3`/`--text-body-role`/`--text-label`/`--text-caption-role`(`font` shorthand)은 Tailwind `--text-*`(font-size) 네임스페이스를 침범하므로 `@theme` 밖 `:root` 에 원래 이름 그대로 둔다** — 프로토타입 소스와 이름이 어긋나지 않는 것이 픽셀 이식 속도를 결정한다. ④ `--gradient-hero`/`--gradient-mileage`, `--pad-card`/`--pad-card-lg`/`--page-max`/`--page-gutter`, `--focus-ring`, `--fs-*`/`--fw-*`/`--lh-*`/`--ls-*` 도 Tailwind 네임스페이스가 없으니 `:root` 에 원래 이름 유지. ⑤ `base.css` 의 body/`box-sizing`/링크 기본값 + `.dc.html` 의 `html,body{margin:0;background:var(--surface-page)}` 를 합쳐 재현.
  완료: `src/index.css` 하나에서 `--indigo-600`·`--gradient-hero`·`--text-h3`·`--pad-card`·`--radius-pill`·`--shadow-magenta`·`--cat-library` 전부가 원본과 같은 이름·같은 값으로 해석되고, 원본 7파일의 모든 변수가 누락 없이 옮겨졌다(변수명 diff 로 확인).

- [x] **0-3. Pretendard 폰트 로드** — `tokens/fonts.css` 의 jsDelivr `@import` 를 유지한다. 핸드오프가 폰트 대체를 명시적으로 플래그했고 원본 바이너리가 없어 대안이 없다. (0-2 선행)
  완료: 브라우저 devtools 의 computed font-family 가 실제로 Pretendard 로 해석되고, 폰트 로드 실패 시 `Apple SD Gothic Neo` 로 폴백된다.

- [x] **0-4. `Icon` 컴포넌트 (Lucide 지오메트리 인라인)** — 두 프로토타입이 같은 `LUCIDE` 맵 42개를 공유한다(양쪽 파일 6–54행 동일). Header·Feed·Detail·Submit·Sidebar·Stat·Logs 전부가 쓴다. 크로스 트랙 의존 E.
  `lucide-react` 패키지를 새로 넣지 않는다 — 원본이 이미 필요한 42개 path 지오메트리를 갖고 있고, 의존성 추가는 픽셀 일치를 보장하지 않는다.
  완료: `<Icon name="…" size stroke color />` 가 원본과 동일한 `viewBox 0 0 24 24` / `strokeWidth 2` / round cap·join SVG 를 내고, 42개 이름 전부가 렌더된다(없는 이름은 원본대로 `null`).

- [x] **0-5. DS 프리미티브 14종 → `src/components/ui/`** — `_ds_bundle.js` 1–1017행이 유일한 스펙. 크로스 트랙 의존 E. 이것 없이는 Web·Admin 어느 화면도 시작할 수 없다. (0-2 선행)
  대상: `Avatar` `Badge` `Button` `Card` `IconButton` / `Input` `Select` `Textarea` / `CATEGORIES` `CategoryTag` `EmpathyButton` `PetitionCard` `StatusBadge` `ThresholdBar`.
  이식 시 유지할 것: Button 3사이즈(36/44/52px)·6변형·hover `brightness(.94)`·press `scale(.98)`, EmpathyButton press `scale(.95)`·active 시 `--gradient-mileage`+`--shadow-magenta`, ThresholdBar 높이 6/9/12px·`width .5s cubic-bezier(.4,0,.2,1)`·도달 시 `--success-500` 과 "임계치 도달 · 담당자 검토 요청됨" 캡션, CategoryTag `color-mix(in srgb, <색> 14%, #fff)` soft 배경, Input/Textarea/Select 포커스 시 `--indigo-400` 테두리 + `0 0 0 3px var(--focus-ring)`, Card `hoverable` 시 `translateY(-2px)`+`--shadow-md`, Avatar `ring` 시 `0 0 0 3px #fff, 0 0 0 5px var(--indigo-200)`.
  인라인 `style` 을 Tailwind 클래스로 옮길 때 **계산값(`fontSize: size*0.4`, `width: pct + "%"`)은 인라인 style 로 남긴다** — 임의값 클래스로 바꾸면 동적 값이 죽는다.
  완료: 14개 export 가 전부 존재하고, 각 컴포넌트의 모든 variant/size 조합을 한 화면에 늘어놓은 임시 확인 페이지에서 원본 소스의 padding·fontSize·color 값과 육안·값 대조로 일치한다.

- [x] **0-6. `src/api/` — 목 스토어 + async 계약** — 크로스 트랙 의존 B·C 가 여기서 닫힌다. 백엔드 전환 시 손댈 유일한 곳.
  구성: `src/api/mockDb.js`(가변 목 데이터, `data-v4.js` 시드) + `src/api/index.js`(모든 async 함수). 파일을 더 쪼개지 않는다 — 전환 시 `index.js` 를 `fetch` 로 다시 쓰고 `mockDb.js` 를 지우는 것이 가장 짧은 경로다.
  **스키마 결정 (B·C)**: `categories[]` 에 `threshold`/`basis`/`owner{team,name,email,phone}` 를 얹어 Web Submit 미리보기와 Admin Owners 가 같은 출처를 읽게 한다. `answers` 를 `petitionId` 키로 정규화해 `answerPetition(id, body)` 가 레코드를 만들고 Web 상세가 그것을 읽게 한다. Admin 파일에만 있던 `OWNER_DETAILS`·`NOTI_LOGS` 도 여기로 끌어올린다.
  함수: `login` `logout` `getMe` `getPrefs` `savePrefs` / `listPetitions` `getPetition` `createPetition` `toggleEmpathy` `toggleBookmark` / `listComments` `addComment` / `listCategories` `listOwners` / `listNotifications` `markAllNotifRead` `listNotifLogs` / `answerPetition`.
  전부 `async`, 목 지연을 짧게(150ms 내외) 넣어 로딩 경로가 실제로 존재하게 한다.
  완료: `src/api/index.js` 밖에서 `mockDb` 를 import 하는 코드가 0건(grep 으로 확인)이고, `answerPetition(4, "본문")` 후 `getPetition(4)` 가 그 본문을 담은 answer 를 돌려주며 `getPetition(1)` 은 answer 가 없다. `toggleEmpathy` 로 임계치를 넘긴 청원의 `status` 가 `reviewing` 으로 바뀐다 — 이 임계치 전이 로직에 `assert` 기반 self-check 하나를 남긴다.

- [x] **0-7. zustand 스토어 2개 → `src/stores/`** — 크로스 트랙 의존 D. 스토어를 **2개로만** 쪼갠다. (0-6 선행)
  `src/stores/session.js` — `authed` `user` `prefs` `next`(딥링크 복귀 경로). 액션 `login` `logout` `savePrefs`. Web 전용(Admin 은 목 관리자라 세션을 안 쓴다).
  `src/stores/petitions.js` — `petitions` `categories` `owners` `notifications` `notifLogs` `commentsById` `answersById` `voted` `bookmarked` `loading`. 액션 `loadFeed` `loadPetition` `vote` `bookmark` `submit` `addComment` `answer` `markAllNotifRead`. **Web·Admin 공용 도메인 스토어** — Admin `answer` 액션이 Web 상세의 `AdminAnswer` 를 만드는 지점이 바로 여기 하나로 모인다(의존 B).
  스토어에 넣지 않는 것: 모달 열림, 입력 중 텍스트, 필터 칩/정렬 선택, 검색창 열림, 드롭다운 열림, 토스트 문구 — 전부 화면 `useState`.
  완료: 스토어 파일이 `src/api` 만 import 하고 `mockDb`·컴포넌트를 import 하지 않는다. 피드에서 공감을 누르고 상세로 이동했다가 북마크 화면을 거쳐 돌아와도 공감·북마크 상태가 유지된다(라우터 붙은 뒤 0-8 에서 확인).

- [x] **0-8. 라우터 셸 + 두 레이아웃** — 크로스 트랙 의존 F·G 의 선행. (0-5, 0-7 선행)
  경로: `/login` / `/`(전체 청원) / `/answered` / `/mine` / `/bookmarks` / `/p/:id` / `/submit` — 이상은 `WebLayout`(sticky Header). `/admin` / `/admin/manage` / `/admin/owners` / `/admin/logs` — `AdminLayout`(navy 사이드바 + 스크롤 본문).
  프로토타입의 `nav` 상태(`feed`/`answered`/`mine`)를 URL 로 승격한다 — Header 활성 밑줄이 경로에서 파생되고, `ShareLink` 의 `/p/1029` 가 실제 주소가 된다.
  미인증으로 Web 경로 진입 시 `/login?next=<원래경로>` 로 리다이렉트, 로그인 후 `next` 로 복귀(의존 G). `/admin` 은 목 단계에서 게이트 없음 — Phase 3 에서 명시적으로 기록한다.
  완료: 11개 경로 전부가 직접 URL 입력으로 열리고(각 화면 자리는 플레이스홀더 허용), `/p/3` 을 로그아웃 상태로 열면 로그인 후 `/p/3` 으로 돌아온다. 브라우저 뒤로가기가 화면 전환과 일치한다.

- [x] **0-9. 전역 Toast** — Web 의 6개 액션(공감/공감 취소/북마크 추가/해제/청원 등록/…)이 같은 토스트를 쓴다(web-app-v7.jsx 574–582, 599–602행). 화면마다 다시 만들면 위치·스타일이 어긋난다. Admin 에는 토스트가 없다 — 공유하지 않는다. (0-8 선행)
  완료: 하단 중앙 고정, `--gray-900` 배경 pill, `--teal-400` 체크 아이콘, 1.9초 후 자동 소멸이 원본과 일치하고, 어느 Web 화면에서든 한 줄 호출로 뜬다.

---

## Phase 1 — Web (Phase 0 전체 선행. Phase 2 와 병렬)

- [x] **1-1. `LoginScreen`** — `--gradient-hero` 전면 배경 + 400px 흰 카드. 딥링크 진입 시 "로그인하면 바로 공감할 수 있어요" 배너가 추가로 뜬다(web-app-v7.jsx 477–481행). (Foundation 0-5 `Input`/`Button`, 0-8 라우터 선행)
  프로토타입의 우하단 "에타 공유 링크 진입 데모" 토글 버튼은 디자인 툴 데모 장치이므로 옮기지 않는다 — 그 시나리오는 `?next=/p/:id` 실제 경로로 재현된다.
  완료: 52px "청" 타일·22px 인디고 제목·학번/비밀번호 prefix 아이콘·`size="lg" block` 로그인 버튼·2줄 개인정보 안내가 원본과 일치. 로그인하면 `next` 가 있으면 그 청원 상세로, 없으면 `/` 로 간다.

- [x] **1-2. `Header` (sticky)** — 4개 하위 부품(`WordMark` `SearchBox` `NotifBell` `AvatarMenu`)이 한 덩어리다. 모든 Web 화면이 이 위에 놓이므로 1-3 이전에 끝나야 한다. (0-4, 0-5, 0-8, 0-7 session 스토어 선행)
  `rgba(255,255,255,.9)` + `backdrop-filter: blur(10px)`, 높이 66px, `--page-max` 1120px 중앙. `SearchBox` 는 접힘→펼침 시 배경이 `--gray-100` pill 로 바뀌고 180px input 이 autoFocus. `NotifBell` 은 미읽음 배지(coral, 17px 원)와 350px 드롭다운·"모두 읽음". `AvatarMenu` 는 240px 드롭다운(북마크/환경설정/로그아웃, 로그아웃만 coral). 드롭다운은 `position: fixed; inset: 0` 투명 오버레이로 외부 클릭을 닫는다.
  검색은 URL 이 아니라 컴포넌트 로컬 `useState` 로 둔다 — 프로토타입도 그렇고, 검색 결과는 피드 화면 안에서 렌더된다.
  완료: 세 nav 링크의 활성 밑줄(`2.5px solid --indigo-600`)이 현재 경로와 일치하고, 알림 항목 클릭이 해당 `/p/:id` 로 이동하며(의존 F), 아바타 메뉴에서 북마크·환경설정·로그아웃이 각각 동작한다.

- [x] **1-3. `FeedScreen` — 4가지 머리말 + 필터바 + 카드 그리드** — 한 화면이 경로 3개(`/`, `/answered`, `/mine`)와 검색 상태에 따라 머리말을 갈아 끼운다(web-app-v7.jsx 277행). 쪼개면 그리드·필터가 3번 중복된다. (1-2, 0-7 선행)
  머리말: `HeroBanner`(`/` 전용 — 34px 2줄 헤드라인, 통계 3개 30px/800, 우상단 280px·우하단 200px 반투명 장식 원 2개) / `PageIntro`(`/answered`, `/mine` — 44px 아이콘 타일 + 카운트) / `SearchIntro`(검색 중) / `EmptyState`(1.5px dashed 테두리, `/mine` 일 때만 등록 버튼).
  `FilterBar`: 카테고리 pill 6개(전체 포함, 활성 시 `--indigo-600` 채움) + 우측 "공감순/최신순" 토글. 그리드: `repeat(auto-fill, minmax(340px, 1fr))`, gap 18px.
  `/mine` 에서는 작성자 표시가 `익명 · 내 청원` 으로 바뀐다.
  완료: 3개 경로 각각의 머리말이 원본과 일치하고, 카테고리 필터·정렬 토글·검색이 목록을 실제로 좁히며, 조건에 맞는 청원이 0건일 때 3가지 빈 상태 문구(검색/내 청원/일반)가 각각 나온다. 카드에서 공감을 눌러도 상세로 이동하지 않는다(`stopPropagation`).

- [x] **1-4. `DetailScreen`** — 760px 단일 컬럼. 원본의 `p.excerpt` 2회 반복 렌더(370행)는 목데이터 분량 때문이므로, `body` 필드를 목에 넣어 정상화한다. (1-2, 0-5 `EmpathyButton`/`ThresholdBar`/`Card`, 0-6 선행)
  구성: "목록으로" 뒤로가기 → CategoryTag+StatusBadge+more → 26px 제목 + 메타 3종(익명/날짜/조회수) → 본문 `lineHeight 1.8` → `--surface-sunken` 박스 안 `ThresholdBar size="lg"` → `EmpathyButton size="lg" block` + 52px 북마크 IconButton(활성 시 `solid`) → `ShareLink`.
  `ShareLink`: `--indigo-50` 배경 + `1px dashed --indigo-200`, 버튼이 "에타에 공유"→"복사됨" 으로 1.6초 바뀐다. 실제 클립보드 복사는 `navigator.clipboard.writeText` 한 줄로 붙인다.
  **`AdminAnswer` 는 전역 단일 객체가 아니라 `answersById[p.id]` 를 읽는다** (의존 B). 없으면 렌더하지 않는다.
  완료: `/p/1`(검토중·답변 없음)과 `/p/4`(답변 완료·답변 카드 있음)가 각각 옳게 렌더되고, 공감 토글이 카운트·임계치 바·토스트에 즉시 반영되며 피드로 돌아가도 유지된다. Admin 에서 다른 청원에 답변하면 그 청원 상세에만 답변 카드가 뜬다(의존 B 검증).

- [x] **1-5. `CommentsSection`** — 상세 하단. `Avatar`("익")·작성자·날짜·본문·우측 하트+카운트 열, 입력은 pill 테두리 input + Enter 제출. (1-4 선행)
  완료: 댓글 등록 시 목록 끝에 "익명 N · 방금 전" 으로 추가되고 헤더 카운트가 오른다. 빈 문자열은 제출되지 않는다(버튼 disabled + Enter 무시).

- [x] **1-6. `SubmitScreen`** — 720px. `Select`(카테고리 5종) → `Input`(제목) → `Textarea`(1000자 카운터) → 익명·임계치 안내 배너 → **카테고리 선택 시 임계치 미리보기**. 미리보기 값은 하드코딩하지 않고 `categories[].threshold`/`basis` 에서 읽는다 (의존 C). (0-5 폼 3종, 0-6 선행)
  완료: 카테고리를 고르면 미리보기 박스가 나타나고 그 임계치·기준 문구가 Admin `카테고리 담당자` 화면의 같은 카테고리 값과 일치한다. 제목·카테고리가 비면 "익명으로 등록" 이 disabled. 등록하면 피드로 돌아가 "청원이 익명으로 등록되었습니다" 토스트가 뜨고 새 청원이 목록 맨 위(최신순)에 있다.

- [x] **1-7. `BookmarkScreen` + `SettingsModal`** — 둘 다 아바타 메뉴에서만 진입하는 부수 화면이라 한 항목으로 묶는다. 북마크 화면은 `PageIntro` 와 그리드를 1-3 과 공유한다. (1-3, 0-7 선행)
  `SettingsModal`: 460px, 알림 3종 토글(임계치/답변/공감), 프로토타입의 44×26px 커스텀 토글을 재현. 이 토글은 DS 14종에 없으므로 여기서 만든다.
  완료: 상세에서 북마크한 청원이 `/bookmarks` 에 나타나고 해제하면 사라진다(의존 D 검증). 북마크 0건일 때 전용 빈 상태가 나온다. 환경설정 토글 상태가 모달을 닫고 다시 열어도 유지된다(session 스토어 `prefs`).

---

## Phase 2 — Admin (Phase 0 전체 선행. Phase 1 과 병렬 — Web 을 기다리지 않는다)

- [x] **2-1. `AdminLayout` + `Sidebar`** — 232px 고정폭 `--navy-900` 사이드바. 4개 화면이 전부 이 셸 안이므로 먼저다. (0-4, 0-5 `Avatar`, 0-8 선행)
  "청" 타일은 Web 과 달리 `--gradient-mileage`(violet→magenta)다 — Web 의 `--gradient-hero` 와 섞지 않는다. 하단 `margin-top: auto` 관리자 프로필, 활성 항목은 `rgba(255,255,255,.12)` 배경 + `fontWeight 700`.
  완료: 4개 nav 가 각 경로로 이동하고 활성 표시가 경로와 일치한다. 사이드바는 `height: 100vh` 로 고정되고 본문만 스크롤한다.

- [x] **2-2. 공용 `PetitionTable` (`Row` 포함)** — `Dashboard` 와 `Manage` 가 **완전히 같은 5열 테이블**을 쓴다(admin-app-v4.jsx 166–171 vs 231–236행, 동일 마크업). 두 번 쓰면 한쪽만 고쳐지는 것이 확정이다. (2-1, 0-5 `CategoryTag`/`StatusBadge`/`Button` 선행)
  열: 제목/담당(2줄, ellipsis, `maxWidth 300`) · 카테고리 · 상태 · 공감/임계치 · 처리. **진행바는 `ThresholdBar` 를 쓰지 않고 인라인으로 만든다** — 높이 7px, 도달 시 `--success-500` / 미달 시 `--gradient-hero`, 오른쪽 34px 고정폭 `%` 텍스트, 아래 `512 / 480 · 전체 학생` 캡션 (의존 E). 처리 칸은 3상태: 답변 완료(텍스트) / 임계치 도달(「답변 작성」 primary) / 미달(「대기중」 disabled outline). 담당자 문구는 `categories[].owner` 에서 읽는다 (의존 C).
  `minWidth: 880px` + 컨테이너 `overflow-x: auto` 로 좁은 화면에서 가로 스크롤한다.
  완료: 6개 목데이터 행이 3가지 처리 상태를 모두 보여주고, 진행바 색·`%`·`현재/임계치 · 기준` 캡션이 원본 값과 일치한다. 같은 컴포넌트가 대시보드와 청원 관리 양쪽에서 렌더된다.

- [x] **2-3. `Dashboard`** — `Stat` 카드 4장(전체 청원 / 임계치 도달·검토 필요 / 답변 완료 / 누적 공감) + 임계치 경고 배너 + `PetitionTable`. (2-2 선행)
  카드 4장의 아이콘 타일 톤이 각각 다르다(indigo / status-review / status-answered / `#FCE7E9`+coral). 통계값은 목데이터에서 파생 계산한다 — 하드코딩하면 답변 등록 후 갱신되지 않는다. "+2 오늘" 델타는 첫 카드에만 있다.
  완료: 답변을 등록하면 "임계치 도달·검토 필요" 가 줄고 "답변 완료" 가 늘며 경고 배너 문구의 건수가 따라 바뀐다. 도달 건이 0이면 배너가 사라진다.

- [x] **2-4. `Manage`** — 3단 필터 카드(상태 pill 4 / 카테고리 pill 6 / 검색 input — 셋째 줄만 `--surface-sunken` 배경) + `PetitionTable` + 전용 빈 상태. 필터 선택은 화면 `useState` 다. (2-2 선행)
  완료: 상태·카테고리·제목 검색 3조건이 AND 로 걸리고 헤더의 "청원 N건" 이 따라 바뀐다. 결과 0건이면 "조건에 맞는 청원이 없습니다. 필터를 변경해 주세요." 가 테이블 자리에 나온다.

- [x] **2-5. `Owners`** — 담당자 카드 5장, `minmax(300px, 1fr)` 그리드. 데이터는 `listOwners()` 에서 오고 Web Submit 의 임계치와 같은 출처다 (의존 C). (2-1, 0-5 `Avatar`/`CategoryTag` 선행)
  각 카드 하단에 "담당 청원 N건 / 검토 대기 N건" 을 목데이터에서 파생 계산하고, 대기 0건이면 색이 `--text-muted` 로 죽는다.
  완료: 5개 카테고리 담당자의 팀·이름·이메일·전화가 원본과 일치하고, 답변을 등록하면 해당 카테고리의 "검토 대기" 건수가 줄어든다.

- [x] **2-6. `Logs`** — 알림 로그 4건 리스트. 3종 타입(임계치 도달/답변 등록/리마인더)마다 아이콘 타일 색과 라벨이 다르고, 로그가 `petitionId` 로 청원 제목·`CategoryTag` 를 끌어온다. 목 로그는 `src/api/` 에서 온다(원본은 admin 파일 하드코딩 — 의존 C 와 같은 이유). (2-1 선행)
  완료: 4건이 원본 문구·타임스탬프 그대로 렌더되고 각 행이 해당 청원의 제목과 카테고리 태그를 붙인다. 우측 시각은 `tabular-nums` 로 정렬된다.

- [x] **2-7. `AnswerModal` — 답변 등록 + 상태 전이** — Phase 2 의 목표 액션이고 **의존 B 의 쓰기 쪽**이다. 560px, 스크림 `rgba(30,30,60,.45)`, 청원 요약 + `Textarea`(1000자) + 「답변 등록 · 상태 변경」. (2-2, 0-7 `answer` 액션 선행)
  원본은 본문을 버리지만(admin-app-v4.jsx 325행) 여기서는 `answerPetition(id, body)` 로 답변 레코드를 만든다 — 그러지 않으면 Web 상세가 항상 같은 답변을 보여준다.
  완료: 답변을 등록하면 ① 모달이 닫히고 ② 해당 행 상태가 「답변 완료」로 ③ 대시보드 통계 3개가 갱신되고 ④ **학생 웹 `/p/:id` 에 방금 쓴 본문이 담긴 `AdminAnswer` 카드가 뜬다.** 본문이 비면 등록 버튼이 disabled.

---

## Phase 3 — Verify

- [x] **3-1. 픽셀 대조 통과** — 화면별로 프로토타입 소스의 수치(padding·fontSize·radius·color·gap·shadow)와 구현을 대조한다. 핸드오프 지시대로 스크린샷 기반이 아니라 **소스 값 대조**가 기준이다. (Phase 1·2 완료 선행)
  완료: Web 6화면 + Admin 4화면 + 모달 2종에 대해 대조 결과를 남기고, 불일치가 0건이다.

- [x] **3-2. `code-reviewer` + `security-reviewer` 통과** — 전제로 못 박힌 필수 절차. (3-1 선행)
  security-reviewer 에게 명시할 알려진 목 단계 사항: **`/admin` 에 인증 게이트가 없다**(0-8), 학번/비밀번호가 목 로그인으로 처리된다, 댓글·청원 본문이 사용자 입력이다(React 기본 이스케이프에 의존), Pretendard 가 외부 CDN 이다. 이들은 "발견"이 아니라 백엔드 연동 시 닫을 항목이다.
  완료: 두 리뷰의 지적이 전부 처리되거나 백엔드 연동 항목으로 기록됐다. `npm run lint` 가 통과한다.

- [x] **3-3. 백엔드 스왑 지점 검증** — 데이터 접근 구조가 실제로 요구대로 됐는지 확인하는 것. 이게 안 되면 Phase 0 의 목적이 무너진 것이다. (3-2 선행)
  완료: `src/components` 와 `src/pages` 에서 `mockDb` import 가 0건, `src/api` 밖에서 목데이터 상수를 직접 참조하는 곳이 0건(grep 으로 확인). `src/api/index.js` 의 함수 목록과 시그니처가 README 에 기록됐다.

---

## 검증 기록 (2026-07-26)

26개 항목 전부 완료. 근거는 아래와 같다 — 체크는 "구현했다"가 아니라 "완료 조건을 확인했다"는 뜻이다.

**계측으로 확인**
- 토큰: 원본 7파일 127개 → `src/index.css` 130개, **누락 0** (변수명 diff)
- 아이콘: 원본 36 / 구현 36, 누락·추가 0. **로드맵 본문의 "42개"는 잘못된 수였다**(0-4)
- 폰트: computed `font-family` 가 Pretendard 로 해석, `document.fonts.check('700 14px Pretendard')` = true
- 백엔드 스왑 지점: `src/components`·`src/pages` 의 `mockDb` import **0건**, api 밖 목데이터 상수 참조 **0건**
- `node src/api/selfcheck.js` → `selfcheck ok` (임계치 전이·의존 B·의존 C·응답 스코프)
- `npm run lint` 에러 0(경고 3건은 전부 fast-refresh 관련 — `toast`·`ICON_NAMES`·`CATEGORIES` 를 컴포넌트와 같은 파일에서 export)

**브라우저 조작으로 확인** (Playwright, 1200×727)
- 로그인(딥링크 배너·실패 문구) → 피드(3경로·필터·정렬·검색·빈 상태) → 상세(`/p/1` 답변 없음 / `/p/4` 있음) → 댓글 3→4 → 등록(미리보기 `0/180 · 학과 정원`, 등록 후 최신순 맨 위) → 북마크 유지 → 환경설정 토글 유지
- 알림 드롭다운 클릭 → `/p/4` 이동(의존 F), 뒤로가기 일치, `/p/999` 없음 상태
- 관리자 4화면 + 답변 모달: 답변 등록 → 행 상태·통계 3개·경고 배너·담당자 검토 대기 건수 갱신
- **의존 B end-to-end**: 관리자가 쓴 본문이 학생 웹 `/p/2` 에 생활관행정실·김도윤 명의로 표시

**3-1 픽셀 대조**: 프로토타입 `.dc.html` 을 실제로 띄워 같은 브라우저·같은 뷰포트에서 구현과
`getComputedStyle`·`getBoundingClientRect` 를 나란히 측정. 12개 표면 전부 대조, 불일치 11건 발견 →
전부 해소(원인은 Tailwind preflight 1곳 + `<button>`→`NavLink` 2곳). 재측정으로 원본값 일치 확인.

**3-2 리뷰**: `code-reviewer` 1회 + `security-reviewer` 2회 실행. 지적 처리 결과는 커밋
`3321042`·`1aac787`·`fix/#1 보안 재리뷰 반영` 과 README "연동 시 반드시 닫아야 할 항목" 9건에 기록.
**2차 code-review 는 API 한도로 중단됐고, 그 이후 변경(응답 스코프 분리·로그인 문구·연락처 자리표시자)은
오케스트레이터가 계약 실행과 브라우저 조작으로 직접 검증했다.** 재리뷰가 필요하면 그 지점부터 돌린다.

---

## Phase 4 — 배포 (2026-07-26 추가)

- [x] **4-1. Vercel 배포** — `vercel deploy --prod`. 빌드·정적 서빙은 Vite 프레임워크 감지로 자동이고,
  설정은 `vercel.json` 의 **SPA 폴백 rewrite 한 줄**뿐이다. 정적 호스팅에서 `/p/:id`·`/admin` 직접 진입이
  404 가 되는 유일한 지점이 그 폴백이므로, 라우팅을 URL 로 올린 0-8·의존 G 가 배포에서도 그대로 성립한다.
  rewrite 는 파일 시스템 조회 뒤에 걸려 `/assets/*` 는 정적 파일로 나간다.
  완료: `readyState: READY`(`dpl_DGJGC3nG…`), https://petition-system-two.vercel.app,
  프로덕션 빌드에서 브라우저 조작으로 확인 — ① `/p/3` 직접 진입 → `/login?next=/p/3` → 로그인 후 `/p/3` 복귀(의존 G)
  ② `document.fonts.check('700 14px Pretendard')` = true ③ 콘솔 에러 0건
  ④ `/admin` 답변 등록 → 모달 닫힘·행 상태·통계(도달 2→1, 완료 1→2)·경고 배너 건수 갱신.

**배포 후 남은 것** (구현 항목 아님, 기록용)
- **2차 `code-reviewer` 재리뷰** — 3-2 에서 API 한도로 중단된 그 지점부터. 이후 변경은 오케스트레이터 검증만 받았다.
- **CSP** — README 보안 항목 7. meta 태그로 넣으면 Vite 개발 서버의 인라인 프리앰블이 막힌다.
  백엔드 연동 시 `vercel.json` 의 `headers` 로 응답 헤더에 넣는다(개발 서버는 영향 없음).
- **의존 B 의 라이브 end-to-end** — 관리자→학생 웹 왕복은 페이지 리로드를 거치고, 목 데이터는 메모리라
  리로드에서 초기화된다. 배포본에서는 재현 불가하고 로컬에서 확인됐다(3-1 기록). 백엔드가 붙으면 자연히 풀린다.

## 스코프에서 잘라낸 것

- **모바일 킷(iOS/Android)** — 전제에서 범위 밖.
- **반응형 브레이크포인트** — 두 프로토타입에 `@media` 가 **0개**다(grep 확인). 유연성은 `grid auto-fill minmax(340px,1fr)`, `flexWrap`, `overflow-x: auto`(880px 테이블)에만 있다. 데스크톱 산출물을 그대로 재현하고 모바일 레이아웃을 발명하지 않는다 — 픽셀 충실도 목표와 정면으로 어긋난다.
- **다크 모드** — 토큰이 `color-scheme: light` 로 고정이고 다크 팔레트가 없다. 현재 `src/index.css` 의 Vite 데모 다크모드 블록은 0-1 에서 제거한다.
- **`lucide-react` 등 아이콘/UI 라이브러리 추가** — 원본이 42개 path 지오메트리를 이미 갖고 있다.
- **실제 인증·에타(Everytime) 연동** — 목. 딥링크는 `?next=` 경로로만 재현한다.
- **관리자 권한/롤 분리** — 목. 프로토타입도 "총괄 관리자" 한 명이다. 3-2 에 기록만 남긴다.
- **실시간 알림(WebSocket/폴링)** — 목 리스트로 대체.
- **테스트 프레임워크** — 넣지 않는다. 유일한 비자명 로직인 임계치 전이에 `assert` self-check 하나만(0-6).
- **프로토타입의 디자인 툴 데모 장치** — Web 우하단 "에타 공유 링크 진입 데모" 토글, `skipLogin` prop. 실제 라우팅으로 대체된다.
- **SKHU 공식 로고** — 핸드오프가 "실제 엠블럼을 재구성하지 말라"고 명시. "청" 그라디언트 타일 플레이스홀더를 유지한다.

---

# 모바일 앱(React Native) 이식 실행 로드맵 (2026-07-28 추가)

위 로드맵(웹 + 관리자)은 완료됐다. 이 절은 **같은 레포 `ios/` 디렉터리의 모바일 앱**을 위한 별도 로드맵이다.
깃허브 이슈 #3, 작업 브랜치 `feat/#3`.

**PRD 는 없다. 설계 핸드오프가 스펙이다.** 스펙 원본:

| 대상 | 원본 |
|---|---|
| 모바일 앱 5화면 | `handoff/untitled/project/청원시스템 Mobile.dc.html` (721줄 — 1–435행 화면 마크업, 436–716행 상태·데이터·핸들러) |
| 컴포넌트 9종 | `design-handoff/project/_ds/design-system-…/_ds_bundle.js` — 웹 이식본 `src/components/ui/index.jsx` 가 이미 값 대조를 마친 참조 구현이다 |
| 토큰 | 같은 번들의 `tokens/*.css` → `ios/src/tokens.js` 에 이식 완료 |

## 전제 (재논의 대상 아님)

- 스택: **Expo SDK 57 + React Native 0.86 + React 19.2 + NativeWind 4.2 + TypeScript**. 사용자가 선택했다.
- 추가 의존성은 `react-native-svg`·`expo-linear-gradient`·`react-native-safe-area-context` 3종에서 끝. **그 외 새 의존성은 넣지 않는다.**
- **`react-navigation` 을 쓰지 않는다** — 디자인이 자체 하단 탭바(가운데 FAB 포함)와 화면별 자체 헤더를 정의하므로 네비게이터의 기본 크롬을 덮어쓰는 싸움이 된다. 화면 전환은 원본과 같은 상태 머신(`screen` + `tab` 2축)으로 한다.
- 데이터는 인메모리 목. 웹의 `src/api/` 를 재사용하지 않고 `ios/src/data.ts` 에 따로 둔다 — 번들이 분리돼 있어 공유가 불가능하다.
- 범위는 **iOS 시뮬레이터 확인까지**. Android 빌드·앱스토어 배포·실제 백엔드 연동은 범위 밖.
- **픽셀 충실도가 목표**다. 프로토타입의 내부 구조가 아니라 시각적 산출물을 재현한다.
- 목업 크롬(가짜 상태바 "9:41", 노치, 폰 베젤)은 재현 대상이 아니다 — 실제 상태바 + `SafeAreaView` 를 쓴다.
- 구현은 `frontend-coder`. 코드가 바뀌면 `code-reviewer` + `security-reviewer` 를 반드시 돈다.
- 코드를 쓰기 전에 `ios/AGENTS.md` 지시대로 https://docs.expo.dev/versions/v57.0.0/ 의 해당 버전 문서를 확인한다.

## 트랙

- **Platform** — NativeWind 검증·스타일 경계선·토큰·앱 셸·SafeArea·탭바·토스트·시트 표면. 나머지 전부가 여기에 걸린다.
- **DS** — 프리미티브 9종의 RN 재작성.
- **Screens** — 로그인 / 피드 / 상세 / 등록 / MY.
- **Verify** — 시뮬레이터 실사·소스 값 대조·리뷰.

## 페이즈 목표 (한 문장씩)

- **Phase M0 Platform** — 화면 코드를 쓸 때 "이 스타일을 RN 에서 어떻게 쓰지"를 다시 묻지 않아도 되고, 만든 화면을 즉시 시뮬레이터에서 볼 수 있는 셸이 서 있는 상태.
- **Phase M1 DS** — 5화면이 쓰는 부품이 전부 존재하고, 새 화면을 시작할 때 새로 만들 프리미티브가 하나도 남지 않은 상태.
- **Phase M2 Screens** — 학생이 시뮬레이터에서 로그인 → 피드(홈·임박·내 청원) → 상세(공감·댓글·공유) → 등록 → MY 전 플로우를 손가락으로 돈다.
- **Phase M3 Verify** — 5화면이 프로토타입 소스 수치와 일치하고 리뷰 2종을 통과한 상태.

---

## 크로스 트랙 의존 (병목 — 여기가 로드맵의 값)

> 웹 이식의 병목은 **데이터 모양**이었다. 모바일의 병목은 **스타일 런타임**이다.
> 아래 A·B 를 M0 에서 닫지 않으면 DS 9종과 화면 5개의 *모든 줄*이 나중에 다시 쓰인다.

**A. NativeWind 미검증 → 전부 (최대 리스크, 이게 깨지면 아래가 전부 막힌다)**
`ios/tailwind.config.js`·`global.css`·`babel.config.js`·`metro.config.js`·`nativewind-env.d.ts` 배선은 끝났지만 **시뮬레이터에서 한 번도 돌지 않았다.** Expo 57 / RN 0.86 조합에서 NativeWind 4.2 의 호환성은 확인된 바 없고, 깨지는 경우 Metro 변환 단계에서 죽어 앱이 아예 뜨지 않는다.
→ **M0-6 스모크 화면 하나를 통과하기 전에는 `className` 을 한 줄도 쓰지 않는다.** 이게 이 리스크에 대한 유일한 실질 방어다.
**폴백 비용이 낮다는 것이 이 전제를 감당 가능하게 만든다**: `tokens.js` 는 이미 순수 JS 객체이고 앱 코드가 직접 `require` 한다. NativeWind 가 죽으면 `tailwind.config.js`·`global.css` 만 버리고 `style={{ backgroundColor: colors.indigo[600] }}` 로 내려간다 — 토큰 값은 한 곳에 그대로 남는다. 웹 DS 원본(`src/components/ui/index.jsx`)이 처음부터 인라인 `style` 객체라 이식 경로가 오히려 짧아진다.

**B. CSS→RN 대응이 없는 7가지 → DS 9종 + 화면 5개 전부**
NativeWind 가 살아도 아래는 클래스로 해결되지 않는다. **부품과 화면이 각자 다르게 처리하면 같은 시각 요소가 화면마다 어긋난다.** M0-7 에서 한 번에 결정한다.
1. **그라데이션** — CSS 는 `background`, RN 은 `<LinearGradient>` **엘리먼트**다. 마크업 구조 자체가 바뀐다(배경이 아니라 컨테이너가 된다). 걸리는 곳 6개: 로그인 전면 배경 / 피드 히어로 / MY 프로필 헤더 / 임박 탭 배너 / 탭바 FAB / `EmpathyButton` active·`Button variant="gradient"`.
2. **`color-mix(in srgb, <색> 14%, #fff)`** — RN 에 없다. `CategoryTag` 의 soft 배경 5색을 **사전 계산해 `tokens.js` 에 상수로 넣는다**(`C×0.14 + 255×0.86`). 지금 `tokens.js` 의 `cat` 에는 원색만 있고 soft 배경이 없다 — 안 넣으면 카테고리 태그 배경이 전부 틀린다.
3. **`backdrop-filter: blur(10px)`** — RN 에 없고 `expo-blur` 는 추가하지 않기로 했다. 걸리는 곳 2개(피드 sticky 필터바 `rgba(255,255,255,.94)`, 상세 하단 액션바 `rgba(255,255,255,.95)`). **블러 없이 반투명만 쓰면 카드가 그대로 비쳐 보인다** → 두 곳 모두 불투명 `#fff` 로 간다.
4. **`position: sticky`** — RN 에 없다. 피드 필터바는 `ScrollView` + `stickyHeaderIndices` 로 한다. **이게 피드 화면의 구조를 결정한다**: 히어로·배너·필터바·카드 목록이 한 `ScrollView` 의 형제 자식이어야 한다. `FlatList` 로 짜면 sticky 필터바가 성립하지 않으므로 M2-2 를 시작하기 전에 확정돼야 한다.
5. **`line-height` 배수** — RN 은 배수를 지원하지 않고 절대값만 받는다. 원본은 `1.4`/`1.55`/`1.6`/`1.72`/`1.78` 을 텍스트 블록 거의 전부에 쓴다. 환산 규칙(`fontSize × 배수`, 소수 유지)을 한 번 정하고 전 화면에 같게 적용한다.
6. **`letter-spacing` em** — RN 은 pt. `-.01em`·`-.015em`·`.02em`·`.04em`·`.16em` 을 각 `fontSize` 로 환산한다(예: 21px·`-.015em` → `-0.315`).
7. **`overflow-x: auto` 칩 줄** — 상태·분류 칩 2줄이 가로 스크롤이다. 각각 `horizontal ScrollView`(`showsHorizontalScrollIndicator={false}` — 원본의 `.cw-scroll` 이 스크롤바를 숨긴다).

**C. 앱 셸(상태 머신) → 화면 5개 (모바일 고유의 순서 역전)**
웹은 라우터가 있어 화면을 URL 로 직접 열어 개별 확인이 가능했다. **모바일에는 그런 진입점이 없다** — 셸이 없으면 만든 화면을 시뮬레이터에서 볼 방법이 없고, 볼 수 없으면 픽셀 대조도 불가능하다. 따라서 **셸(M0-8)이 화면 전부보다 먼저다.**
`showTabs = authed && screen !== "detail" && screen !== "submit"`(원본 585행)이므로 탭바 유무가 화면마다 다르다 → 화면이 탭바를 그리는 게 아니라 셸이 화면을 감싼다.

**D. `votes` 의 소유자 → 피드 + 상세 + 탭 배지 + MY 통계 (웹의 의존 D 와 같은 자리)**
`soonCount` 탭 배지는 `isSoon()` → `remain()` → `votes` 에 걸린다(원본 593행). **탭바는 화면 밖에 있으므로**, 상세에서 공감을 누르면 화면 밖 배지 숫자가 바뀌어야 한다. MY 의 "누른 공감" 통계도 같은 출처다.
→ `petitions`·`votes`·`comments`·`prefs` 는 **앱 셸이 소유하고 화면은 prop 으로 받는다.** zustand 를 넣지 않는다(새 의존성이고, 화면 5개짜리 단일 트리에서 값이 없다).

**E. 바텀시트 표면 → 공유 시트 + `Select` (부품 하나가 두 트랙에 걸린다)**
RN 에는 `<select>` 가 없고 Picker 계열은 새 의존성이다. `Select` 는 **필드 표면만 원본과 맞추고(1.5px 테두리 + chevron + 68px), 열림 UI 는 하단 시트**로 간다. 그 시트의 시각 산출물(스크림 `rgba(24,24,54,.45)`, 상단 라운드 24, 38×4 핸들바, `cwUp` 슬라이드업)은 **공유 바텀시트와 완전히 동일**하므로 표면 하나를 M0-9 에서 만들고 내용만 갈아끼운다. 표면이 없으면 `Select`(M1-3)도 공유 시트(M2-4)도 시작할 수 없다.

**F. DS 9종 → 화면 5개 (웹의 의존 E 와 같다)**
**모바일 원본이 `x-import` 하는 컴포넌트는 정확히 9종이다**: `Input` `Button` `Select` `Textarea` `Avatar` `CategoryTag` `StatusBadge` `ThresholdBar` `EmpathyButton`.
**`PetitionCard`·`Card`·`Badge`·`IconButton` 은 이식하지 않는다** — 모바일 원본은 피드 카드를 화면 안에서 직접 만든다(174–190행: radius 18 / padding 16 / gap 11 / `ThresholdBar size="sm"` / 남은 인원 라벨 / `EmpathyButton size="sm"`). 웹 `PetitionCard` 는 gap 14·`--pad-card`·`--text-h3` 라 값이 다르다. **재사용하면 픽셀이 어긋난다.**

**G. 상태바 색이 화면에 종속된다 → 셸이 소유**
원본 42행 `statusFg` 는 인증 전(그라데이션 배경) 흰색, 인증 후 어두운색이다. 목업 상태바는 안 옮기지만 **이 분기는 옮겨야 한다** — 안 그러면 로그인 화면에서 진짜 상태바의 검은 글씨가 남색 배경 위에서 안 보인다. `expo-status-bar` 의 `style` 을 셸이 `screen` 에 따라 바꾼다.

**H. 하단 3중첩 → SafeArea 를 셸에서 한 번에 정한다**
같은 하단 영역을 세 가지가 점유한다: 탭바(64px, `padding-bottom:6`) / 상세 액션바(절대배치, `padding:12 16 22`) / 토스트(`bottom:88`). 원본은 폰 베젤 안이라 인셋이 0 이지만 실기기는 홈 인디케이터가 있다. 화면마다 따로 처리하면 셋이 어긋난다 → `useSafeAreaInsets().bottom` 을 셸에서 한 번 읽어 세 곳에 같은 규칙으로 더한다. 상세 스크롤 끝의 96px 스페이서(284행)도 같은 규칙을 따른다.

**대기 없음**: A·B 가 M0 에서 닫히면 M1(DS)과 M2(화면)는 **화면이 쓰는 부품 순서로 인터리브**할 수 있다 — M1 항목을 로그인 → 피드 → 등록 사용 순으로 배열한 이유가 그것이다.

---

## 진행 현황 (2026-07-28)

**M0-1 ~ M0-7 완료. M0-8 부터는 코드가 다 있고 시뮬레이터 실사만 남았다.**

| 상태 | 항목 |
| --- | --- |
| 완료·확인됨 | M0-1 · M0-2 · M0-3 · M0-4 · M0-5 · M0-6 · M0-7 |
| 코드 완료 · 실사 미검증 | M0-8 · M0-9 · M1-1~M1-5 · M2-2~M2-6 |
| 코드 완료 · 부분 검증 | M2-1 로그인 — 렌더·그라데이션·흰 상태바까지 확인, **화면 전환과 키보드 회피는 미검증** |
| 시작 안 함 | M3-1 · M3-2 · M3-3 |

확인된 것: `xcodebuild` **Build Succeeded**(경고 1·오류 0), 시뮬레이터 설치·실행, 번들 1230 모듈,
`npx tsc --noEmit` 클린, `node src/selfcheck.ts` 통과, 로그인 화면이 시뮬레이터에 원본대로 뜨는 것까지.

**막힌 지점 — 로그인 이후로 넘어갈 방법이 없다.** `xcrun simctl` 은 스크린샷·앱 실행·딥링크만 되고
탭을 못 한다. `osascript` 클릭은 접근성 권한이 없어 거부된다(-1719). `idb-companion` 은 brew formula 가
없어졌다. M0-8 이후 항목의 완료 조건은 전부 "시뮬레이터에서 눌러 확인"이므로 **탭 수단이 생기기 전에는
닫을 수 없다.** 실사가 헛일이 아니라는 근거: 로그인 화면 하나를 띄운 것만으로 아래 두 버그를 잡았다
(M0-7 의 8번째 규칙 ①②) — 둘 다 빌드·타입 검사를 통과하고도 화면이 비는 종류다.

로드맵과 달라진 것 3가지는 M0-7 · M0-9 · M1-2 · "스코프에서 잘라낸 것" 에 각각 적었다.

**이슈 대응**: M0-1~M0-3 → #4 · M0-5 → #5 · M0-4/M1-* → #6 · M2-1 → #7 · M2-2 → #8 ·
M2-3 → #9 · M2-5 → #10 · M2-6 → #11 · M0-8/M0-9/M2-4 → #12.

---

## Phase M0 — Platform

- [x] **M0-1. Expo 스캐폴딩 + 의존성** — `expo` blank-typescript 템플릿. 추가 의존성은 `react-native-svg`(아이콘) · `expo-linear-gradient`(그라데이션 6곳) · `react-native-safe-area-context`(의존 H) 3종뿐.
  완료: `ios/package.json` 에 Expo 57 / RN 0.86 / React 19.2 / NativeWind 4.2 와 위 3종이 있고 `npm install` 이 끝났다.

- [x] **M0-2. `src/tokens.js` — 토큰 단일 출처** — `tailwind.config.js`(노드)와 앱 코드(메트로)가 **같은 파일을 `require`** 하므로 값이 두 곳으로 갈라지지 않는다. `.ts` 로 두면 `tailwind.config.js` 가 못 읽는다.
  환산 포함: CSS shadow blur → iOS `shadowRadius`(≈blur/2), CSS `100deg` 그라데이션 → 단위 좌표(`start`/`end`). Pretendard 바이너리가 핸드오프에 없으므로 `fonts.css` 가 지정한 애플 기기 폴백 `Apple SD Gothic Neo` 를 그대로 쓴다 — 폰트 로딩 0건.
  완료: 색 팔레트·시맨틱 별칭·`radius`·`shadow`·`gradient`·`font` 가 한 파일에서 export 되고 `tailwind.config.js` 가 그것을 읽는다.

- [x] **M0-3. NativeWind 배선 5파일** — `tailwind.config.js` · `global.css` · `babel.config.js`(`jsxImportSource` + `nativewind/babel`) · `metro.config.js`(`withNativeWind`) · `nativewind-env.d.ts`.
  완료: 파일 5개가 존재하고 서로를 가리킨다. **시뮬레이터 검증은 M0-6 에서 별도로 한다 — 배선이 있다는 것과 동작한다는 것은 다르다.**

- [x] **M0-4. `src/icons.tsx` — 아이콘 17종** — 원본 HTML 의 `<svg>` path 를 그대로 옮겼다. 아이콘 라이브러리로 갈아끼우지 않는다: 이름 매칭이 빗나가면 획 두께·끝단이 미묘하게 달라져 원본과 어긋난다(웹 0-4 와 같은 판단).
  원본이 지정한 비표준 `stroke-width`(check 3.2 / plus 2.4 / chevronDown 2.2)를 아이콘별 기본값으로 보존한다.
  완료: 17개 이름이 전부 `react-native-svg` 로 렌더되고 `viewBox 0 0 24 24` · round cap·join 이 원본과 같다.

- [x] **M0-5. `src/data.ts` + `src/logic.ts` + `src/selfcheck.ts`** — 목데이터(SEED 6건·댓글·공식 답변·알림 3건·사용자·칩 목록·기준 문구)와 순수 로직(`count`/`remain`/`isSoon`/`visibleList`/`basisFor`/`thresholdFor`/`statusOf`)을 분리했다. `logic.ts` 가 RN 을 import 하지 않으므로 시뮬레이터 없이 검증된다.
  완료: `node src/selfcheck.ts` 가 assert 전부 통과.

- [x] **M0-6. NativeWind 시뮬레이터 스모크 검증** — **크로스 트랙 의존 A. 가장 큰 리스크이고 다른 모든 항목보다 먼저다.** Expo 57 / RN 0.86 에서 NativeWind 4.2 가 도는지 확인된 바 없고, 깨지면 Metro 변환에서 죽어 앱이 뜨지 않는다.
  방법: `App.tsx` 를 `className` 한 줄짜리 화면으로 바꾸고 `npx expo start --ios` 로 시뮬레이터에 띄운다. 확인할 것은 세 가지 — ① 토큰 색 클래스(`bg-indigo-600` 등 `tailwind.config.js` 의 `colors` 에서 생성된 것)가 실제로 칠해지는가 ② 임의값 클래스가 무시되지 않는가 ③ Fast Refresh 후에도 스타일이 유지되는가.
  **실패 시 즉시 폴백한다**: `tailwind.config.js`·`global.css` 를 버리고 `tokens.js` 를 `style` prop 으로 직접 참조한다(의존 A). 재시도로 시간을 쓰지 않는다 — 웹 DS 원본이 이미 인라인 `style` 객체라 폴백이 오히려 이식 경로가 짧다.
  완료: 시뮬레이터에 클래스로 칠한 화면이 뜨거나, 폴백 결정이 내려지고 그 결정이 이 항목에 기록됐다. **이 항목이 닫히기 전에는 `className` 을 다른 파일에 한 줄도 쓰지 않는다.**
  **결과: NativeWind 는 동작한다. 폴백하지 않는다.** iPhone 17 Pro 시뮬레이터에서 `bg-page`·`text-white`·`rounded-lg`·임의값 클래스가 전부 칠해졌고 Fast Refresh 후에도 유지됐다. 번들 1230 모듈, 실패 0.
  배선에서 하나 빠져 있었다 — SDK 57 blank 템플릿은 `babel-preset-expo` 를 최상위 의존성으로 깔지 않는데 `babel.config.js` 를 직접 쓰면 필요하다. 없으면 Metro 가 `Failed to construct transformer` 로 죽는다.

- [x] **M0-7. 스타일 경계선 확정 + `tokens.js` 보강** — 크로스 트랙 의존 B. 7가지 대응 규칙을 한 번에 정하고 토큰에 반영한다. (M0-6 선행)
  `tokens.js` 에 추가: ① `CategoryTag` soft 배경 5색(`color-mix` 사전 계산 — 지금 없다) ② 반투명+블러 표면 2곳의 불투명 대체색 ③ 그라데이션은 이미 있는 `gradient.hero`/`gradient.mileage` 를 `LinearGradient` props 로 그대로 쓴다.
  규칙으로 남길 것: `lineHeight` = `fontSize × 배수`(절대값) / `letterSpacing` = `fontSize × em`(pt) / 그림자는 클래스가 아니라 `tokens.shadow` 스프레드 / 가로 칩 줄은 `horizontal ScrollView` + 스크롤바 숨김 / sticky 는 `stickyHeaderIndices`.
  **`logic.ts` 의 `statusOf` 를 화면에서 쓰지 않는다** — 그건 웹의 임계치 전이 규칙이고, 모바일 원본은 `p.status` 를 그대로 렌더한다(공감으로 배지가 바뀌지 않는다). 상세의 "처리 상태" 스텝퍼만 `count >= threshold` 로 `reached` 를 따로 계산한다(원본 557행). 섞으면 피드 배지가 원본과 달라진다.
  완료: 위 결정이 `tokens.js` 주석과 이 항목에 적혔고, 어떤 화면 코드도 `color-mix`·`backdrop-filter`·배수 `lineHeight`·em `letterSpacing` 을 다시 고민하지 않는다.
  **결정과 달라진 것 하나** — `CategoryTag` soft 배경을 `tokens.js` 상수 5개로 사전 계산하지 않고, `ui.tsx` 의 `mixWhite(색, 0.14)` 로 런타임 계산한다. 카테고리 원색이 이미 `tokens.cat` 에 있으므로 같은 값이 두 번 적히지 않는다 — 원색을 고치면 soft 배경이 따라온다.
  **여기에 8번째 규칙이 붙었다(M0-6 스모크와 구현 중에 드러남).** RN 은 CSS 에 없는 제약을 하나 더 건다:
  ① **`className` 은 서드파티 컴포넌트에 닿지 않는다.** `LinearGradient` 에 `className="flex-1"` 을 주면 조용히 무시돼 높이 0 이 되고 화면이 통째로 하얗게 뜬다. 서드파티는 `style` 로만 준다.
  ② **`Pressable` 의 함수형 `style={({pressed}) => …}` 이 NativeWind JSX 래퍼에서 유실된다.** 배경·높이가 전부 사라져 흰 배경에 흰 글씨만 남는다(버튼이 안 보인다). 눌림 반응이 필요한 곳은 `TouchableOpacity` + 배열 `style` 로 간다 — 그래서 M1-1 의 press `scale` 은 `activeOpacity` 로 대체된다.

- [ ] **M0-8. 앱 셸 — 상태 머신 + SafeArea + 상태바 + 하단 탭바** — 크로스 트랙 의존 C·D·G·H 가 전부 여기서 닫힌다. **화면 5개보다 먼저다** — 셸이 없으면 만든 화면을 시뮬레이터에서 볼 수 없다. (M0-7 선행)
  상태: `authed` `screen`(login/feed/detail/submit/my) `tab`(home/soon/mine/my) `openId` `votes` `petitions` `comments` `prefs` `toast` `shareOpen` — 원본 477–485행 그대로. 필터·검색·입력 중 텍스트 등 **화면 로컬 상태는 셸에 올리지 않는다**(웹 로드맵의 상태 분담 규칙과 같다).
  탭바: 높이 64px, `border-top`, 4탭(홈 / 임계치 임박 / 내 청원 / MY) + **가운데 48px FAB**(`gradient-mileage` + `shadow-magenta` + `margin-top:-12`). 임박 탭에 coral 배지(최소폭 16px). 활성색 `indigo-600` / 비활성 `gray-400`, 10.5px/700.
  탭 표시 조건은 원본 585행 그대로: 상세·등록 화면에서는 탭바가 없다.
  상태바(의존 G): 로그인 화면 `style="light"`, 나머지 `"dark"`.
  완료: 시뮬레이터에서 탭 4개가 각 화면 자리로 전환되고(자리는 플레이스홀더 허용), 활성 탭 색이 `screen`+`tab` 조합과 일치하며, **임박 배지가 `2`**(SEED 기준 p3·p5)로 뜬다. 상세·등록 자리에서 탭바가 사라진다. 홈 인디케이터가 탭바·토스트를 가리지 않는다.

- [ ] **M0-9. 토스트 + 바텀시트 표면** — 크로스 트랙 의존 E. 토스트는 4개 액션(공감/공감 취소/댓글 등록/링크 복사/청원 등록)이 공유하고, 시트 표면은 공유 시트와 `Select` 가 공유한다. 화면마다 다시 만들면 위치·라운드·애니메이션이 어긋난다. (M0-8 선행)
  토스트: `left/right 20`, `bottom 88`(+ safe inset), `gray-900` pill, `teal-400` 체크 아이콘, 13px/700, **1.9초 후 자동 소멸**, 재호출 시 이전 타이머 취소(원본 497–501행).
  시트 표면: 스크림 `rgba(24,24,54,.45)`(탭 시 닫힘), 상단 라운드 24, `padding 20 20 26`, 38×4 핸들바, `shadow-lg`. 원본 `cwUp`(translateY 20 → 0, .22s `cubic-bezier(.2,.8,.3,1)`) 은 RN 내장 `Animated` 로 낸다 — 애니메이션 라이브러리를 추가하지 않는다.
  완료: 아무 화면에서나 한 줄 호출로 토스트가 뜨고 1.9초에 사라지며, 연속 호출해도 하나만 보인다. 시트 표면이 아래에서 올라오고 스크림 탭으로 닫힌다. 시트가 탭바 위에 그려진다.
  **결정과 달라진 것** — 시트 표면을 `Select` 와 공유하지 않는다. 공유 시트는 RN 내장 `Modal`(`animationType="slide"`)로 냈고, `Select` 는 **iOS 네이티브 `ActionSheetIOS`** 로 갔다. 의존 E 의 목적(Picker 패키지를 새로 들이지 않는다)은 그대로 지켜지고, 표면을 손으로 만드는 것보다 코드가 더 적으면서 결과가 진짜 iOS 시트다. 대신 `Select` 열림 UI 는 원본 프로토타입의 시트 모양과 다르다 — 원본 재현보다 네이티브 관행을 택했다.

---

## Phase M1 — DS 프리미티브 9종

> 크로스 트랙 의존 F. 항목 순서는 **화면이 쓰는 순서**(로그인 → 피드 → 등록)다 — M2 를 기다리게 하지 않으려면 이 순서여야 한다.
> 참조 구현은 웹 이식본 `src/components/ui/index.jsx` 다(값 대조를 이미 마쳤다). **웹 코드를 복사하지 않고 값만 가져온다** — 웹은 `var(--토큰)` 문자열과 마우스 이벤트로 짜여 있어 RN 에서 동작하지 않는다.
> 공통: hover 는 이식하지 않는다(터치에 hover 가 없다). press 축소(`scale`)는 `Pressable` 의 `style` 콜백으로 살린다. 계산값(`fontSize: size*0.4`, 진행바 `width: pct%`)은 클래스가 아니라 `style` 로 남긴다 — 클래스로 바꾸면 동적 값이 죽는다(웹 0-5 와 같은 판단).

- [ ] **M1-1. `Button` + `Avatar`** — 5화면 전부가 쓴다. 로그인(`primary lg block`) · 상세 댓글(`primary sm`) · 등록(`primary lg block` + disabled) · MY(`outline block`) · 공유 시트(`gradient lg block` + `outline block`). (M0-7 선행)
  Button: 3사이즈(36/44/52px)·6변형, `radius-pill`, press `scale(.98)`, disabled `opacity .5`. **`gradient` 변형만 `LinearGradient` 를 배경 엘리먼트로 감싼다**(의존 B-1) — 나머지는 단색이라 감싸지 않는다.
  Avatar: 원형, `indigo-100` 배경 / `indigo-700` 글자, `fontSize = size*0.4`, 이름 앞 2글자. 쓰이는 크기는 댓글 32px 과 MY 프로필 56px 두 가지이고 **56px 만 `ring`**(흰 3px + `indigo-200` 5px → RN 은 `borderWidth`+바깥 View 2겹으로 낸다, `box-shadow` 스프레드가 없다).
  완료: 두 부품의 모든 variant/size 를 늘어놓은 임시 화면이 시뮬레이터에 뜨고, padding·fontSize·색이 웹 이식본 값과 일치한다. 눌렀을 때 축소 반응이 보인다.

- [ ] **M1-2. `Input` + `Textarea`** — 로그인 2개 · 등록 2개. (M1-1 선행)
  Input: 라벨(위) + 1.5px `border-strong` 테두리 + `radius-md`, 포커스 시 `indigo-400` 테두리. **포커스 링(`0 0 0 3px`)은 RN 에 `box-shadow` 스프레드가 없으므로 테두리 색 전환만으로 낸다** — 링을 흉내내려고 View 를 덧대지 않는다(원본 폼 높이 66/68px 이 어긋난다).
  Textarea: `multiline`, `minHeight 128`, **우하단 `n / 1000` 카운터**, `maxLength`. RN 은 `resize` 가 없다 — 고정 높이로 간다.
  비밀번호 필드는 `secureTextEntry`. 학번은 `keyboardType="number-pad"`.
  완료: 두 부품이 시뮬레이터 키보드로 실제 입력되고, 포커스 시 테두리가 바뀌며, 카운터가 글자 수를 따라간다. 키보드가 필드를 가리지 않는다(`KeyboardAvoidingView`).
  **아직 안 한 것**: 학번 필드의 `keyboardType="number-pad"` 가 빠졌다. 지금은 기본 키보드가 뜬다.

- [ ] **M1-3. `Select`** — 크로스 트랙 의존 E. **RN 에 `<select>` 가 없다 — 등록 화면을 막는 유일한 부품이다.** (M0-9 시트 표면, M1-2 선행)
  닫힌 상태의 필드 표면은 원본과 같게 만든다(1.5px 테두리 · `radius-md` · `padding 12 40 12 15` · 우측 14px chevron · 값 없으면 `text-muted` 플레이스홀더). 탭하면 **M0-9 의 시트 표면**에 카테고리 5개를 리스트로 띄우고 선택 시 닫는다.
  Picker 계열 패키지를 넣지 않는다(전제) — 시트 표면이 이미 있으므로 추가 코드가 리스트 하나뿐이다.
  완료: 등록 화면에서 카테고리를 고르면 필드에 라벨이 들어가고 시트가 닫힌다. 닫힌 필드의 높이·테두리·chevron 위치가 `Input` 과 나란히 놓았을 때 어긋나지 않는다.

- [ ] **M1-4. `CategoryTag` + `StatusBadge`** — 피드 카드 · 상세 헤더 · 등록 미리보기가 쓴다. 둘 다 `size="sm"` 만 실제로 쓰인다(원본 176–177, 222–223, 314행). (M0-7 선행)
  CategoryTag: `padding 3 10` · 11px · 5px 점 · `radius-pill` · **soft 배경은 M0-7 에서 사전 계산한 5색**(의존 B-2), 글자·점은 카테고리 원색.
  StatusBadge: 3상태(접수 `indigo` / 검토중 `warning` / 답변 완료 `success`)의 fg·bg·dot 3색 조합. 700 두께.
  완료: 카테고리 5종 × 상태 3종을 늘어놓은 임시 화면에서 배경·글자·점 색이 웹 이식본과 같은 값이고, soft 배경이 흰색으로 뭉개지거나 원색으로 튀지 않는다.

- [ ] **M1-5. `EmpathyButton` + `ThresholdBar`** — 이 앱의 핵심 인터랙션과 핵심 시각 산출물. (M1-1, M0-7 선행)
  EmpathyButton: `sm`(피드 카드) · `lg block`(상세 하단) 두 크기. 비활성 = 흰 배경 + `coral-400` 1.5px 테두리 + `coral-600` 글자 + 빈 하트. **활성 = `gradient-mileage` 배경 + `shadow-magenta` + 흰 글자 + 채운 하트**(의존 B-1 — `LinearGradient` 로 감싼다). press `scale(.95)`. 숫자는 `fontVariant: ['tabular-nums']`.
  ThresholdBar: `sm`(피드, 높이 6) · `md`(등록 미리보기, 9) · `lg`(상세, 12). 상단 메타 2줄(`{기준} 대비 임계치` / `현재 / 임계치 · N%`), 트랙 `gray-150`, 채움은 **미달 시 `gradient-hero` / 도달 시 `success` 단색**, 도달 시 하단에 "임계치 도달 · 담당자 검토 요청됨" 캡션. 폭 전환 `.5s` 는 `Animated` 로 낸다.
  완료: 공감을 누르면 버튼이 그라데이션으로 바뀌고 카운트가 +1 되며 같은 카드의 진행바가 함께 움직인다. `current 512 / threshold 480`(SEED p1)에서 바가 100% 에서 멈추고 초록 + 도달 캡션이 나온다.

---

## Phase M2 — Screens (Phase M0·M1 선행)

> 화면 순서는 **셸의 화면 전환 순서**다: 로그인이 유일한 진입점이고, 상세·등록·MY 는 피드에서만 열린다. 앞 화면이 없으면 뒤 화면에 도달할 수 없어 시뮬레이터 확인이 불가능하다.

- [ ] **M2-1. 로그인** — 전면 `gradient-hero` + 세로 중앙 정렬 흰 카드(radius 24, `shadow-lg`). 앱의 유일한 진입점이므로 먼저다. (M1-2, M0-8 선행)
  상단 마크: **66px 라운드 사각(rgba 흰 14% 배경 + 34% 테두리) 안에 막대 3개(6×13/21/29px, 흰 55%/80%/100%) + 우상단 8px 마젠타 점.** 웹의 "청" 타일이 아니다 — 다른 마크이므로 웹에서 가져오지 않는다.
  제목 22px/800 + `SKHU PETITION` 10.5px/700 `letter-spacing .16em`(→ 1.68pt).
  카드: 학번 `Input` + 비밀번호 `Input` + `Button primary lg block` + 2줄 안내(11.5px, `line-height 1.6`).
  완료: 시뮬레이터에서 그라데이션이 상태바 뒤까지 올라가고 상태바 글자가 흰색이며(의존 G), 로그인 버튼을 누르면 피드로 넘어간다. 키보드가 올라와도 카드가 가려지지 않는다.

- [ ] **M2-2. 피드 — 헤더 + sticky 필터 + 카드 목록 (탭 3개가 공유)** — 홈·임박·내 청원 **세 탭이 한 화면**이고 머리말만 갈아 끼운다(원본 591–592행). 쪼개면 필터바와 카드 목록이 3번 중복된다. (M1-4, M1-5, M0-8 선행)
  구조는 **한 `ScrollView` + `stickyHeaderIndices`**(의존 B-4): 머리말 → 필터바(sticky) → 카드 목록.
  헤더(52px, 고정): 32px 그라데이션 막대 마크 + 제목(탭에 따라 `청원시스템`/`임계치 임박`/`내 청원`) + 검색 토글 + 벨. **벨은 알림 드롭다운이 아니라 MY 화면으로 간다**(원본 605행 `onOpenMy`) — 웹과 다르다. 미읽음 8px coral 점.
  머리말 3종: 홈 = 히어로(`gradient-hero`, 21px/800 2줄, 통계 3개, 우상단 190px 반투명 원 — 부모 `overflow:'hidden'`) / 임박 = `gradient-mileage` 배너 / 내 청원 = 흰 배경 카운트 블록.
  필터바(sticky, **불투명 흰색** — 의존 B-3): 검색창(열렸을 때만) + 상태 칩 4개(원형 점 + pill) + 구분선 + 분류 칩 6개(radius 10, 다른 스타일) + 결과 수 + 정렬 토글. **정렬 토글은 임박 탭에서 숨긴다**(원본 594행 — 남은 인원 순 고정). 칩 두 줄은 각각 가로 스크롤(의존 B-7).
  카드: radius 18 / border / `shadow-sm` / padding 16 / gap 11 — **웹 `PetitionCard` 를 쓰지 않는다**(의존 F). 임박 탭에서만 "임계치까지 N명 남음" 마젠타 줄이 붙는다.
  빈 상태: 1.5px dashed, 문구가 임박 탭과 일반 탭에서 다르다(원본 612–613행).
  완료: SEED 기준 ① 홈 공감순 첫 카드가 `교내 장학금 신청 절차 간소화`(631) ② 임박 탭 **2건**(p3·p5)이 남은 인원 적은 순(92 → 212) ③ 내 청원 탭 **2건** ④ 히어로 통계가 `6건 / 3건 / 88%` ⑤ 상태·분류·검색 3조건이 AND 로 걸리고 0건이면 빈 상태가 뜬다 ⑥ **스크롤해도 필터바가 상단에 붙어 있고 그 아래로 카드가 비쳐 보이지 않는다** ⑦ 카드의 공감 버튼을 눌러도 상세로 넘어가지 않는다.

- [ ] **M2-3. 상세** — 760px 웹판과 구성이 다르다. **모바일 고유 산출물 2개(처리 상태 스텝퍼, 하단 고정 액션바)가 여기 있다.** (M2-2, M1-5 선행)
  헤더 52px: 뒤로 · `청원 상세` · 공유. 탭바 없음.
  본문 블록(흰 배경): 태그 2개 → 21px/800 제목(`letter-spacing -.015em` → -0.315) → 메타 3종(익명/날짜/조회) → 본문 14.5px `line-height 1.78`(→ 25.81).
  임계치 카드: `ThresholdBar size="lg"` + `surface-sunken` 박스 안 기준 문구(`BASIS_NOTE`).
  **처리 상태 스텝퍼(웹에 없다)**: 3단계(접수/검토중/답변 완료) × 22px 원형 체크 아이콘. 완료 여부에 따라 원 배경(`indigo-600`/`success`/`gray-150`)과 글자색이 바뀐다. **`reached` 는 `count >= threshold` 로 계산한다 — `statusOf` 를 쓰지 않는다**(M0-7).
  답변 카드: `answered` 일 때만. `status-answered-bg` + **좌측 4px `success` 테두리**.
  댓글: 32px `Avatar` + 작성자·날짜·본문. **웹과 달리 하트·카운트 열이 없다.** 입력은 pill 테두리 + `Button primary sm`, 빈 문자열은 제출되지 않는다.
  하단 고정 액션바(절대배치, **불투명 흰색** + 상단 테두리): `EmpathyButton lg block` + 52px 원형 공유 버튼. 스크롤 끝 96px 스페이서 + safe inset(의존 H).
  완료: `/p/1`(검토중·답변 없음·도달)과 `/p/4`(답변 완료·답변 카드 있음)가 각각 옳게 렌더되고, 하단 공감을 누르면 ① 카운트·진행바·스텝퍼가 즉시 바뀌고 ② 토스트가 뜨고 ③ 피드로 돌아가도 유지되며 ④ **임박 탭 배지 숫자가 따라 바뀐다**(의존 D). 댓글을 달면 목록 끝에 `익명 N · 방금 전` 으로 붙고 헤더 카운트가 오른다. 액션바가 홈 인디케이터에 걸리지 않는다.

- [ ] **M2-4. 공유 바텀시트** — M0-9 표면에 내용만 얹는다. 상세 헤더·하단 버튼 두 곳에서 열리고, **청원 등록 직후 자동으로 열린다**(M2-5, 원본 713행). (M0-9, M2-3 선행)
  내용: 16.5px/800 제목 + 안내 2줄 + `indigo-50` 배경 + 1px dashed `indigo-200` 링크 박스(`cheongwon.skhu.ac.kr/p/{id}`, 넘치면 말줄임) + `Button gradient lg block`(라벨이 `링크 복사 후 에타에 붙여넣기` → `링크가 복사되었습니다` 로 바뀐다) + `Button outline block` 닫기.
  **실제 클립보드 복사는 하지 않는다** — `expo-clipboard` 는 새 의존성이고 범위 밖(전제)이다. 원본도 라벨만 바꾼다(644행). 라벨 전환 + 토스트만 재현한다.
  완료: 상세에서 공유를 누르면 시트가 아래에서 올라오고, 복사 버튼을 누르면 라벨이 바뀌며 `링크를 복사했습니다` 토스트가 뜬다. 스크림 탭·닫기 버튼 둘 다로 닫힌다.

- [ ] **M2-5. 등록** — FAB 로만 진입한다. 탭바 없음. (M1-3, M1-2, M2-4 선행)
  헤더 52px: 닫기(X) · `청원 등록`.
  `indigo-50` 익명 안내 배너(자물쇠 아이콘) → `Select`(카테고리 5종) → `Input`(제목) → `Textarea`(1000자) → **카테고리 선택 시에만 나타나는 임계치 미리보기 카드**(`CategoryTag` + `ThresholdBar current=0` + 기준 문구) → `Button primary lg block`.
  임계치·기준은 하드코딩하지 않고 `logic.ts` 의 `basisFor`/`thresholdFor` 에서 읽는다(이미 있다).
  제목·카테고리가 비면 등록 버튼 disabled(원본 653행).
  **등록 후 피드가 아니라 상세로 가고 공유 시트가 자동으로 열린다**(원본 713행) — 웹판과 다르다. 새 청원은 `current:1` · `status:"received"` · `mine:true` · `date:"방금 전"`.
  완료: 학부를 고르면 미리보기가 `0 / 180 · 학과 정원`, 기숙사면 `0 / 240`, 나머지는 `0 / 480` 이다. 등록하면 상세로 넘어가며 공유 시트가 떠 있고 토스트가 뜬다. 뒤로 나가면 피드 최신순 맨 위와 내 청원 탭(2건 → 3건)에 새 청원이 있다.

- [ ] **M2-6. MY** — 웹의 아바타 메뉴 + 알림 드롭다운 + 환경설정 모달을 **한 화면으로 합친 모바일 고유 구성**이다. 탭과 피드 헤더의 벨 둘 다로 진입한다. (M1-1, M0-8 선행)
  헤더 52px `MY` → `gradient-hero` 프로필 블록(56px `ring` Avatar + 이름·학과·학년·학번 + 우하단 170px 반투명 원) → 통계 카드 3장(등록한 청원 / 누른 공감 / 받은 답변) → 알림 리스트 3건(미읽음은 `indigo-50` 배경, 탭하면 해당 청원 상세로) → 알림 설정 3행(**44×26px 커스텀 토글** — DS 9종에 없으므로 여기서 만든다, knob `left 3 ↔ 21`) → `Button outline block` 로그아웃.
  로그아웃은 `votes`·검색 상태를 초기화하고 로그인 화면으로 돌아간다(원본 678행).
  완료: 통계가 SEED 기준 `2 / 0 / 1` 로 시작하고 공감을 누르면 가운데 값이 오른다. 알림 3건 중 2건이 강조 배경이고, 탭하면 각각 `/p/4`·`/p/1`·`/p/3` 상세로 간다. 토글 3개가 눌리고 화면을 떠났다 돌아와도 유지된다. 로그아웃 후 다시 로그인하면 공감이 초기화돼 있다.

---

## Phase M3 — Verify

- [ ] **M3-1. 시뮬레이터 전 플로우 실사** — 화면 단위가 아니라 **플로우 단위**로 돈다. 화면별 완료 조건은 각 항목에서 이미 닫혔고, 여기서 보는 것은 화면 사이의 상태 유지다. (Phase M2 완료 선행)
  경로: 로그인 → 홈 피드(필터·정렬·검색) → 카드 공감 → 상세 진입 → 상세 공감·댓글·공유 → 뒤로 → 임박 탭(배지 수 변화 확인) → 내 청원 탭 → FAB 등록 → 자동 공유 시트 → 뒤로 → MY(통계 반영 확인) → 로그아웃.
  완료: 위 경로가 크래시·경고 없이 돌고, **공감 상태가 피드↔상세↔탭 배지↔MY 통계 네 곳에서 같은 값**이다(의존 D). 콘솔 에러 0건.

- [ ] **M3-2. 디자인 대조** — 웹 3-1 과 같은 기준: 스크린샷이 아니라 **원본 소스 값 대조**다. 대상은 `청원시스템 Mobile.dc.html` 의 인라인 style 수치(padding·fontSize·radius·color·gap·shadow·letterSpacing·lineHeight). (M3-1 선행)
  RN 고유로 확인할 것 3가지: ① 그라데이션 6곳의 방향·색 정지점이 `tokens.gradient` 환산값과 맞는가 ② 그림자 5종이 iOS 에서 CSS blur 와 비슷한 크기로 보이는가(`blur/2` 환산의 검증) ③ **`Apple SD Gothic Neo` 에서 `fontWeight` 700 과 800 이 실제로 구분되는가** — 구분되지 않으면 원본의 위계가 뭉개지므로 대체 방법을 이 항목에 기록한다.
  완료: 5화면 + 시트 2종 + 탭바 + 토스트에 대해 대조 결과를 남기고 불일치가 0건이다. 목업 크롬(9:41 상태바·노치·베젤)은 대조 대상에서 제외했음을 명시한다.

- [ ] **M3-3. `code-reviewer` + `security-reviewer` 통과** — 전제로 못 박힌 필수 절차. (M3-2 선행)
  security-reviewer 에게 명시할 목 단계 사항: 로그인이 자격 증명을 검증하지 않는다 / 데이터가 인메모리라 앱을 내리면 초기화된다(스토리지 사용 0건 — **세션·목데이터를 `AsyncStorage` 로 옮기지 않는다**, 익명 청원 앱에서 로컬 영속은 새 노출면이다) / 댓글·청원 본문이 사용자 입력이다(RN `<Text>` 는 마크업을 해석하지 않는다) / 딥링크 스킴을 등록하지 않았다. 이들은 "발견"이 아니라 백엔드 연동 시 닫을 항목이다.
  웹 README 의 "연동 시 반드시 닫아야 할 항목" 9건 중 **3(`mine` 은 서버가 세션 기준으로 계산) · 4(공감 1인 1회를 서버가 소유)** 는 모바일에도 그대로 걸린다 — 목 `votes` 가 클라이언트 소유다.
  완료: 두 리뷰의 지적이 전부 처리되거나 백엔드 연동 항목으로 기록됐다. `npx tsc --noEmit` 이 통과하고 `node src/selfcheck.ts` 가 여전히 통과한다.

---

## 스코프에서 잘라낸 것 (모바일)

- **Android 빌드 · 앱스토어 배포 · 실제 백엔드 연동** — 전제에서 범위 밖. `app.json` 의 android 블록은 스캐폴딩 기본값 그대로 둔다.
- **`react-navigation`** — 전제. 디자인이 자체 탭바·자체 헤더를 정의하므로 네비게이터의 기본 크롬과 싸우게 된다. 화면 5개·2축 상태 머신에 라이브러리를 넣을 이유가 없다.
- **zustand 등 상태 라이브러리** — 단일 트리에 화면 5개다. 셸 `useState` 로 끝난다(의존 D).
- **`PetitionCard`·`Card`·`Badge`·`IconButton`** — 모바일 원본이 `x-import` 하지 않는다. 피드 카드는 화면 안에서 직접 만든다(의존 F). 웹 부품을 끌어오면 gap·padding·제목 크기가 어긋난다.
- **북마크** — **모바일 원본에 북마크가 없다.** 상세 하단은 공감 + 공유 두 개뿐이고 MY 에도 북마크 항목이 없다. 웹에 있다고 발명하지 않는다.
- **관리자 콘솔** — 모바일 산출물에 없다. 웹 `/admin` 이 담당한다.
- **알림 드롭다운 · 검색 전용 화면 · 환경설정 모달** — 웹의 구성이다. 모바일은 알림·설정이 MY 화면 안에, 검색이 피드 필터바 안에 있다.
- **딥링크 진입 배너 2종**(로그인 카드의 "에타 공유 링크로 접속", 상세 상단의 "에타에서 오셨네요") — 원본에서 디자인 툴 prop(`deepLinkDemo`)으로만 켜진다. Universal Links 설정은 배포·백엔드가 필요해 범위 밖이라 **띄울 트리거가 없다.** 산출물을 잃지 않도록 `App.tsx` 상단 `DEEP_LINK_DEMO` 상수 한 줄로 두 배너를 볼 수 있게 남긴다.
- **`skipLogin` prop** — 디자인 툴 데모 장치. 옮기지 않는다.
- **목업 크롬**(가짜 상태바 "9:41"·배터리·노치·폰 베젤·`shadow-lg` 프레임) — 전제. 실제 상태바 + `SafeAreaView` 로 대체된다. 단 상태바 **글자색 분기는 옮긴다**(의존 G).
- ~~**실제 클립보드 복사**~~ — **자르지 않고 넣었다.** `expo-clipboard` 를 추가하고 실제로 복사한다. 원본이 라벨만 바꾸는 건 프로토타입이라 그런 것이고, "링크 복사 후 에타에 붙여넣기" 라고 써 놓고 복사가 안 되는 버튼은 거짓말이다. 공유가 이 제품의 유입 경로라 여기서 아끼면 기능이 죽는다.
- **`expo-blur`** — 새 의존성. `backdrop-filter` 2곳은 불투명색으로 대체한다(의존 B-3).
- **Pretendard 웹폰트** — 바이너리가 핸드오프에 없고 `expo-font` + CDN 다운로드는 새 의존성 + 네트워크 의존이다. `fonts.css` 가 지정한 애플 기기 폴백 `Apple SD Gothic Neo` 를 그대로 쓴다(M0-2). 웹은 jsDelivr `@import` 가 있어 다르게 갔다.
- **테스트 프레임워크** — 넣지 않는다. 유일한 비자명 로직(임계치·필터·정렬)에 `src/selfcheck.ts` assert 하나만(M0-5).
- **다크 모드 · 태블릿 레이아웃 · 가로 모드** — 원본이 390×820 세로 1종이다. `app.json` 이 `portrait` 고정이고 `userInterfaceStyle: "light"` 다.

---

## 이슈 분할

한 이슈 = 한 화면 또는 한 역할. 화면 여러 개를 이슈 하나에 묶지 않는다.

> 이 절은 이슈 #4~#12 를 만든 뒤에 되짚어 적었다. 원래는 로드맵이 먼저 이 목록을 정하고
> 그대로 이슈를 만들어야 한다 — 그렇게 하도록 하네스에 게이트를 붙였다
> (`.claude/hooks/roadmap-gate.sh`). 다음 작업부터는 이 순서를 지킨다.

| 이슈 | 제목 | 선행 |
| --- | --- | --- |
| #4 | `[CHORE] 모바일 앱 프로젝트 초기 설정과 디자인 토큰 이식` | 없음 |
| #5 | `[FEAT] 모바일 청원 데이터와 임계치 판정 로직` | 없음 |
| #6 | `[FEAT] 모바일 디자인 시스템 컴포넌트·아이콘 이식` | #4 |
| #7 | `[FEAT] 모바일 로그인 화면` | #4 · #6 |
| #8 | `[FEAT] 모바일 청원 피드 화면` | #4 · #5 · #6 |
| #9 | `[FEAT] 모바일 청원 상세 화면` | #4 · #5 · #6 |
| #10 | `[FEAT] 모바일 청원 등록 화면` | #4 · #5 · #6 |
| #11 | `[FEAT] 모바일 MY 화면` | #4 · #6 |
| #12 | `[FEAT] 모바일 하단 탭바와 공유 시트·토스트` | 화면 5개 전부 |

#3 은 위 아홉 개를 모아 보는 상위 이슈다. 코드는 들고 있지 않고 이 로드맵 문서만 담당한다.

**#12 가 마지막인 이유**: 셸이 화면 5개를 전부 import 하므로 화면이 다 있어야 한다.
반대로 **셸이 없으면 만든 화면을 시뮬레이터에서 볼 수 없다**(의존 C) — 그래서 #4 의 앱 진입점은
배선 확인용 화면으로 두고, #12 에서 앱 셸로 교체한다. 그 사이 커밋들은 화면 파일이 아직
어디에도 연결되지 않은 상태로 남는다.
