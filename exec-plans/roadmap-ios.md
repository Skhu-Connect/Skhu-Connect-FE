# iOS 앱(React Native) 실행 로드맵

`ios/` 디렉터리의 Expo 앱. 깃허브 이슈 #3, 작업 브랜치 `feat/#3` 이하.

- 웹·관리자 로드맵: [roadmap-web.md](roadmap-web.md) · [roadmap-admin.md](roadmap-admin.md)
- 안드로이드: [roadmap-android.md](roadmap-android.md) (아직 범위 밖)

웹 로드맵은 완료됐고 이 문서와 공유하는 코드는 없다 — 번들이 분리돼 있어
`src/api/` 를 재사용할 수 없고, 목데이터를 `ios/src/data.ts` 에 따로 둔다.
공유되는 것은 **디자인 토큰 값과 컴포넌트 수치**뿐이며, 웹 이식본
`src/components/ui/index.jsx` 를 값 대조가 끝난 참조 구현으로 쓴다(복사하지는 않는다).

**PRD 는 없다. 설계 핸드오프가 스펙이다.** 스펙 원본:

| 대상 | 원본 |
|---|---|
| 모바일 앱 5화면 | `handoff/untitled/project/청원시스템 Mobile.dc.html` (720줄 — 1–435행 화면 마크업, 436–716행 상태·데이터·핸들러). 이 문서가 인용하는 행 번호(585·593·713 …)가 이 파일 기준으로 일치함을 확인했다. **공개 금지 자료라 레포에 넣지 않는다** — 평소에는 디스크에 두지 않고, M3 대조를 시작할 때 사용자에게 받는다. 없다고 찾아 헤매지 말 것 |
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

- [x] **M0-7. 스타일 경계선 확정 + `tokens.js` 보강** — 크로스 트랙 의존 B. 7가지 대응 규칙을 한 번에 정하고 토큰에 반영한다. (M0-6 선행)
  `tokens.js` 에 추가: ① `CategoryTag` soft 배경 5색(`color-mix` 사전 계산 — 지금 없다) ② 반투명+블러 표면 2곳의 불투명 대체색 ③ 그라데이션은 이미 있는 `gradient.hero`/`gradient.mileage` 를 `LinearGradient` props 로 그대로 쓴다.
  규칙으로 남길 것: `lineHeight` = `fontSize × 배수`(절대값) / `letterSpacing` = `fontSize × em`(pt) / 그림자는 클래스가 아니라 `tokens.shadow` 스프레드 / 가로 칩 줄은 `horizontal ScrollView` + 스크롤바 숨김 / sticky 는 `stickyHeaderIndices`.
  **`logic.ts` 의 `statusOf` 를 화면에서 쓰지 않는다** — 그건 웹의 임계치 전이 규칙이고, 모바일 원본은 `p.status` 를 그대로 렌더한다(공감으로 배지가 바뀌지 않는다). 상세의 "처리 상태" 스텝퍼만 `count >= threshold` 로 `reached` 를 따로 계산한다(원본 557행). 섞으면 피드 배지가 원본과 달라진다.
  완료: 위 결정이 `tokens.js` 주석과 이 항목에 적혔고, 어떤 화면 코드도 `color-mix`·`backdrop-filter`·배수 `lineHeight`·em `letterSpacing` 을 다시 고민하지 않는다.

- [x] **M0-8. 앱 셸 — 상태 머신 + SafeArea + 상태바 + 하단 탭바** — 크로스 트랙 의존 C·D·G·H 가 전부 여기서 닫힌다. **화면 5개보다 먼저다** — 셸이 없으면 만든 화면을 시뮬레이터에서 볼 수 없다. (M0-7 선행)
  상태: `authed` `screen`(login/feed/detail/submit/my) `tab`(home/soon/mine/my) `openId` `votes` `petitions` `comments` `prefs` `toast` `shareOpen` — 원본 477–485행 그대로. 필터·검색·입력 중 텍스트 등 **화면 로컬 상태는 셸에 올리지 않는다**(웹 로드맵의 상태 분담 규칙과 같다).
  탭바: 높이 64px, `border-top`, 4탭(홈 / 임계치 임박 / 내 청원 / MY) + **가운데 48px FAB**(`gradient-mileage` + `shadow-magenta` + `margin-top:-12`). 임박 탭에 coral 배지(최소폭 16px). 활성색 `indigo-600` / 비활성 `gray-400`, 10.5px/700.
  탭 표시 조건은 원본 585행 그대로: 상세·등록 화면에서는 탭바가 없다.
  상태바(의존 G): 로그인 화면 `style="light"`, 나머지 `"dark"`.
  완료: 시뮬레이터에서 탭 4개가 각 화면 자리로 전환되고(자리는 플레이스홀더 허용), 활성 탭 색이 `screen`+`tab` 조합과 일치하며, **임박 배지가 `2`**(SEED 기준 p3·p5)로 뜬다. 상세·등록 자리에서 탭바가 사라진다. 홈 인디케이터가 탭바·토스트를 가리지 않는다.

