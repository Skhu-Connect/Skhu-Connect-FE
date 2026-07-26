# 청원시스템 (SKHU Petition System)

성공회대학교 익명 건의·청원 시스템. 학생이 익명으로 건의를 올리고, 다른 학생이 **공감**을 누른다.
공감 수가 임계치(학과 정원 또는 전체 학생 대비 %)를 넘으면 담당 부서로 자동 전달되고 공식 답변이 등록된다.

- **학생 웹** (`/`) — 로그인, 청원 피드, 상세(공감·임계치·댓글·에타 공유), 청원 등록, 북마크
- **관리자 콘솔** (`/admin`) — 대시보드, 청원 관리, 카테고리 담당자, 알림 로그, 답변 작성

## 스택

Vite + React + Tailwind CSS v4 + React Router. 디자인 토큰은 Tailwind `@theme` 으로 이식.

데이터는 현재 목데이터다. 화면은 `src/api/` 의 async 함수만 호출하므로, 백엔드가 준비되면
그 모듈 내부를 `fetch` 로 바꾸는 것으로 연동이 끝난다.

## 실행

```bash
npm install
npm run dev
```

## 설계 원본

`claude.ai/design` 핸드오프 번들(`../design-handoff/`)의 HTML/CSS/JS 프로토타입을 옮긴 것이다.

- `project/청원시스템 Web.dc.html`, `project/app/web-app-v7.jsx` — 학생 웹
- `project/청원시스템 Admin.dc.html`, `project/app/admin-app-v4.jsx` — 관리자 콘솔
- `project/_ds/…/tokens/*.css`, `_ds_bundle.js` — 디자인 토큰·컴포넌트 14종
