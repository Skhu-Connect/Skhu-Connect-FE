# App Store Connect 문항 5 — 외부 서비스·도구·플랫폼 목록

코드 근거: 백엔드 `Skhu-Connect-BE/`, 웹 `skhu-connect/src/`, iOS `skhu-connect/ios/src/`.
런타임에 실제 통신이 발생하는 것과 빌드·배포에만 쓰는 것을 나눠 적는다.

## 요약

성공잇다는 **광고·분석·추적 SDK를 하나도 쓰지 않는다.** 웹·iOS 양쪽 `package.json`,
백엔드 `build.gradle` 어디에도 analytics·ads·attribution 의존성이 없다. 아래 목록은 전부
서비스 동작에 필요한 인프라와 발송 채널이다.

## A. 런타임 외부 서비스 (앱이 실제로 통신한다)

| 서비스 | 제공자 | 역할 | 전송되는 데이터 | 코드 근거 |
|---|---|---|---|---|
| **Railway** | Railway Corp. | 백엔드 API 서버(Spring Boot) 호스팅. 앱의 모든 API 요청이 여기로 간다 | 계정 정보, 청원·댓글 본문, 동의·북마크 기록, FCM 토큰 등 서비스 데이터 전부 | `ios/src/api.ts:16`, `src/api/index.js:21` — `https://skhu-connect-be-production.up.railway.app` |
| **MySQL** (Railway 운영 인스턴스) | Railway Corp. | 서비스 데이터 영구 저장소 | 위와 동일 | `build.gradle`(`com.mysql:mysql-connector-j`), `application.yml`(`DB_URL`) |
| **Vercel** | Vercel Inc. | 학생 웹(`petition-system-two.vercel.app`) 및 정적 문서(개인정보처리방침·이용약관·AASA) 호스팅 | 웹 접속 요청. 개인정보 저장은 없음(정적 서빙) | `vercel.json`, `.vercel/project.json` |
| **Resend** | Resend, Inc. | 회원가입 시 학교 이메일 인증번호 발송 | 수신자 이메일 주소, 인증번호 본문 | `ResendEmailSender.java:15` — `https://api.resend.com/emails` |
| **Firebase Cloud Messaging (FCM)** | Google LLC | 푸시 알림 발송. 서버는 `firebase-admin`으로 발송, 앱은 토큰 발급·수신 | FCM 등록 토큰, 알림 제목·본문, 청원 ID | 서버 `FcmPushService.java`·`build.gradle`(`firebase-admin:9.10.0`), 앱 `ios/src/push.ts`·`@react-native-firebase/messaging` |
| **Apple Push Notification service (APNs)** | Apple Inc. | iOS 푸시 전달 경로. FCM이 APNs를 거쳐 기기로 전달한다 | 알림 페이로드 | `app.json` — `entitlements.aps-environment: production` |
| **jsDelivr CDN** | jsDelivr (오픈소스 CDN) | 웹 전용. Pretendard 웹폰트 로드 | 폰트 요청(접속 IP·User-Agent). 개인정보 전송 없음 | `src/index.css:15` |

> jsDelivr는 **웹에만** 해당한다. iOS 앱은 번들 폰트를 쓰므로 런타임 외부 폰트 요청이 없다.

## B. 빌드·배포·심사 플랫폼 (앱 실행 중 통신하지 않는다)

| 플랫폼 | 역할 | 근거 |
|---|---|---|
| **Expo / EAS Build·Submit** | iOS 바이너리 빌드 및 App Store 제출 | `eas.json`, `app.json`(`extra.eas.projectId`) |
| **Apple App Store Connect** | 앱 배포·심사 | — |
| **Firebase 콘솔** | FCM 프로젝트 설정(`GoogleService-Info.plist`) | `app.config.js` |
| **GitHub** | 소스 코드 저장소 | `.git` |

## C. 앱이 연동하지 않는 것 (오해 방지용 명시)

