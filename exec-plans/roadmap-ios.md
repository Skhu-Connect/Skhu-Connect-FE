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
  헤더(52px, 고정): 32px 그라데이션 막대 마크 + 제목(탭에 따라 `성공잇다`/`임계치 임박`/`내 청원`) + 검색 토글 + 벨. **벨은 알림 드롭다운이 아니라 MY 화면으로 간다**(원본 605행 `onOpenMy`) — 웹과 다르다. 미읽음 8px coral 점.
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

## Phase M4 — 새 시각 규칙 이식 (이슈 #100)

> **목표** — 피드와 MY 가 웹 이식본과 같은 시각 규칙으로 보이고, 토큰·공용 부품을 함께 쓰는
> 범위 밖 화면은 모양이 바뀌어도 읽히고 눌리는 상태.

**M4 의 스펙 원본은 M0~M3 과 다르다.** M0~M3 은 `handoff/…Mobile.dc.html` 로의 픽셀 이식 기록이고,
그 디자인이 "AI 가 만든 것 같다"는 피드백으로 교체된 것이 이슈 #100 이다. 그 파일은 **옛 디자인이고
디스크에 없다 — 이 페이즈에서는 찾지 않는다.** 새 규칙의 권위는 웹 이식본이다.

| 대상 | 원본 |
|---|---|
| 규칙 문장(색·모양·그림자·글자·다크) | `src/index.css` 1–30행 머리 주석 |
| 새 토큰 값 | 같은 파일 `@theme` 블록 |
| 부품 값 | `src/components/ui/index.jsx` — 값 대조가 끝난 참조 구현(복사하지 않고 값만 읽는다) |
| 피드 | `src/components/web/FeedParts.jsx` · `src/pages/web/FeedScreen.jsx` · `index.css` 447행부터 |
| 마이페이지 | `src/pages/web/MyPageScreen.jsx` · `index.css` 975행부터 |
| 왜 그렇게 바꿨나 | `git show f0c026c 19dc95c 1376d0d b50dea3 9f39d79` 의 메시지 본문(대비율·AA·정렬 실측) |

### 범위 (사용자가 정했다 — 재논의 대상 아님)

`src/tokens.js` · `src/ui.tsx` · `src/shell.tsx` · `src/screens/Feed.tsx` · `src/screens/My.tsx` **까지만.**
상세·등록·인증 4화면·알림 설정은 범위 밖이다 — **웹도 아직 그 화면들을 옮기지 않았고, 옮기면 웹에
없는 디자인을 새로 발명하게 된다.** 새 의존성도 넣지 않는다(지금 `package.json` 것만).

`shell.tsx` 가 범위에 든 이유: 탭바와 토스트는 별도 화면이 아니라 **피드·MY 위에 항상 얹히는 크롬**이다.
탭바 가운데 FAB 이 마젠타 그라데이션 + 색 그림자를 그대로 들고 있으면, 고치려는 그 화면에 옛 규칙의
가장 강한 신호가 남는다.

**파급 파일 — 화면은 아니지만 값·로직이 여기 있어 같이 들어온다.** 범위 밖 *화면*은 한 줄도 고치지
않는다는 것이 지켜야 할 선이고, 값 층은 그 선 안쪽이다.

| 파일 | 왜 | 범위 밖 화면에 미치는 영향 |
|---|---|---|
| `src/theme.ts` | 타입만 입혀 재수출 | 없음(값이 없다) |
| `src/data.ts` | 알림 종류별 파스텔 6쌍이 여기 있다 | `NotifSettings.tsx` 타일이 **자동으로 중립이 된다** — 웹이 낸 결과와 같다 |
| `src/logic.ts` | 만료 배지의 판정 한 줄 | 없음(범위 밖 화면은 계속 `p.status` 를 넘긴다) |
| `src/selfcheck.ts` | 위 판정의 assert 2줄 | 없음 |
| `src/api.ts` | 우리 변경이 만드는 고아 2줄 삭제 | 없음 |

---

### 크로스 트랙 의존 I — 공유 토큰·부품이 범위 밖 화면을 같이 바꾼다 (이 페이즈의 병목)

`tokens.js` 는 앱 전체의 단일 출처이고(`theme.ts` 가 타입만 입혀 재수출, `tailwind.config.js` 가
같은 파일을 `require`), `ui.tsx` 의 `Input`/`Select`/`Textarea`/`Card`/`StatusBadge`/`CategoryTag`/
`ThresholdBar`/`EmpathyButton` 은 범위 밖 화면도 쓴다(`Detail.tsx` 219·220·232·233·380행,
`Submit.tsx` 63·66·68행). **값 하나를 바꾸면 범위 밖 화면의 모습이 같이 바뀐다.**