- [x] **M0-9. 토스트 + 바텀시트 표면** — 크로스 트랙 의존 E. 토스트는 4개 액션(공감/공감 취소/댓글 등록/링크 복사/청원 등록)이 공유하고, 시트 표면은 공유 시트와 `Select` 가 공유한다. 화면마다 다시 만들면 위치·라운드·애니메이션이 어긋난다. (M0-8 선행)
  토스트: `left/right 20`, `bottom 88`(+ safe inset), `gray-900` pill, `teal-400` 체크 아이콘, 13px/700, **1.9초 후 자동 소멸**, 재호출 시 이전 타이머 취소(원본 497–501행).
  시트 표면: 스크림 `rgba(24,24,54,.45)`(탭 시 닫힘), 상단 라운드 24, `padding 20 20 26`, 38×4 핸들바, `shadow-lg`. 원본 `cwUp`(translateY 20 → 0, .22s `cubic-bezier(.2,.8,.3,1)`) 은 RN 내장 `Animated` 로 낸다 — 애니메이션 라이브러리를 추가하지 않는다.
  완료: 아무 화면에서나 한 줄 호출로 토스트가 뜨고 1.9초에 사라지며, 연속 호출해도 하나만 보인다. 시트 표면이 아래에서 올라오고 스크림 탭으로 닫힌다. 시트가 탭바 위에 그려진다.

---

## M0 검증 기록 (2026-07-29)

iPhone 17 시뮬레이터(iOS 26.5) · Expo 57 / RN 0.86 신아키텍처 · 디버그 빌드에 실제로 띄워 확인했다.
**여기까지 모바일 코드는 한 번도 실행된 적이 없었다** — 네이티브 빌드 성공 기록(`** BUILD SUCCEEDED **`)은
디버그 빌드에서 자바스크립트를 메트로가 실행 시점에 넘기므로 스타일 런타임이 동작한다는 증거가 아니다.

**M0-6 — NativeWind 는 산다. 폴백하지 않는다.**
`iOS Bundled 1230 modules`, 에러 0. 세 가지를 한 번에 확인했다: 화면 헤더를 `bg-card` → `bg-magenta-500`
(토큰 색 클래스, `tailwind.config.js` 의 `colors` 에서 생성), 검색 버튼에 `bg-[#22A06B]`(임의값)를 임시로
얹자 **둘 다 실제로 칠해졌고**, 그 반영이 앱 재시작 없이 로그인 상태·피드 스크롤을 유지한 채 일어났다
(= Fast Refresh 로 스타일이 유지된다). 확인 후 두 클래스는 원래대로 되돌렸다.
따라서 **`className` 사용 금지 조항은 해제된다.** 화면 5개가 이미 쓰고 있는 22곳은 그대로 둔다.

**M0-7 — 7가지 대응은 이미 코드에 있고, 위치만 기록한다.**
`color-mix` 는 `tokens.js` 상수가 아니라 `ui.tsx` 의 `mixWhite(hex, .14)` 로 계산한다 — 카테고리 5색을
따로 굳히는 것보다 짧고, `CategoryTag` 한 곳에서만 쓴다. 나머지(그라데이션 `LinearGradient`,
불투명 대체색, 절대값 `lineHeight`, pt `letterSpacing`, 가로 칩 `ScrollView`, `stickyHeaderIndices`)는
`tokens.js`·`theme.ts` 와 각 화면에 반영돼 있다.

**M0-8 — 셸은 동작한다.**
탭 4개가 각 화면으로 전환되고 활성색이 `screen`+`tab` 조합과 일치한다. **임박 배지 `2`**(p3·p5) 확인.
FAB 로 등록 화면에 들어가면 탭바가 사라지고, 상세에서도 사라진다. 로그인 화면 상태바 흰색·이후 어두운색
(의존 G). 홈 인디케이터가 탭바·토스트를 가리지 않는다. 공감 상태가 피드↔상세에서 유지된다(의존 D).

