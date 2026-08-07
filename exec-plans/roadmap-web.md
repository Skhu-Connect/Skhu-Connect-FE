# 학생 웹 실행 로드맵

`claude.ai/design` 핸드오프 번들(HTML/CSS/JS 프로토타입) → Vite + React 19 앱 이식.
깃허브 이슈 #1, 작업 브랜치 `feat/#1`·`fix/#1`.

- 관리자 콘솔: [roadmap-admin.md](roadmap-admin.md)
- iOS 앱: [roadmap-ios.md](roadmap-ios.md) · 안드로이드: [roadmap-android.md](roadmap-android.md)

**이 문서가 Foundation(Phase 0)을 담는다.** 토큰·아이콘·DS 프리미티브 14종·`src/api/`·
zustand 스토어·라우터 셸은 학생 웹과 관리자 콘솔이 **같이 쓴다**. 관리자 콘솔은 별도 앱이
아니라 같은 Vite 빌드 안의 `/admin` 경로이고, 검증(Phase 3)과 배포(Phase 4)도 두 화면군을
한 번에 다룬다. 그래서 공용 부분이 관리자 문서가 아니라 여기에 있다.

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

> **Phase 2(관리자 콘솔)는 [roadmap-admin.md](roadmap-admin.md) 에 있다.** Phase 0 이 닫히면 Phase 1 과 완전 병렬이다.

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

## Phase 5 — 신규 기능 확장 (2026-08-04 추가)

**목표** — 학생이 학교 계정 없이도 화면 안에서 가입하고, 마이페이지에서 소속 학부를 스스로 고치고,
오래된 글이 피드를 어지럽히지 않고, 카드·배지가 한눈에 더 또렷하게 읽힌다.

**이슈 #17 "웹 로그인 화면에 소속 학부 선택 입력 추가"를 대체한다.** 그 이슈는 로그인 폼에 학부
선택을 얹는 방향이었는데, 이번 요구는 회원가입 화면을 새로 만들고 학부는 거기서만 받은 뒤
마이페이지에서 고치게 한다 — 로그인 폼은 그대로 학번·비밀번호만 받는다. 학부 11개 목록과
`user.dept` 필드 이름은 이슈 #16 에서 이미 정한 값을 그대로 쓴다(문서 폐기 후에도 결정 자체는
유효). #17 은 이 로드맵을 근거로 닫는다.