웹이 이 자리에서 쓴 전략을 그대로 가져온다 — **회색·반경·그림자는 전역으로 바꾸고(옛 화면도 같이
변하는 것을 받아들인다), 옛 화면이 아직 쓰는 계열만 "새로 쓰지 않는다" 주석과 함께 남긴다.**
iOS 에서 성립 여부를 값별로 확인한 결과가 아래다.

**전역으로 바꾼다 — 옛 화면이 같이 변해도 깨지지 않는다**

- **회색 12단계와 시맨틱 별칭**(`strong`·`body`·`muted`·`page`·`card`·`sunken`·`subtle`·`line`).
  색조만 바뀌고 구조는 그대로다. `muted` 는 대비가 3.3:1 → 5:1 로 **올라가므로** 옛 화면의 보조
  글씨도 같이 나아진다. 되돌릴 이유가 없는 방향이다.
- **그림자 `xs`/`sm`/`md`** → 값 비우기. 남는 사용처(`NotifSettings.tsx` 4곳, `ui.tsx` 의 `Card`)는
  전부 `borderWidth: 1` + `border-subtle` 을 이미 같이 갖고 있어 그림자가 없어도 면이 구분된다.
- **떠 있는 면의 라운드** — `Sheet` 의 상단 라운드 24 는 하드코딩이고 공유 표면이다(`Select`·공유
  시트·알림 시트·건의 목록 시트·신고 시트). 한 곳에서 10 으로 내리면 전 화면이 같이 따라온다.
- **알림 종류별 파스텔 6쌍**(`data.ts` 의 `NOTIF_POINTS` 219~265행 + `UNKNOWN_POINT` 289행). `tokens.js`·
  `ui.tsx` 와 성격이 같은 파급 지점이다 — `api.ts` 639·640행을 거쳐 **세 화면**이 읽는다(`Feed.tsx`
  218·219행 · `My.tsx` 160·161행 · **범위 밖 `NotifSettings.tsx`** 103·104·270·271행). 웹이 같은 자리에서
  색을 걷었고(`.notif-tile` = 34px · `--radius-md` · `surface-sunken` 면 · `text-muted` 아이콘),
  값을 중립 한 쌍으로 바꾸면 **범위 밖 알림 설정 화면도 같이 중립이 된다.** 그쪽이 원하는 결과라
  전역으로 바꾼다.
  **함정(이게 이 항목의 핵심이다)**: `NotifSettings.tsx` 는 타일 안에 `point.icon` 을 그리지만
  **`Feed.tsx`·`My.tsx` 는 8px 색 점만 그리고 아이콘을 안 쓴다.** 색을 중립으로 만들면 그 두 화면은
  **중립 점 하나만 남아 알림 종류 구분이 통째로 없어진다.** 그래서 색 제거와 **아이콘 교체는 같은
  회차에 같이 가야 한다** — 따로 가면 중간 상태가 기능 후퇴다. 새로 만들 것은 없다:
  `NotifPoint.icon` 과 `pointOf()` 가 이미 있고 `NotifSettings.tsx` 가 쓰는 방식 그대로다.

**전역이지만 즉시 눈에 띄는 곳이 있다 — 순서로 막는다**

- **`radius.md` 14 → 6.** `ui.tsx` 의 `fieldBox` 가 이 값을 쓰고, 그 부품을 **로그인·회원가입·
  아이디 찾기·비밀번호 찾기·등록·상세 댓글칸·MY 학부 선택이 전부 쓴다.** 토큰을 건드린 순간 그 7화면의
  입력칸 모양이 같이 바뀐다. 되돌릴 수 없으니 **M4-5(범위 밖 회귀 확인)를 피드 작업보다 앞에 둔다.**
- **`radius.lg` 18 → 10**, `xl` 24 → 10, `xs` 6 → 4, `sm` 10 → 6. `Card` 를 쓰는 상세·등록이 같이 바뀐다.

**남긴다 — 범위 밖 화면이 아직 쓴다**

- **`radius.pill` 999.** 이 회차가 끝나면 소비자가 `Detail.tsx` 324·350행(댓글 입력칸)과
  `Signup.tsx` 44행뿐이다. 값은 두고 "새로 쓰지 않는다" 주석을 단다(웹 `--radius-pill` 과 같다).