**M0-9 — 시트 표면을 실제로 하나로 만들었다 (의존 E 를 여기서 닫았다).**
검증 전에는 `ShareSheet` 가 표면을 자기 안에 인라인으로 갖고 있었고 `Select` 는 **`ActionSheetIOS`**(iOS
네이티브 액션시트)를 띄우고 있었다 — 표면이 공유되지 않았고 `Select` 는 디자인 산출물과 아예 다른 모양이었다.
`ui.tsx` 에 `Sheet`(스크림 `rgba(24,24,54,.45)` · 상단 라운드 24 · 38×4 핸들바 · safe inset)를 두고
`ShareSheet` 와 `Select` 가 같이 쓰게 바꿨다. `Sheet` 를 `shell.tsx` 가 아니라 `ui.tsx` 에 둔 이유는
`shell.tsx` 가 이미 `ui.tsx` 를 import 하기 때문이다(반대로 두면 순환 import).
확인: 카테고리 시트가 아래에서 올라오고 선택 시 닫히며 필드에 `학부` 가 들어가고 미리보기가
`0 / 180 · 0%` · `소프트웨어융합학부 정원 360명의 50% 기준 · 180명` 으로 뜬다. 공유 시트는 스크림 탭으로 닫힌다.
토스트는 `공감했습니다` 가 뜨고 2.5초 뒤 사라진다.

**검토에서 고친 것**
- `Sheet` 높이를 화면의 80% 로 묶고 내용을 `ScrollView` 에 넣었다. 묶기 전에는 큰 글씨 설정(AX5)에서
  옵션 5개만으로도 표면이 화면 밖으로 밀려 스크림도 닫기 버튼도 사라졌다 — iOS 는 `onRequestClose` 가
  오지 않으므로 강제 종료 말고는 빠져나올 길이 없었다. 옵션이 서버에서 오면 길이를 통제할 수 없으니
  소비자마다가 아니라 표면 한 곳에서 막는다.
- 제목의 `marginBottom: 4` 를 뺐다. 공유 시트 설명이 이미 `marginTop: 5` 를 갖고 있어 합쳐서 9px 로
  벌어졌다(RN 은 마진 상쇄가 없다). 제목 아래 간격은 소비자가 갖는다.

**남은 것 (M0 아님, 기록용)**
- 원본 `cwUp`(translateY 20 → 0, .22s)은 `Modal animationType="slide"` 로 대신했다. `slide` 는 스크림까지
  같이 밀어 올린다 — 원본은 스크림이 제자리에 깔리고 표면만 20px 뜬다. M3-2 픽셀 대조에서 판단한다.
- `Select` 에 명시적 "취소" 행이 없다. `ActionSheetIOS` 시절에는 있었다. 스크림 탭이 유일한 이탈 경로이고
  VoiceOver 는 스크림 라벨로 덮이지만, 디자인 산출물(`_ds_bundle.js`)이 취소 행을 갖는지 확인 후 정한다.
- 스크림 알파가 원본 `.45` 와 맞는지는 눈대중으로는 확정 못 했다. **M3-2 대조 대상**으로 넘긴다.
- `expo-clipboard` 가 의존성에 들어가 있다. 모바일 스코프 절의 "실제 클립보드 복사는 하지 않는다"와 어긋나므로
  M3 에서 유지/제거를 결정한다.

---

## Phase M1 — DS 프리미티브 9종

> 크로스 트랙 의존 F. 항목 순서는 **화면이 쓰는 순서**(로그인 → 피드 → 등록)다 — M2 를 기다리게 하지 않으려면 이 순서여야 한다.
> 참조 구현은 웹 이식본 `src/components/ui/index.jsx` 다(값 대조를 이미 마쳤다). **웹 코드를 복사하지 않고 값만 가져온다** — 웹은 `var(--토큰)` 문자열과 마우스 이벤트로 짜여 있어 RN 에서 동작하지 않는다.
> 공통: hover 는 이식하지 않는다(터치에 hover 가 없다). press 축소(`scale`)는 `Pressable` 로 살린다 — **단 `style` 콜백은 쓸 수 없다**(아래 M1 검증 기록: NativeWind interop 이 함수 `style` 을 버린다). 눌림 여부를 state 로 들고 평범한 style 객체를 넘긴다. 계산값(`fontSize: size*0.4`, 진행바 `width: pct%`)은 클래스가 아니라 `style` 로 남긴다 — 클래스로 바꾸면 동적 값이 죽는다(웹 0-5 와 같은 판단).