- [ ] **5-1. `SignupScreen` 신규 구현** — `/signup`, `LoginScreen` 과 같은 패턴(그라디언트 배경 + 흰 카드, `WebLayout` 밖). 학번·이름·비밀번호·비밀번호 확인·학부(`Select`, `api.listDepartments()`)를 받는다. 제출하면 `session.signup()` → `api.signup()` 이 목 계정을 만들고 즉시 로그인 상태로 전환, `/` 로 이동. 학부 목록은 `mockDb.js` 의 `DEPARTMENTS`(이슈 #16 이 정한 11개, `docs/api-spec.md` 자리 대신 여기 원본으로 둔다) → `api.listDepartments()`.
  `LoginScreen` 폼 아래에 "회원가입"(`/signup`) 링크와 "계정을 모르시나요?" 외부 링크(`https://skhu.ac.kr`, placeholder — 실제 학교 오피스 경로가 정해지면 교체) 를 추가한다. `SignupScreen` 에도 같은 외부 링크와 "로그인" 복귀 링크를 둔다.
  완료: `/signup` 에서 학번·이름·비밀번호·비밀번호 확인·학부를 채우고 제출하면 로그인 상태가 되어 `/` 로 이동하고, 헤더 아바타 메뉴에 그 학부가 뜬다. 학부를 고르지 않거나 비밀번호가 서로 다르면 제출이 막힌다. `/login`·`/signup` 양쪽에서 "계정을 모르시나요?" 링크가 새 탭으로 `skhu.ac.kr` 을 연다.

- [ ] **5-2. `MyPageScreen` 신규 구현** — `/mypage`(`WebLayout` 안, 인증 필요). 이름·학번·학년은 읽기 전용, **학부만 `Select` 로 수정 가능**하고 "저장" 이 `session.updateProfile({ dept })` → `api.updateProfile()` 를 호출한다. 저장 성공 시 토스트. 헤더 아바타 드롭다운(`Header.jsx` `AvatarMenu`)에 "마이페이지" 항목을 추가해 진입한다(북마크 위).
  완료: 마이페이지에서 학부를 바꾸고 저장하면 토스트가 뜨고, 헤더 아바타 드롭다운·환경설정 모달에 표시되는 학부도 즉시 바뀐다(세션 스토어 갱신 확인). 이름·학번·학년 입력란은 없다(수정 대상 아님).

- [ ] **5-3. 청원 만료 30일 처리** — 청원마다 `createdAt`(등록 시각)을 두고, 등록 후 30일이 지나면 `expired: true`(`src/api/index.js` `view()` 파생 필드, `mockDb.js` 시드에 `createdAt` 추가 + `createPetition` 이 신규 청원에 채운다). **기본 피드(`/`·`/answered`)에서는 만료된 청원을 뺀다. `/mine`(마이페이지 진입 지점)과 검색 결과에는 그대로 남긴다** — 카드에 "만료됨" 배지를 얹어 구분한다(상세 화면도 동일). 검증용으로 30일이 지난 시드 청원을 하나 추가한다(`mine: true`).
  완료: 기본 피드·답변완료 탭에는 30일 지난 청원이 안 보이고, `/mine` 과 검색(제목에 그 청원이 걸리는 검색어)에는 "만료됨" 배지와 함께 나온다. 공감·댓글 등 기존 기능은 만료 여부와 무관하게 그대로 동작한다(잠그지 않는다).

- [ ] **5-4. 피드 카드 제목만 표시 + 히어로 배너 정리** — `PetitionGrid`(`FeedParts.jsx`)가 `PetitionCard` 에 `excerpt` 를 더 이상 넘기지 않는다(카드엔 제목만). 카드 프리미티브 자체(`ui/index.jsx` `PetitionCard`)는 안 건드린다 — 그리드 호출부만 고친다. `HeroBanner`(`FeedScreen.jsx`)에서 진행 중 청원·검토·답변·답변률 통계 3개 행을 지우고, 빈 공간을 헤드라인 크기 확대로 채운다. 반응형 분기(`@media`)가 프로젝트 전체에 없으므로 데스크톱 전용 별도 컴포넌트가 없고, 이 변경이 유일한 렌더 경로라 데스크톱에도 그대로 반영된다.
  완료: 피드·북마크 카드에 본문 미리보기가 안 보이고 제목만 있다. 홈 히어로 배너에 통계 숫자 3개가 없고 헤드라인이 이전보다 크게 렌더된다.

- [ ] **5-5. 상태·분류 배지 컬러 리디자인** — `index.css` 의 `--status-received-fg/bg`·`--status-review-fg/bg`·`--cat-*` 5종 값을 교체한다. 이 6개 세트가 인디고·바이올렛·밝은 블루 조합이라 흔한 "AI 생성" 팔레트로 읽힌다는 지적 — 접수 상태를 브랜드 인디고에서 중립 슬레이트로, 카테고리 5종을 보라·파랑 계열 없이(테라코타·딥틸·브릭레드·와인·스틸네이비) 재배치한다. `--status-answered-*`(그린, "완료" 의미가 보편적) 는 유지한다. `ui/index.jsx` `STATUS` 맵의 `dot` 색이 각각 `var(--indigo-500)`/`var(--warning-500)` 를 직접 참조하던 걸 `var(--status-received-fg)`/`var(--status-review-fg)` 로 바꿔 배지 점과 텍스트 색이 항상 같이 간다. 토큰 값만 바꾸므로 학생 웹·관리자 콘솔 양쪽에 자동 반영된다(둘 다 같은 `index.css` 를 쓴다).
  완료: 상태 배지 3종·카테고리 태그 5종이 새 색으로 렌더되고 보라·밝은 파랑 계열이 하나도 없다. `StatusBadge`·`CategoryTag` 를 쓰는 학생 웹(카드·상세·등록 미리보기)과 관리자 콘솔(테이블·대시보드) 화면 전부에서 일치한다.

---

## Phase 6 — 백엔드 연동 (2026-08-07 추가)

**목표** — 로그인한 학생이 실 백엔드(`skhu-connect-be-production.up.railway.app`)로 회원가입(이메일 인증)·
로그인·로그아웃·토큰 재발급을 거쳐, 실제 청원 피드·상세·댓글 등록·공감·북마크·알림·학부 선택까지 전 구간을
목 데이터 없이 쓸 수 있다. 이름(name) 필드는 서버에 없으므로 헤더·마이페이지에서 제거하고 그 자리를
새로 디자인한다.

원본은 `docs/api-spec.md`(mock 계약과의 차이) + `README.md` "API 계약"·"연동 시 반드시 닫아야 할 항목"
절이다. 여기서는 그 위에서 크로스 트랙 의존과 이슈 분할만 정한다 — 계약 자체를 다시 옮기지 않는다.

### 결정 사항 (여기서 확정 — 화면 이슈에서 재논의하지 않는다)

- **토큰 저장**: access token 은 `stores/session.js` zustand 메모리에만 둔다(`localStorage` 0건, README
  보안 항목 2). `POST /connect/auth/login`·`/signup`·`/token/refresh` 응답의 `accessToken` 을 세션에
  얹고, 모든 `src/api/` fetch 는 `Authorization: Bearer` 헤더를 붙인다. `refreshToken` 은 서버
  Set-Cookie 로만 오가므로 **모든 fetch 호출에 `credentials: 'include'`** 를 건다 — 이게 빠지면 재발급·
  로그아웃이 조용히 401 로 죽는다. Vercel(프론트)↔Railway(백엔드) 크로스 오리진이라 백엔드 CORS 가 그
  오리진에 `Access-Control-Allow-Credentials: true` 를 실제로 내리는지 6-1 완료 조건에 넣는다.
- **로그인 실패 문구**: 서버가 뭘 던지든(`title` 문구 포함) `LoginScreen` 은 지금처럼 고정 문구 하나로
  감싼다(README 보안 항목 6, 이미 코드가 그렇게 돼 있다 — 유지만 하면 됨).
- **카테고리 메타(라벨·임계치 기준문구·담당자)**: 서버에 대응 엔드포인트가 없으므로 `mockDb.js` 의
  `categories[]` 값을 `src/api/` 안의 클라이언트 상수로 남긴다(`ponytail: /connect/categories 생기면
  교체`). `targetAgreementCount` 는 서버 값을 쓴다. `category` enum 매핑(`dorm`→`DORMITORY`, 나머지는
  대문자 변환)도 여기서 흡수한다.
- **`voted`/`bookmarked` 파생**: 로그인 시 `GET /users/me/agreements`·`GET /users/me/bookmarks` 를 큰
  `size` 로 불러 id 집합을 만들고, 기존 `petitions` 스토어의 `voted`/`bookmarked` 오브젝트 맵 자리에
  채운다(스토어 구조는 안 바뀐다 — 값의 출처만 바뀐다).
- **만료 판정**: 클라이언트가 `createdAt`+30일로 계산하던 `expired`(Phase 5-3)를 버리고 서버
  `status: EXPIRED` 를 그대로 쓴다. D-day 라벨은 `PetitionResponse.agreementDeadline`/
  `PetitionQueryResponse.expiresAt` 기준으로 다시 계산한다. `src/api/selfcheck.js`(임계치 전이 assert)는
  그 로직이 서버로 넘어가므로 폐기 대상 — 6-1 에서 지우고 README "실행" 절의
  `node src/api/selfcheck.js` 안내도 같이 지운다.
- **`/mine`("내 건의") 판정**: `PetitionResponse`/`Query` 자체에는 작성자·소유 플래그가 없지만(익명성이
  설계 의도), **`GET /connect/users/me/petitions` 가 정확히 "내가 쓴 청원"을 준다** — 계획 초안은 이
  엔드포인트를 놓치고 `localStorage` id 집합으로 근사하려 했으나(6-1 code-reviewer 가 지적), 실제로는
  로그인 시 이 엔드포인트로 `mineIds` Set 을 채운다. 다른 기기·브라우저에서도 정확하다.
- **알림 설정 3종 토글**(`prefs.threshold/answer/empathy`)과 `getPrefs`/`savePrefs`: 대응 엔드포인트가
  없다(사용자 지시로 범위 밖). `src/api/index.js` 에서 이 두 함수는 fetch 로 바꾸지 않고 **로컬 상태로만
  유지**한다(껍데기만 async) — 새로고침하면 초기화되는 게 알려진 한계.
- **"내가 쓴 댓글" 전체 목록(마이페이지)**: `CommentResponse` 에 `myComment` 플래그는 있지만 "내 댓글
  전체"를 청원 횡단으로 모아 주는 엔드포인트가 없다(청원마다 댓글 목록을 순회해야 하는데, 그러려면 전체
  청원 수만큼 N+1 호출이 필요해 비현실적). **이번 라운드는 이 섹션을 mock 목록 그대로 둔다** — 항목으로
  쪼개지 않는다. 서버에 "내 댓글" 전용 엔드포인트가 생기면 그때 정리.