- **`gradient.mileage`.** `Detail.tsx` 211행이 쓴다. **`gradient.hero` 는 반대다** — 소비자가
  `ui.tsx` 502행·`Feed.tsx` 360행·`My.tsx` 91행 셋뿐이고 전부 범위 안이라 이 회차에 0이 된다.
  웹은 `--gradient-hero` 를 남겼지만 iOS 는 `hero` 를 지우고 `mileage` 를 남긴다 — 소비자가 반대다.
- **옛 색 계열 팔레트**(`coral`·`teal`·`violet`·`magenta`·`blue`). `coral` 은 `NotifSettings.tsx`
  110행과 `Detail.tsx` 134·135행이 쓴다. 나머지는 소비자가 없어지지만 **팔레트 항목을 지우는 것은
  이득 없는 변경이라 블록째 남기고 주석만 단다**(웹도 teal/violet/coral/magenta/blue 를 남겼다).
- **`status` 의 `answered-fg`/`-bg`/`-surface`/`-line`.** `Detail.tsx` 267행의 공식 답변 카드가
  `answered-surface`·`answered-line` 을 쓴다. 여기에 **진한 단색 3색을 따로 추가한다** —
  합치면 어두운 면에 어두운 글리프가 얹힌다(웹 커밋 19dc95c 의 근거 그대로).

**지운다 — 이 회차에 소비자가 0이 된다**

- **`shadow.magenta`**: `shell.tsx` 32행·`ui.tsx` 121·447행 셋뿐이고 전부 범위 안이다.
- **`status.dot-*` 3색**: 유일한 소비자가 `ui.tsx` 의 `StatusDot` 이고, 그 부품이 단색 면으로 바뀐다.
- **`gradient.hero`** + `ui.tsx` 의 `LinearGradient` import(우리 변경이 만든 고아).
- **`Avatar` 의 `ring` prop**: 웹이 연보라 원·링을 걷어냈고, 소비자는 `My.tsx` 93행뿐이다.
- **`Notification` 의 `iconBg`/`iconFg` 두 필드 + `api.ts` 639·640행의 전달**: 두 화면이 아이콘으로
  바뀌면 소비자가 0이 된다(`NotifSettings.tsx` 는 알림이 아니라 **포인트**에서 직접 읽으므로 영향
  없다). 우리 변경이 만든 고아라 같이 지운다 — 중립 디자인에 색 필드를 남겨 두면 다시 쓰인다.