- [x] **M1-1. `Button` + `Avatar`** — 5화면 전부가 쓴다. 로그인(`primary lg block`) · 상세 댓글(`primary sm`) · 등록(`primary lg block` + disabled) · MY(`outline block`) · 공유 시트(`gradient lg block` + `outline block`). (M0-7 선행)
  Button: 3사이즈(36/44/52px)·6변형, `radius-pill`, press `scale(.98)`, disabled `opacity .5`. **`gradient` 변형만 `LinearGradient` 를 배경 엘리먼트로 감싼다**(의존 B-1) — 나머지는 단색이라 감싸지 않는다.
  Avatar: 원형, `indigo-100` 배경 / `indigo-700` 글자, `fontSize = size*0.4`, 이름 앞 2글자. 쓰이는 크기는 댓글 32px 과 MY 프로필 56px 두 가지이고 **56px 만 `ring`**(흰 3px + `indigo-200` 5px → RN 은 `borderWidth`+바깥 View 2겹으로 낸다, `box-shadow` 스프레드가 없다).
  완료: 두 부품의 모든 variant/size 를 늘어놓은 임시 화면이 시뮬레이터에 뜨고, padding·fontSize·색이 웹 이식본 값과 일치한다. 눌렀을 때 축소 반응이 보인다.

- [x] **M1-2. `Input` + `Textarea`** — 로그인 2개 · 등록 2개. (M1-1 선행)
  Input: 라벨(위) + 1.5px `border-strong` 테두리 + `radius-md`, 포커스 시 `indigo-400` 테두리. **포커스 링(`0 0 0 3px`)은 RN 에 `box-shadow` 스프레드가 없으므로 테두리 색 전환만으로 낸다** — 링을 흉내내려고 View 를 덧대지 않는다(원본 폼 높이 66/68px 이 어긋난다).
  Textarea: `multiline`, `minHeight 128`, **우하단 `n / 1000` 카운터**, `maxLength`. RN 은 `resize` 가 없다 — 고정 높이로 간다.
  비밀번호 필드는 `secureTextEntry`. 학번은 `keyboardType="number-pad"`.
  완료: 두 부품이 시뮬레이터 키보드로 실제 입력되고, 포커스 시 테두리가 바뀌며, 카운터가 글자 수를 따라간다. 키보드가 필드를 가리지 않는다(`KeyboardAvoidingView`).

- [x] **M1-3. `Select`** — 크로스 트랙 의존 E. **RN 에 `<select>` 가 없다 — 등록 화면을 막는 유일한 부품이다.** (M0-9 시트 표면, M1-2 선행)
  닫힌 상태의 필드 표면은 원본과 같게 만든다(1.5px 테두리 · `radius-md` · `padding 12 40 12 15` · 우측 14px chevron · 값 없으면 `text-muted` 플레이스홀더). 탭하면 **M0-9 의 시트 표면**에 카테고리 5개를 리스트로 띄우고 선택 시 닫는다.
  Picker 계열 패키지를 넣지 않는다(전제) — 시트 표면이 이미 있으므로 추가 코드가 리스트 하나뿐이다.
  완료: 등록 화면에서 카테고리를 고르면 필드에 라벨이 들어가고 시트가 닫힌다. 닫힌 필드의 높이·테두리·chevron 위치가 `Input` 과 나란히 놓았을 때 어긋나지 않는다.

- [x] **M1-4. `CategoryTag` + `StatusBadge`** — 피드 카드 · 상세 헤더 · 등록 미리보기가 쓴다. 둘 다 `size="sm"` 만 실제로 쓰인다(원본 176–177, 222–223, 314행). (M0-7 선행)
  CategoryTag: `padding 3 10` · 11px · 5px 점 · `radius-pill` · **soft 배경은 M0-7 에서 사전 계산한 5색**(의존 B-2), 글자·점은 카테고리 원색.
  StatusBadge: 3상태(접수 `indigo` / 검토중 `warning` / 답변 완료 `success`)의 fg·bg·dot 3색 조합. 700 두께.
  완료: 카테고리 5종 × 상태 3종을 늘어놓은 임시 화면에서 배경·글자·점 색이 웹 이식본과 같은 값이고, soft 배경이 흰색으로 뭉개지거나 원색으로 튀지 않는다.