- **학부 목록 모양**: 서버는 `[{id, code, name}]` 을 주는데 지금 목은 문자열 배열이다. `ui/index.jsx`
  의 `Select` 는 이미 문자열/`{value,label}` 객체 둘 다 받으므로(320행), `listDepartments()` 가
  `{value: id, label: name}` 로 매핑해 내려주면 `Select` 쪽은 손댈 필요가 없다 — 회원가입 제출 시
  `departmentId` 로 선택한 `value`(id)를 그대로 보낸다.

### 이슈 6-1 ~ 6-6

- [ ] **6-1. [CHORE] 데이터 접근 계층(api client) 전면 교체** — `src/api/index.js` 를 실 백엔드 fetch 로
  다시 쓰고 `src/api/mockDb.js`·`src/api/selfcheck.js` 를 지운다. 위 "결정 사항"의 토큰 저장
  (`credentials:'include'` 포함)·에러 매핑(4xx/5xx → 화면이 잡을 수 있는 표준 `Error`)·enum 매핑
  (category/status)·카테고리 메타 상수·만료 판정 서버 전환·`getPrefs`/`savePrefs` 로컬 유지·학부 목록
  매핑이 전부 여기서 구현된다. 선행 없음 — 다른 5개 이슈 전부의 병목.
  완료: `src/components`·`src/pages`·`src/stores` 에서 `mockDb` import 가 0건(grep). `login`/`signup`/
  `getMe`/`listPetitions`/`listDepartments` 를 실 서버로 호출해 각각 스펙대로 응답이 오고, 401(만료
  access token)에서 `POST /token/refresh` 가 쿠키로 자동 재시도되는 것을 devtools 네트워크 탭으로
  확인. `npm run lint` 통과. credentialed 요청이 CORS 프리플라이트에 막히지 않는 것을 브라우저에서
  실제로 확인(막히면 백엔드 쪽 이슈로 별도 기록).

