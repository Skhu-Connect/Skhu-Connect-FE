# 관리자 콘솔 실행 로드맵

담당자용 4화면 + 답변 모달. 깃허브 이슈 #1, 작업 브랜치 `feat/#1`·`fix/#1`.

- 학생 웹 · Foundation: [roadmap-web.md](roadmap-web.md)
- iOS 앱: [roadmap-ios.md](roadmap-ios.md) · 안드로이드: [roadmap-android.md](roadmap-android.md)

**관리자 콘솔은 별도 앱이 아니다.** 같은 Vite 빌드 안의 `/admin`·`/admin/manage`·
`/admin/owners`·`/admin/logs` 경로이고, 레이아웃만 `AdminLayout`(navy 사이드바)으로 갈린다.
따라서 아래 셋은 이 문서에 없고 [roadmap-web.md](roadmap-web.md) 에 있다:

| 남의 문서에 있는 것 | 왜 |
|---|---|
| **Phase 0 Foundation** | 토큰·`Icon`·DS 프리미티브 14종·`src/api/`·zustand 스토어·라우터 셸을 학생 웹과 같이 쓴다. Phase 0 없이 관리자 화면을 시작할 수 없다 |
| **Phase 3 Verify** | 픽셀 대조·리뷰·백엔드 스왑 지점 확인을 두 화면군에 한 번에 했다 |
| **Phase 4 배포** | 한 번의 Vercel 배포에 둘 다 들어간다 |

**Phase 0 이 닫히면 Phase 1(학생 웹)과 이 문서는 완전 병렬이다** — 관리자는 학생 웹을
기다리지 않는다. 아래 의존 B 는 스키마 의존이지 코드 의존이 아니다.

관리자에 걸리는 크로스 트랙 의존 3개 (본문은 [roadmap-web.md 의 크로스 트랙 의존](roadmap-web.md#크로스-트랙-의존-병목--여기가-로드맵의-값)):

- **B. 답변 등록 → 학생 웹 상세의 `AdminAnswer` 카드** — 관리자가 학생 웹을 막는 유일한 지점.
  프로토타입은 답변 본문을 버리고 전역 단일 객체를 렌더하므로, `answers` 를 `petitionId` 로
  정규화하고 `answerPetition(id, body)` 가 레코드를 만들게 한다. 쓰기 쪽이 2-7 이다.
- **C. 카테고리 임계치·담당자의 단일 출처** — 학생 웹 등록 화면과 관리자 담당자 카드가 같은
  `categories[].owner` 를 읽어야 한다. 원본은 양쪽이 각자 하드코딩한다.
- **E. DS 프리미티브 공용** — 테이블 `Row`·`AnswerModal`·`Owners` 카드가 쓴다.
  **단 `ThresholdBar` 는 재사용하지 않는다** — 관리자 진행바는 높이 7px·우측 34px `%` 텍스트가
  붙는 별개 시각 산출물이라 재사용하면 픽셀이 어긋난다.

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