- [x] **M1-5. `EmpathyButton` + `ThresholdBar`** — 이 앱의 핵심 인터랙션과 핵심 시각 산출물. (M1-1, M0-7 선행)
  EmpathyButton: `sm`(피드 카드) · `lg block`(상세 하단) 두 크기. 비활성 = 흰 배경 + `coral-400` 1.5px 테두리 + `coral-600` 글자 + 빈 하트. **활성 = `gradient-mileage` 배경 + `shadow-magenta` + 흰 글자 + 채운 하트**(의존 B-1 — `LinearGradient` 로 감싼다). press `scale(.95)`. 숫자는 `fontVariant: ['tabular-nums']`.
  ThresholdBar: `sm`(피드, 높이 6) · `md`(등록 미리보기, 9) · `lg`(상세, 12). 상단 메타 2줄(`{기준} 대비 임계치` / `현재 / 임계치 · N%`), 트랙 `gray-150`, 채움은 **미달 시 `gradient-hero` / 도달 시 `success` 단색**, 도달 시 하단에 "임계치 도달 · 담당자 검토 요청됨" 캡션. 폭 전환 `.5s` 는 `Animated` 로 낸다.
  완료: 공감을 누르면 버튼이 그라데이션으로 바뀌고 카운트가 +1 되며 같은 카드의 진행바가 함께 움직인다. `current 512 / threshold 480`(SEED p1)에서 바가 100% 에서 멈추고 초록 + 도달 캡션이 나온다.

---

## M1 검증 기록 (2026-07-29)

**M1 은 재작성이 아니라 값 대조였다.** 9종은 M2 화면 작업 중에 이미 `ios/src/ui.tsx` 에 들어와 있었다
(`feat/#6` 커밋 `e73ffd4`). 남아 있던 실제 일은 참조 구현과의 대조와 어긋난 곳 보정이다.
참조는 웹 이식본 `src/components/ui/index.jsx` 와 DS 원본 `_ds_bundle.js` 두 곳이고, 이번에 값이
서로 일치함을 확인했다. 모바일 프로토타입 HTML 은 이 작업 시점에 디스크에 없어 쓰지 못했다
(같은 날 복원됐다 — 위 스펙 표의 경로. M1 은 부품 값만 다루므로 결과에 영향은 없다).

**고친 값** (`ui.tsx`, `screens/Login.tsx`)
- `EmpathyButton` active 에 `1.5px` 투명 테두리 — 원본(`index.jsx:462`)에 있는데 빠져 있었다.
  없으면 **공감을 누를 때 버튼이 가로·세로로 3px 줄어든다.** 시뮬레이터 A/B 실측으로 크기 불변 확인.
- press 축소 — `Button` `.98` / `EmpathyButton` `.95`. 이전에는 `activeOpacity` 였다.
- `EmpathyButton` 공감 수와 `ThresholdBar` 메타 숫자에 `fontVariant: ['tabular-nums']`.
- `ThresholdBar` 폭 전환 `Animated.timing` 500ms + `Easing.bezier(.4,0,.2,1)`(`useNativeDriver:false`),
  메타 정렬 `baseline`.
- `Input` 에 `keyboardType` 을 뚫고 로그인 학번 필드를 `number-pad` 로. `number-pad` 는 return 키가
  없어서 `ScrollView` 에 `keyboardDismissMode="on-drag"` 를 같이 뒀다(빈 곳 탭 해제는 원래
  `keyboardShouldPersistTaps="handled"` 로 동작한다 — 이건 리뷰 중 확인됐다).
- 절대값 `lineHeight`: 라벨 19.5(`--text-label` 13/1.5) · 캡션 18(`--text-caption-role` 12/1.5) ·
  태그 글자 `fontSize × 1.3`(`--lh-snug`). `CategoryTag` 의 1px 투명 테두리 복원 —
  **원본은 `CategoryTag` 에만 두고 `StatusBadge` 에는 두지 않는다**(실측 22.3pt vs 20.3pt).

**규칙 정정 — `Pressable` 의 `style` 콜백은 이 스택에서 쓸 수 없다.**
NativeWind 의 interop 이 `Pressable` 을 **`className` 유무와 무관하게** 치환하고
(`react-native-css-interop/dist/runtime/wrap-jsx.js:16`), `style` prop 을 규칙으로 다시 조립하는
과정에서 함수를 스프레드해 `{}` 로 만들어 버린다. 결과는 **스타일 전소** — 로그인 버튼이 배경도
글자색도 없이 투명하게 렌더됐다(시뮬레이터에서 잡음). 눌림 여부를 state 로 들고 평범한 style
객체를 넘기는 방식으로 우회했다. M1 머리말의 공통 규칙을 이에 맞게 고쳤다.

