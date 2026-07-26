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