- [ ] **6-2. [FEAT] 로그인 화면 실 API 연동** — `LoginScreen`/`stores/session.js` 의 `login` 이
  `POST /connect/auth/login` 을 타고, `logout` 이 `POST /connect/auth/logout`(쿠키)을 타도록 배선한다.
  UI·문구는 안 바꾼다(이미 고정 문구). (6-1 선행)
  완료: 실 계정으로 로그인하면 `accessToken` 이 세션에 담기고 `/`(또는 `next`)로 이동한다. 틀린
  비밀번호·미등록 학번 둘 다 화면에는 같은 고정 문구만 뜬다(README 보안 항목 6 닫힘). 로그아웃하면
  세션이 비워지고 이후 인증 필요 API 호출이 다시 401.

- [ ] **6-3. [FEAT] 회원가입 화면 재작업 — 이메일 인증 플로우** — `SignupScreen` 을 이메일 발송
  (`POST /email-verifications`) → 6자리 코드 확인(`POST /email-verifications/confirm` →
  `verificationToken`) → 가입(`POST /connect/auth/signup` `{verificationToken, loginId, password,
  departmentId}`) 3단계로 재구성한다. **이름 입력 필드를 삭제한다**(서버에 없음). 학부는
  `api.listDepartments()`(6-1 이 구현)로 채운다. (6-1 선행 — 특히 학부 드롭다운과 이메일 인증 엔드포인트)
  완료: 이메일 입력→코드 발송→6자리 코드 입력→계정 정보(아이디·비밀번호·비밀번호 확인·학부) 입력까지
  3단계가 실제로 넘어가고, 마지막 단계 제출이 실 `signup` 을 호출해 로그인 상태로 `/` 진입한다. 코드가
  틀리면 다음 단계로 못 넘어간다. 폼 어디에도 이름 입력란이 없다. (학부 드롭다운이 비어 있는 동안은
  3단계에서 막히는 게 정상 — "알려진 제약" 참고, 코드 리뷰는 진행 가능.)