**하지 않기로 한 것**
- **`Button` 미사용 3변형(secondary/ghost/danger)** — 원본 DS 는 6변형이지만 5화면이 쓰는 것은
  primary·outline·gradient 3종뿐이다. 안 쓰는 변형은 만들지 않는다.
- **임시 갤러리 화면** — M1 각 항목의 완료 조건이 "모든 variant/size 를 늘어놓은 임시 화면"이었으나,
  출시되는 조합이 전부 실제 5화면에서 쓰이므로(md 사이즈 일부만 예외) 실제 화면으로 확인했다.
  버릴 화면을 만드는 대신 로그인·피드·상세·등록·MY 를 돌며 부품별로 확인했다.
- **`TextInput` 에 `lineHeight`** — `Input` 본문과 `Select` 값 텍스트. iOS 에서 커서·수직정렬이
  틀어지고, `Select` 에 넣으면 닫힌 필드가 `Input` 보다 ~6pt 높아져 M1-3 완료 조건을 깬다.
  현재 두 필드 높이 차이는 ~1.5pt.
- **`Button`·`EmpathyButton` 라벨의 `line-height: 1`** — RN 에서 `lineHeight === fontSize` 는 한글
  글리프가 잘린다. 버튼 높이는 고정값(36/44/52)과 아이콘 크기가 이미 결정한다(드리프트 0 확인).

**관측하지 못한 것 1건** — `ThresholdBar` 의 500ms 트윈이 실제로 재생되는 장면. 공감 1건이 폭의
0.2% 라 육안·스크린샷으로 잡히지 않는다. 코드가 원본과 같은 duration·easing 이고 0%/부분/100%
렌더가 정상인 것까지만 확인했다. M3-1 전 플로우 실사에서 다시 본다.

**리뷰** — `code-reviewer` 지적 3건(애니메이션 값 매 렌더 생성 / 주석이 원본과 반대 / 키보드 해제
경로)을 반영했고, 키보드 지적은 리뷰어가 근거를 들어 철회했다. `security-reviewer` 는 두 차례 모두
지적 없음. `npx tsc --noEmit` · `node src/selfcheck.ts` 통과.

**리뷰가 남긴 남은 것 (M1 아님, 기록용)**
- 이번에 보정한 값(19.5 / 18 / ×1.3 / 투명 테두리 / tabular-nums)이 다시 드리프트해도 실패하는
  검증 수단이 없다. 스타일 상수를 그대로 다시 적는 테스트는 동어반복이라 넣지 않았다 —
  드리프트 감지는 M3-2 소스 값 대조가 맡는다.
- 시뮬레이터 탭 자동화가 접근성 권한(`-25211`)으로 막혀 있다. 화면 전환은 `App.tsx` 초기 상태를
  일시 변경해 냈다(매번 원복). M3-1 전에 권한을 열어두는 편이 낫다.

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
  여기에 하나 더: **`screens/Login.tsx` 의 학번·비밀번호 프리필을 걷어낸다.** 목 편의로 넣은 초기값인데 학번이 실제 값이고 `data.ts` 의 `USER.sid` 와 같다(M1 보안 리뷰 지적).
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
- **실제 클립보드 복사** — `expo-clipboard` 가 새 의존성이고, 원본도 라벨만 바꾼다(644행). 라벨 전환 + 토스트로 재현.
- **`expo-blur`** — 새 의존성. `backdrop-filter` 2곳은 불투명색으로 대체한다(의존 B-3).
- **Pretendard 웹폰트** — 바이너리가 핸드오프에 없고 `expo-font` + CDN 다운로드는 새 의존성 + 네트워크 의존이다. `fonts.css` 가 지정한 애플 기기 폴백 `Apple SD Gothic Neo` 를 그대로 쓴다(M0-2). 웹은 jsDelivr `@import` 가 있어 다르게 갔다.
- **테스트 프레임워크** — 넣지 않는다. 유일한 비자명 로직(임계치·필터·정렬)에 `src/selfcheck.ts` assert 하나만(M0-5).
- **다크 모드 · 태블릿 레이아웃 · 가로 모드** — 원본이 390×820 세로 1종이다. `app.json` 이 `portrait` 고정이고 `userInterfaceStyle: "light"` 다.