- **에브리타임** — API 연동이 0건이다. "에타에 공유"는 청원 링크를 **기기 클립보드에
  복사**할 뿐이고, 붙여넣기는 사용자가 직접 한다. 에브리타임으로 데이터가 자동 전송되지
  않는다. 근거: `ios/src/shell.tsx:57`, `src/pages/web/DetailScreen.jsx:30`
- **성공회대학교 포털(`portal.skhu.ac.kr`)** — 가입 화면의 "학교 이메일을 모르시나요?"
  안내 링크로 브라우저를 여는 것뿐이며, 데이터 연동이나 계정 조회는 없다. 학교 이메일
  인증은 Resend로 보낸 인증번호를 앱이 직접 확인하는 방식이다.
  근거: `ios/src/screens/Signup.tsx:14`
- **광고·분석·추적 SDK** — 없음. 따라서 App Store 개인정보 설문의 "추적(Tracking)"은
  전 항목 "아니요"이며 ATT 권한 요청도 하지 않는다. `PrivacyInfo.xcprivacy`의
  `NSPrivacyTracking`도 `false`다(`plugins/withPrivacyManifest.js`).

## D. 국외 이전 고지

Railway·Vercel·Resend·Google(Firebase)·Apple은 모두 국외 사업자이며 서버가 국외에 있다.
개인정보처리방침에 국외 이전 사실을 명시한다(개인정보 보호법 제28조의8).

## E. 제출용 영문 답안 (그대로 붙여넣기)

> A list of the external services, tools, or platforms the app uses to deliver its core
> functionality (for example, data providers, authentication services, payment processors,
> or AI services)

```text
SKHU Connect ("성공잇다") is a student petition platform for Sungkonghoe University.
It uses no advertising, analytics, attribution, or tracking SDKs. Every external
service listed below exists to operate the service itself.

HOSTING AND DATA
- Railway (Railway Corp.) — Hosts our backend API server (Java / Spring Boot). All app
  requests go to it. It also hosts the MySQL database that stores accounts, petitions,
  comments, agreements, bookmarks, and push tokens.
- Vercel (Vercel Inc.) — Hosts the web client and the static legal pages (privacy
  policy, terms of service, apple-app-site-association).

AUTHENTICATION
We do not use a third-party identity provider. Sign-in is our own email and password
(hashed with BCrypt) with JWT access and refresh tokens issued by our backend. The only
external dependency in this flow is:
- Resend (Resend, Inc.) — Transactional email delivery. Sends the one-time verification
  code to the student's university email address during sign-up. Not used for marketing.

NOTIFICATIONS
- Firebase Cloud Messaging (Google LLC) — Push notification delivery. Our server sends
  through firebase-admin; the app obtains an FCM registration token through
  @react-native-firebase/messaging.
- Apple Push Notification service (Apple Inc.) — The iOS delivery path that FCM uses.

WEB ASSETS (web client only)
- jsDelivr — Serves the Pretendard Korean web font to the web client. The iOS app
  bundles its fonts and makes no runtime font requests.

BUILD AND DISTRIBUTION (no runtime communication from the app)
- Expo / EAS Build and Submit — Builds and submits the iOS binary.
- Apple App Store Connect — Distribution and review.
- GitHub — Source code repository.

NOT USED
- No payment processor. The app has no purchases, subscriptions, or in-app payments.
- No AI or machine-learning service.
- No third-party data provider. All content is authored by our own users.
- No advertising, analytics, or tracking SDK. The app performs no tracking and does not
  request App Tracking Transparency permission.
- Everytime (에브리타임, a Korean campus community app) is NOT integrated. The "Share to
  Everytime" button only copies the petition link to the device clipboard; the user
  pastes it manually. No data is transmitted to Everytime.
- The university portal (portal.skhu.ac.kr) is NOT integrated. The sign-up screen links
  to it only so students can look up their university email address.
```

## 유지 규칙

새 외부 서비스를 붙이면 **이 파일과 `public/privacy-policy.html`의 위탁 표를 같이 고친다.**
둘이 벌어지는 순간이 심사·법적 리스크다. 같은 이유로
`ios/appstore-privacy-questionnaire.md`(수집 항목 설문)도 함께 본다.