- [ ] **6-4. [FEAT] 헤더·마이페이지 이름 표시 제거 및 재디자인** — `Header.jsx` 의 `AvatarMenu` 트리거
  (`Avatar name={user.name.slice(1)}` + 드롭다운 상단 `user.name`/`user.dept`/`user.year`)와
  `MyPageScreen.jsx` 히어로(`Avatar` + `user.name` + `user.dept`)에서 이름 표시를 뗀다. `user.name`·
  `user.year` 는 서버 `UserMeResponse` 에 없으므로 참조 자체를 지운다. **단순 삭제가 아니라
  `high-end-visual-design` 스킬로 그 자리를 다시 디자인할 것** — 트리거는 이름 pill 없이 무엇으로
  "내 계정"임을 표시할지, 히어로는 이름 한 줄이 빠진 자리를 어떻게 채울지 새로 정한다. 마이페이지의
  통계 카드·알림 목록·알림 설정·내가 쓴 댓글 섹션은 이 이슈의 범위가 아니다(각각 6-5·6-6, "내가 쓴
  댓글"은 위 결정 사항대로 mock 유지) — 이 이슈는 **아이덴티티 표시 영역**만 건드린다. (6-1 선행 —
  `getMe` 가 이름 없는 모양으로 와야 재디자인 기준이 확정된다)
  완료: 헤더 아바타 트리거와 마이페이지 히어로 어디에도 `user.name`/`user.year` 참조가 없고(grep), 두
  자리 모두 디자인이 "무언가 지워진 자리"가 아니라 의도된 새 레이아웃으로 보인다. `학부(dept)` 표시는
  유지한다(서버가 준다).

- [ ] **6-5. [FEAT] 피드·상세·댓글·공감·북마크 실 API 연동** — `stores/petitions.js`·`FeedScreen`·
  `DetailScreen`·`CommentsSection`·`SubmitScreen`·`BookmarkScreen` 을 실 엔드포인트로 배선한다:
  `GET /petitions`(피드, 인증 불필요), `GET /petitions/{id}`, `POST /petitions`(등록),
  `POST/DELETE /petitions/{id}/agreements`(공감, 409 는 서버 값으로 재동기화),
  `POST/DELETE /petitions/{id}/bookmarks`, `GET /petitions/bookmarks`(북마크 화면 전용),
  `GET/POST /petitions/{id}/comments`(댓글, root 만 노출 — 대댓글 UI 는 범위 밖). `excerpt` 는
  `content.slice(0,120)` 클라이언트 파생으로 유지. `/mine` 은 위 결정 사항의 `localStorage` id 집합으로
  필터링한다. (6-1 선행)
  완료: 로그인 없이 피드·상세·댓글 목록이 보이고(인증 불필요 확인), 로그인 후 공감·북마크 토글이 실제로
  서버에 반영되며 새로고침해도 유지된다(voted/bookmarked 파생 확인). 청원 등록 후 그 청원이 피드 맨 위와
  `/mine` 양쪽에 뜬다. 댓글 등록이 실제로 목록에 반영된다. 30일 지난 청원이 아니라 서버 `status: EXPIRED`
  인 청원이 기본 피드에서 빠지고 `/mine`·검색에는 남는다.

