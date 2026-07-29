# 안드로이드 로드맵

- iOS 앱: [roadmap-ios.md](roadmap-ios.md)
- 학생 웹 · 관리자 콘솔: [roadmap-web.md](roadmap-web.md) · [roadmap-admin.md](roadmap-admin.md)

## 현재 상태: 계획 없음 (범위 밖)

**실행 항목이 하나도 없다.** 이 문서는 빈 자리를 채우려고 만든 것이 아니라,
"안드로이드는 어디까지 돼 있고 시작하려면 무엇이 걸리는가"를 한 곳에 적어 두려고 있다.
안드로이드는 웹 로드맵과 iOS 로드맵 **양쪽 모두에서 명시적으로 범위 밖**이다.

- 웹: "모바일 킷(iOS/Android) — 전제에서 범위 밖"
- iOS: "범위는 iOS 시뮬레이터 확인까지. **Android 빌드**·앱스토어 배포·실제 백엔드 연동은 범위 밖"

## 이미 있는 것

`ios/` 의 Expo 앱은 **크로스 플랫폼 코드베이스**다. 디렉터리 이름이 `ios` 일 뿐,
안드로이드 전용 코드를 새로 쓸 일은 원칙적으로 없다. `ios/app.json` 에 안드로이드 블록이
이미 채워져 있다(스캐폴딩 기본값이 아니다):

- `package`: `ac.skhu.petition`
- 적응형 아이콘 3종(`foregroundImage`·`backgroundImage`·`monochromeImage`) — 에셋 파일 존재
- `predictiveBackGestureEnabled: false`
- 공통: `scheme: "skhupetition"`, `orientation: "portrait"`, `userInterfaceStyle: "light"`, `newArchEnabled: true`

부품 쪽도 플랫폼 전용 API 를 쓰지 않는다. `Select` 가 한때 `ActionSheetIOS`(iOS 전용)를
썼으나 공용 `Sheet` 로 바뀌면서 없어졌고, 그 `Sheet` 는 `onRequestClose` 를 물려 두어
**안드로이드 하드웨어/제스처 뒤로가기로 닫힌다.**

## 시작한다면 걸리는 것

확인된 사실이 아니라 **착수 전에 확인해야 할 목록**이다. 아직 아무것도 실행해 보지 않았다.

- **에뮬레이터 실사** — iOS 에서 확인된 것(NativeWind 런타임, 셸, 시트)이 안드로이드에서
  자동으로 성립하지는 않는다. iOS 에서 M0-6 이 그랬듯 **스모크 확인이 먼저**다.
- **그림자** — `tokens.js` 의 그림자는 CSS blur → iOS `shadowRadius`(≈blur/2) 로 환산한 값이다.
  안드로이드는 `elevation` 이라 이 환산이 그대로 통하지 않는다. 값이 두 번째로 갈라지는 지점.
- **폰트** — `Apple SD Gothic Neo` 는 애플 기기 폴백이다. 안드로이드에는 없으므로 한글 서체를
  다시 정해야 하고, 그 순간 iOS 로드맵 M3-2 의 "700/800 굵기 구분" 판단도 다시 해야 한다.
- **상태바·SafeArea** — 상태바 글자색 분기(iOS 의존 G)와 하단 인셋 처리(의존 H)는 안드로이드에서
  내비게이션 바·디스플레이 컷아웃이라는 다른 변수를 만난다.
- **뒤로가기** — 안드로이드에는 시스템 뒤로가기가 있다. 지금 화면 전환은 `react-navigation` 없이
  `screen`+`tab` 상태 머신이므로, 뒤로가기를 상태 머신에 직접 연결해야 한다. 시트는 이미 닫히지만
  **화면 단위 뒤로가기는 아직 아무 데도 붙어 있지 않다.**
- **배포** — Play Store 는 iOS 앱스토어와 마찬가지로 범위 밖이다.