**받아들이는 어긋남 (기록)** — 이 회차가 끝나면 상세 화면에 마젠타 그라데이션 배너 하나와 알약
댓글칸이 남는다. 웹도 같은 상태로 화면별 교체를 진행했다(커밋 19dc95c 말미: "상세·마이페이지·관리자
콘솔은 아직 옛 토큰을 쓴다"). **상세를 옮기는 회차에서 걷어낸다.**

### RN 플랫폼 제약 — 무엇이 사라지고 무엇이 남나 (의존 B 갱신)

새 규칙이 그라데이션과 색 혼합을 걷어내므로 의존 B 의 7가지 중 둘이 사라진다.

- **B-1 그라데이션 — 범위 안에서 사라진다.** 범위 안 `LinearGradient` 가 0개가 된다. 다만
  `expo-linear-gradient` **의존성은 뺄 수 없다** — 상세가 아직 쓴다.
- **B-2 `color-mix` — 이미 사라져 있다.** M0 검증 기록의 `mixWhite` 는 현재 코드에 없다(확인함).
  `CategoryTag` 가 무채색 아이콘 + 글자로 이미 바뀌어 있어 되살릴 일도 없다.
- **B-3 `backdrop-filter` — 남는다.** 필터바는 계속 불투명 흰색(`surface-card`)이다. 새 규칙이
  요구하는 것과 같은 결론이라 바꿀 것이 없다.
- **B-4 `position: sticky` — 남는다. 그리고 함정이 하나 있다.** `Feed.tsx` 95행이
  `stickyHeaderIndices={[2]}` 이고 인덱스는 **자식 위치로 센다.** 히어로를 걷어낼 때 자식을 **빼면**
  안 되고 **갈아끼워야** 한다 — 빼면 필터바 대신 목록이 상단에 고정된다(공지 배너가 높이 0 짜리
  빈 `View` 를 자리에 두고 있는 것과 같은 이유).
- **B-5 절대값 `lineHeight` — 남는다.** 새 규칙의 `--lh-tight/snug/normal/relaxed`(1.15·1.3·1.5·1.65)를
  `fontSize × 배수` 로 환산한다.
- **B-6 pt `letterSpacing` — 남는다.** `--ls-tight: -0.02em` → `fontSize × -0.02`.
- **B-7 가로 스크롤 칩 — 남는다.** 분류 줄이 알약에서 밑줄 탭으로 바뀌어도 가로 스크롤은 그대로다
  (웹 `.feed-cat-tabs` 도 `overflow-x: auto` 다).
- **이식하지 않는 것 하나.** 커밋 f0c026c 가 버튼·입력칸의 `:hover`/`:focus-visible`/`:disabled` 를
  `.ds-*` 클래스로 옮겼는데 **RN 에는 그 세 상태가 없다**(터치에 hover 가 없고, 포커스 링은 M1-2 에서
  이미 테두리 색 전환으로 정리했다). `disabled` 만 `opacity .5` 대신 **중립 회색 면**으로 바꾼다 —
  웹 `.ds-btn:disabled` 와 같은 결과다(흐린 인디고가 연보라로 보이던 것을 없애는 것이 그 변경의 요지다).

---

- [ ] **M4-1. `tokens.js` — 새 값으로 교체** — 단일 출처라 여기가 먼저다. `theme.ts` 는 타입만 입히므로 손댈 곳이 없고, `tailwind.config.js` 는 이 파일을 `require` 하므로 클래스(`bg-page`·`border-subtle`·`rounded-lg` …) 28곳이 자동으로 따라온다. (의존 I 선행 판단 완료)
  회색: 채도 없는 한 계열로 교체하고 `gray-25`(#fbfbfb)를 새로 넣어 `page` 를 그리로 옮긴다 — 지금 `page` 는 `gray-100` 이다. `muted` 는 #8B8C9C(3.3:1) → #6e6e78(5:1).
  반경: `{xs:4, sm:6, md:6, lg:10, xl:10, pill:999}`. `pill` 은 값만 남기고 "새로 쓰지 않는다" 주석.
  그림자: `xs`/`sm`/`md` 를 **키는 남기고 빈 객체로** 만든다 — 키를 지우면 `undefined` 가 되어 범위 밖 `NotifSettings.tsx` 4곳까지 타입 오류로 끌려온다. `lg` 는 CSS `0 12px 32px rgba(20,20,24,.14)` 를 기존 환산 규칙(`shadowRadius ≈ blur/2`)으로 옮긴다. `magenta` 삭제.
  상태: `received/review/answered` **단색 3색 추가**(흰 글자 대비 7.56·6.76·7.90:1), `answered-fg` 는 웹이 AA 때문에 한 단계 내린 값으로 맞추고, `answered-surface`·`answered-line` 은 상세가 쓰므로 그대로, `dot-*` 3색 삭제.
  글자: `fs` 단계(13·14·15·16·17·20·24·28)를 새로 export 한다 — **13px 바닥을 기계로 확인할 수 있게 만드는 것이 이 항목의 목적이다.** `tailwind.config.js` 에는 넣지 않는다(범위 안 글자는 전부 인라인 `style` 이다).
  `gradient.hero` 삭제, `mileage` 는 주석 달고 유지. 옛 색 계열 팔레트는 블록째 유지 + 주석.
  완료: `npx tsc --noEmit` 통과. `grep -rn "gradient.hero\|shadow.magenta\|dot-" src` 가 0건. 토큰 파일 안에 어떤 값을 왜 남겼는지가 주석으로 적혀 있다.

- [ ] **M4-2. `ui.tsx` — 공용 부품** — 범위 밖 화면도 쓰는 파일이라 여기서 실수하면 M4-5 에서 잡힌다. (M4-1 선행)
  `StatusBadge`: 색 원 + 흰 글리프(`StatusDot`) → **진한 단색 면 + 흰 글자**. `StatusDot`·`Svg`/`Circle`/`Path` import 삭제(우리 변경이 만든 고아).
  **네 번째 상태 `expired` 를 이식한다(결정).** 웹은 `StatusBadge` 에 "만료됨"(중립 회색 면 `surface-sunken` + `muted` 글자)을 두고 `petitionStatus()` 로 **답변 완료 > 만료 > 상태** 우선순위를 매겨 넘긴다(`index.jsx` 353–359행, `FeedParts.jsx` 55행). iOS 는 `ui.tsx` 의 `STATUS` 가 3종이고 만료를 모른다 — 만료는 `logic.ts` 46행 `ddayLabel()` 이 "만료" 문자열로만 따로 낸다.
  **이식하는 이유**: 지금 목록 행은 같은 줄에서 배지가 `진행중` 인데 D-day 는 `만료` 라고 말한다. 옛 파스텔 배지에서는 묻혔지만 **새 규칙의 진한 단색 면은 그 모순을 정면에 세운다** — 읽히게 만드는 것이 이 회차의 목적이라 그대로 둘 수 없다. 웹도 같은 회차(f0c026c)에 넣었고, 중립 회색 면이라 **새 색을 하나도 늘리지 않는다.**
  **비용은 3곳 다섯 줄이다**: `STATUS` 에 `expired` 한 줄 + `logic.ts` 에 판정 세 줄(`badgeStatus(p)` — 답변 완료면 그대로, `daysLeft(p) <= 0` 이면 `expired`, 아니면 `p.status`) + `selfcheck.ts` assert 두 줄.
  **`statusOf()` 는 건드리지 않는다.** 그건 임계치 전이 규칙이고 M0-7 이 이미 "화면에서 쓰지 않는다"고 못 박았다. 만료는 시간 파생이라 별개 함수로 둔다 — 섞으면 그 결정이 무너지고 `selfcheck.ts` 14–18행의 전이 검증도 같이 흔들린다. 기존 `statusOf`·`ddayLabel` assert 는 **그대로 통과해야 한다.**
  범위 밖 화면은 계속 `p.status` 를 넘기므로(`Detail.tsx` 220행) 지금과 같이 만료를 표시하지 않는다 — 상세를 옮기는 회차에서 `badgeStatus` 로 바꾼다.
  `EmpathyButton`: 하트·`gradient.mileage`·`shadow.magenta` 제거. 비활성 = 테두리 + 글자색, 활성 = 인디고 채움 + 체크 + 흰 글자. 라운드 6. **`block` 은 유지한다** — 웹이 목록 행 버튼 정렬을 이걸로 고쳤다(b50dea3).
  `ThresholdBar`: 그라데이션 막대 → **숫자 + 남은 인원 글**. `lg` 는 두 줄(큰 숫자 + "N명 더 요청하면 담당 부서로 전달됩니다"), 나머지는 한 줄. `Animated`·`Easing` import 와 폭 트윈이 통째로 사라진다 — M1 이 "관측하지 못한 것"으로 남겨 둔 500ms 트윈도 여기서 없어진다.
  `Button`: `gradient` 변형 삭제(유일한 소비자가 `shell.tsx` 의 공유 시트 복사 버튼이고 `primary` 로 내린다), 라운드 `pill` → `md`, `disabled` 를 `opacity .5` → 중립 회색 면.
  `Avatar`: 인디고 원 + 이니셜 → `surface-sunken` 면 + `border-subtle` 1px + `muted` 글자, `ring` prop 삭제.
  `fieldBox`·`Textarea`·`Card`·`Sheet`: 라운드를 토큰에서 다시 읽게 두고(값만 따라온다), `Sheet` 의 하드코딩 24 → 10, 스크림은 `rgba(20,20,24,.45)` 로 맞춘다.
  완료: `tsc` 통과. 범위 밖 화면을 띄웠을 때 상세의 상태 배지가 단색 면으로, 요청 버튼이 하트 없이 보인다. `grep -rn "LinearGradient" src/ui.tsx` 가 0건.

- [ ] **M4-3. `shell.tsx` — 탭바·토스트** — 별도 화면이 아니라 피드·MY 위에 항상 얹히는 크롬이라 두 화면과 같은 회차에 바꿔야 한다. (M4-1, M4-2 선행)
  FAB: `gradient.mileage` + `shadow.magenta` + 원형 48 → **인디고 단색 + 라운드 6**. 새 규칙이 알약·원형을 아바타에만 허용하므로 원을 남길 근거가 없다. 48×48 과 `marginTop: -12` 는 그대로 둔다(탭바 높이 64 와 물려 있다).
  토스트: 라운드 `pill` → `lg`(떠 있는 면), `shadow.lg` 유지, 체크 아이콘 `teal-400` → **흰색**. 새 규칙에 teal 이 없고, `success` 초록(#1a7f53)은 `gray-900` 면 위에서 대비가 안 나온다.
  공유 시트 복사 버튼: `variant="gradient"` → `primary`.
  완료: 시뮬레이터에서 탭바에 그라데이션·색 그림자가 없고, 요청을 눌렀을 때 토스트의 체크가 어두운 면 위에서 보인다. 상세·등록에서 탭바가 사라지는 조건(M0-8)은 그대로다.

- [ ] **M4-4. `data.ts` — 알림 타일을 중립 1종 + 아이콘으로** — 웹이 같은 자리에서 걸린 문제다: 알림 종류 6개에 6색이 물려 있고 그 색이 **세 화면에 한꺼번에 퍼진다**(피드 벨 시트·MY 알림함·알림 설정). 종류는 바로 옆 아이콘과 제목이 이미 말해 준다(1376d0d). (M4-1 선행)
  `NOTIF_POINTS` 6개(219~265행)의 `iconBg`/`iconFg` 를 **전부 같은 중립 한 쌍**(`surface-sunken` / `text-muted`)으로 바꾼다. `UNKNOWN_POINT`(289행)도 같은 값이다. **`NotifPoint` 의 두 필드는 남긴다** — 범위 밖 `NotifSettings.tsx` 103·104·270·271행이 포인트에서 직접 읽으므로, 값만 바꾸면 **그 화면도 코드 한 줄 없이 중립이 된다.** 필드를 지우면 범위 밖 화면이 diff 로 끌려온다.
  **색만 걷으면 기능이 후퇴한다 — 아이콘 교체가 같은 회차에 붙어야 한다.** `NotifSettings.tsx` 는 타일 안에 `point.icon` 을 그리지만 `Feed.tsx` 218·219행과 `My.tsx` 160·161행은 **8px 색 점만 그리고 아이콘을 안 쓴다.** 색을 중립으로 만드는 순간 그 두 화면은 중립 점 하나만 남아 **알림 종류 구분이 통째로 없어진다.** 그래서 두 화면의 점을 `pointOf(n.type).icon` 으로 바꾼다(M4-6·M4-7 에서 각각) — `NotifPoint.icon` 과 `pointOf()` 가 이미 있고 `NotifSettings.tsx` 가 쓰는 방식 그대로라 **새로 만들 것이 없다.**
  타일 치수는 웹 `.notif-tile` 값으로 맞춘다: **34px · `radius.md` · `surface-sunken` 면 · `muted` 아이콘**(지금 두 화면은 30px · 라운드 9 다). 범위 밖 화면의 타일 크기는 그대로 두고 색만 따라오게 한다.
  **`Notification` 의 `iconBg`/`iconFg` 와 `api.ts` 639·640행은 지운다** — 두 화면이 아이콘으로 바뀌면 소비자가 0이 되는, 우리 변경이 만든 고아다.
  완료: `node src/selfcheck.ts` 가 그대로 통과한다(알림 포인트 5·8종 매핑 검증은 색을 보지 않는다). `grep -n "iconBg\|iconFg" src/data.ts` 의 값이 한 종류이고 `src/api.ts`·`src/screens/Feed.tsx`·`src/screens/My.tsx` 에서는 0건이다. **세 화면의 타일이 중립 1종이면서 종류마다 다른 아이콘을 보인다.**

- [ ] **M4-5. 범위 밖 화면 회귀 확인 — 피드로 넘어가기 전 게이트** — **이 항목이 "범위 밖 화면이 깨져 보이지 않는다"는 완료 조건의 본체다.** M4-1~M4-4 는 공유 코드만 건드렸고 그 영향은 범위 밖 화면에서만 눈에 보인다. 여기서 막지 않으면 피드·MY 작업 diff 에 섞여 원인을 못 찾는다. (M4-1~M4-4 선행)
  대상 7화면: 로그인 · 회원가입 · 아이디 찾기 · 비밀번호 찾기 · 상세 · 등록 · 알림 설정.
  완료: 시뮬레이터에서 7화면을 모두 열어 ① 입력칸·버튼이 6px 라운드로 보이고 글자가 잘리지 않는다 ② 그림자를 잃은 카드가 테두리로 구분된다 ③ 보조 글씨가 흰 바탕에서 읽힌다 ④ 상세의 공식 답변 카드 면·테두리가 그대로다 ⑤ 상세 하단 요청 버튼과 상태 배지가 새 모양으로 정상 렌더된다 ⑥ 알림 설정의 타일이 중립 1종이면서 **종류별 아이콘이 그대로 남아 구분된다**(이 화면은 원래 아이콘을 그리므로 색만 빠진다) ⑦ 그 화면 토글의 knob 이 그림자 없이도 트랙과 구분된다 ⑧ 인증 화면의 영상 위 팔레트(`onVideo`)가 영향을 받지 않았다 ⑨ 크래시·콘솔 에러 0건 ⑩ **범위 밖 화면 파일의 diff 가 0줄이다**(`git diff --stat` 에 `screens/Detail.tsx`·`Submit.tsx`·`NotifSettings.tsx`·`Login.tsx`·`Signup.tsx`·`FindId.tsx`·`FindPassword.tsx` 가 없다). 남는 어긋남(상세의 마젠타 배너·알약 댓글칸)은 **의도된 것으로 이 항목에 기록한다.**

- [ ] **M4-6. 피드** — 웹 절반이 화면별로 나아간 순서와 같다(토큰·부품 → 피드 → 마이페이지). (M4-5 선행)
  히어로: `gradient.hero` + 장식 원 → `surface-sunken` 안내 면 + `assets/campus-hero.jpg`(**이미 있는 에셋이다 — 새로 받을 것이 없다**). 문구는 웹과 같이 그대로 옮긴다. **자식을 빼지 말고 갈아끼운다**(의존 B-4).
  분류 칩: 인디고로 채운 알약 → **밑줄 탭**. 웹이 바꾼 이유가 그대로 걸린다 — 채운 칩이 같은 줄의 다른 강조와 다툰다. 가로 스크롤은 유지.
  목록: `Card`(테두리 + 그림자 + 라운드 18) → **목록 행**(상자 없이 아래 구분선 1px). 상자가 반복되면 제목보다 상자가 먼저 읽힌다.
  행 안: 상태 배지 단색 면 / `ThresholdBar` 숫자 표기 / 요청 버튼은 **고정 폭 열 + `block`**(b50dea3 의 근거: 체크 아이콘 +26px 과 요청 수 자릿수 +9.6px 때문에 행마다 버튼 왼쪽 끝이 흩어진다).
  **⋮ 메뉴 자리 예약(9f39d79 가 iOS 에도 그대로 걸린다)**: `Feed.tsx` 685행이 `!p.mine` 일 때만 메뉴를 그리므로 **내 글 행에서 메뉴가 통째로 빠지고 그만큼 옆 요소가 밀린다.** 동작 없는 빈 메뉴를 그릴 수는 없으니 자리만 예약한다 — 폭은 `ActionMenu` 안쪽 버튼과 같은 26px.
  만료 배지: `StatusBadge` 에 `p.status` 대신 **`badgeStatus(p)`**(M4-2)를 넘긴다 — 배지가 `진행중` 인데 D-day 가 `만료` 인 모순을 없애는 호출부가 이 한 줄이다.
  벨 알림 시트: 8px 색 점 → **`pointOf(n.type).icon`** + 중립 34px 타일(M4-4). 점만 남기면 종류 구분이 사라진다.
  급상승·기간 요약: 파스텔 타일(코랄 `rgba(240,128,138,.16)`·`indigo-50`)과 `Card` 상자 → 중립 + 머리선 목록. 기간 탭 알약 → `surface-sunken` 트랙 + 라운드 4 버튼(웹 `.feed-period`). **웹처럼 오른쪽 보조 열로 내리지 않는다 — 폰은 한 열이고 이미 목록 아래에 있다.**
  헤더: 아이콘 버튼 `rounded-full` → `rounded-md`, 미읽음 점 `coral-500` → 인디고(액센트는 하나).
  빈 상태: dashed 테두리 상자 → 여백 + 아이콘 + 제목 + 설명(웹 `.feed-empty`).
  글자: 13px 미만 **24곳**을 `fs` 단계로 올린다.
  완료: 시뮬레이터 390pt 에서 ① 가로 넘침 0 ② 13px 미만 글자 0(`grep -o "fontSize: 1[0-2][^0-9]" src/screens/Feed.tsx` 가 0건) ③ `LinearGradient` 0건 ④ 스크롤 시 **필터바**가 상단에 고정된다(목록이 아니다) ⑤ 요청 버튼 왼쪽 끝이 모든 행에서 한 값이고, 내 글 행에서도 그 옆 요소가 밀리지 않는다 ⑥ 벨 알림 시트의 타일이 중립 1종이면서 **알림 종류마다 다른 아이콘**을 보인다 ⑦ D-day 가 `만료` 인 행의 배지가 `만료됨`(중립 회색)이고, 답변 완료 건은 만료돼도 `답변 완료` 를 유지한다 ⑧ 필터·정렬·검색 동작과 SEED 기준 건수가 M2-2 완료 조건과 같다(**데이터·동작은 손대지 않는다**).

- [ ] **M4-7. 마이페이지** — 피드와 같은 언어로 맞춘다. 데이터·동작·문구는 그대로다(1376d0d 와 같은 방침). (M4-6 선행)
  프로필: `gradient.hero` + 장식 원 + 링 아바타 → **아바타(링 없음) + 학부(주) + 아이디(보조)**. 서버가 이름을 주지 않으므로 학부를 위에 둔다(웹과 같은 판단).
  통계 3개: 테두리 + 그림자 + 라운드 16 카드 3장 → **위아래 머리선 사이의 숫자 3개**. 누르면 가던 곳(내 건의 탭 / 두 시트)은 그대로다.
  목록 6구역(학부 수정·계정 정보·알림·북마크·알림 설정·도움말·댓글): `radius.lg` + `shadow.sm` 상자 → **머리선 하나로 묶은 목록**. 웹이 걷어낸 것과 같은 구조다.
  알림함: 8px 색 점 → **`pointOf(n.type).icon`** + 중립 34px 타일(M4-4). 피드 벨 시트와 같은 행 모양을 유지한다 — 같은 알림을 두 곳에서 다르게 그리지 않는다는 기존 규칙(`Feed.tsx` 머리 주석)이 그대로 걸린다.
  시트 2개(회원탈퇴·비밀번호 변경)는 `Sheet` 를 쓰지 않고 자체 `Modal` + `KeyboardAvoidingView` 다 — **그 구조는 유지하고** 하드코딩된 스크림 `rgba(15,23,42,.45)` 와 상단 라운드 24, 내부 버튼 라운드 10 만 공용 값으로 맞춘다. 키보드 회피 때문에 `Sheet` 로 합치지 않는다.
  글자: 13px 미만 **20곳**을 `fs` 단계로 올린다.
  완료: ① 13px 미만 0건 ② `LinearGradient` 0건 ③ 하드코딩 라운드·스크림 0건 ④ 통계 3개가 M2-6 과 같은 곳으로 가고 값도 같다 ⑤ 학부 저장·비밀번호 변경·회원탈퇴·전체 읽음·더보기가 전부 그대로 동작한다 ⑥ 피드와 나란히 놓았을 때 회색·라운드·글자 단계가 어긋나지 않는다.

- [ ] **M4-8. 마무리 확인 + 리뷰 2종** — 전제로 못 박힌 필수 절차다. (M4-7 선행)
  **스타일 테스트를 `selfcheck.ts` 에 넣지 않는다** — M1 검증 기록이 이미 내린 결정이다(스타일 상수를 다시 적는 테스트는 동어반복). 대신 웹이 쓴 방식을 쓴다: **grep 기반 확인 목록.** `selfcheck.ts` 에 이번에 **늘어나는 것은 `badgeStatus` assert 2줄뿐이다**(M4-2) — 그건 스타일이 아니라 우선순위 분기라서 자체검증 관례(비자명 로직 하나에 assert 하나)에 맞는다. 나머지(임계치·필터·정렬·알림 매핑)는 이 회차가 건드리지 않으므로 **통과 상태가 유지되는 것 자체가 회귀 신호다.**
  확인 목록: 범위 안 4파일에서 `fontSize: 1[0-2]` 0건 / `LinearGradient` 0건 / `radius.pill` 0건 / `iconBg` 0건 / `shadow.magenta`·`gradient.hero`·`dot-` 레포 전체 0건 / `data.ts` 의 타일 색 1종 / 범위 밖 화면 7파일 diff 0줄.
  완료: `npx tsc --noEmit` 통과, `node src/selfcheck.ts` 통과, 위 grep 목록 전부 0건/1종, 시뮬레이터에서 로그인 → 피드 → 상세 → 등록 → MY → 로그아웃 경로가 크래시·콘솔 에러 없이 돌고, `code-reviewer`(화면을 실제로 띄워 확인) + `security-reviewer` 지적이 처리되거나 기록됐다.

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