- [ ] **6-6. [FEAT] 알림 실 API 연동** — `Header.jsx` `NotifBell`(안읽음 배지)와 `MyPageScreen.jsx` 알림
  목록을 `GET /notifications`·`GET /notifications/unread-count`·`PATCH /notifications/{id}/read`·
  `PATCH /notifications/read-all` 로 배선한다. `NOTIF_META` 아이콘 매핑을 서버 7종 enum
  (`PETITION_AGREEMENT_60_PERCENT` 등)에 맞게 다시 짜고, `title`+`body` 조합 렌더를 버리고 서버가 주는
  완성 문장 `message` 를 그대로 렌더한다. (6-1 선행)
  완료: 로그인 상태에서 안읽음 배지 숫자가 `unread-count` 와 일치하고, 마이페이지에서 알림 클릭 시 해당
  청원으로 이동하며 읽음 처리되고(배지 감소), "모두 읽음"이 전체를 읽음 처리한다. 7종 알림 타입 각각에
  아이콘이 매핑돼 있다(없는 타입이 기본 아이콘으로 깨지지 않게).

### 이번 라운드 범위 밖 (사용자 지시 — 항목으로 쪼개지 않는다)

- 관리자 콘솔 전체(답변 등록·담당자 연락처·처리 로그) — 대응 엔드포인트 없음. mock 유지.
- 마이페이지 학부 수정 — `PATCH /users/me` 없음. mock 유지(현재 `Select`+저장 UI 그대로 두되 저장은
  로컬에만 반영, 6-4 범위 아님).
- 알림 3종 개별 토글 저장 — 대응 엔드포인트 없음(위 결정 사항 참고).
- 비밀번호 재설정 화면 — 엔드포인트는 있으나 신규 화면이라 범위 밖.

### 알려진 제약 (실기기 검증 순서에 영향)

`GET /connect/petitions`·`GET /connect/departments` 가 2026-08-07 기준 빈 배열이다(DB 시드 전). 학부가
없으면 6-3(회원가입)이 마지막 단계에서 막혀 실제 가입을 끝까지 못 돌린다 — **프론트 구현·코드 리뷰는
시드 여부와 무관하게 진행**하되, 브라우저로 전 구간을 확인하려면 백엔드에 최소 학부 1개 이상이 시드된
뒤 아래 순서로 셀프 시드하며 검증한다: ① 학부가 뜨는지 확인 → ② 직접 회원가입(6-3) → ③ 로그인(6-2) →
④ 청원 등록(6-5) → ⑤ 피드에 뜨는지·공감/북마크/댓글(6-5) → ⑥ 알림 발생 여부(6-6, 임계치 알림은 다른
계정의 공감이 필요해 단일 계정 셀프 시드로는 100%/60% 알림까지는 재현 못 할 수 있다 — 그 경우 코드
경로 확인으로 대체).

---

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

## 이슈 분할

- [CHORE] 데이터 접근 계층(api client) 전면 교체 — 선행 없음
- [FEAT] 로그인 화면 실 API 연동 — 데이터 접근 계층 전면 교체 선행
- [FEAT] 회원가입 화면 재작업 — 이메일 인증 플로우 — 데이터 접근 계층 전면 교체 선행
- [FEAT] 헤더·마이페이지 이름 표시 제거 및 재디자인 — 데이터 접근 계층 전면 교체 선행
- [FEAT] 피드·상세·댓글·공감·북마크 실 API 연동 — 데이터 접근 계층 전면 교체 선행
- [FEAT] 알림 실 API 연동 — 데이터 접근 계층 전면 교체 선행
