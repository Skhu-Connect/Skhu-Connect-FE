<img src="assets/brand-logo.png" alt="성공잇다 로고" width="72" />

# 성공잇다 프론트엔드

성공회대학교 학생들이 익명으로 건의하고, 요청을 모아 학교의 답변을 확인하는 서비스입니다.
이 저장소는 **학생 웹, 관리자 웹, iOS 앱**의 화면과 백엔드 API 연동을 담당합니다.

[학생 웹](https://petition-system-two.vercel.app) · [관리자 웹](https://petition-system-two.vercel.app/admin) · [App Store](https://apps.apple.com/kr/app/id6800192649) · [백엔드 저장소](https://github.com/Skhu-Connect/Skhu-Connect-BE)

## 주요 기능

학교 이메일로 재학생 인증을 마친 뒤 익명으로 건의를 등록합니다. 요청이 카테고리별 기준에 도달하면 검토를 거쳐 공식 답변을 확인할 수 있습니다.

| 구분 | 기능 |
| --- | --- |
| 학생 웹 | 이메일 인증, 익명 건의, 검색·필터, 요청·댓글, 북마크·공유, 유사 건의 찾기 |
| 관리자 웹 | 대시보드, 건의·신고 관리, 공식 답변, 카테고리별 도달 기준 설정, 공지사항 관리 |
| iOS 앱 | 건의 탐색·등록·요청, 댓글, 내 활동, 알림 설정, 푸시 알림 |

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| 웹 | React, Vite, React Router, Zustand, Tailwind CSS |
| iOS | React Native, Expo, TypeScript, NativeWind, Firebase Cloud Messaging |
| 배포 | 웹: Vercel / iOS: App Store |


## 폴더 구성

```text
src/
  pages/web/      학생 웹 화면
  pages/admin/    관리자 웹 화면
  components/    공통 UI와 웹·관리자 컴포넌트
  api/           웹 API 연동
  stores/        상태 관리
  index.css      공통 스타일과 디자인 토큰
ios/             iOS 앱과 모바일 API 연동
docs/            API·관리자 기능 문서
```

웹은 개발 환경에서 백엔드를 직접 호출하고, Vercel 배포에서는 `/connect/*` 프록시를 사용합니다. 앱은 백엔드를 직접 호출합니다.

## 개발 담당

| 담당 | 이름 |
| --- | --- |
| 프론트엔드 | 김석환 |
| 백엔드 | 전천우 ([별도 저장소](https://github.com/Skhu-Connect/Skhu-Connect-BE)) |
