/* 피드 (ROADMAP 1-3). 원본: web-app-v7.jsx 186–292행.
   한 화면이 경로 3개(/ · /answered · /mine)와 검색 상태에 따라 머리말만 갈아 끼운다 —
   쪼개면 목록·필터가 세 번 중복된다.
   카테고리 탭·정렬은 화면 useState 다(스토어 아님). 검색어는 Header 가 들고 Outlet context 로 내려온다.

   이슈 #100 ("AI 가 만든 것 같다")로 화면을 다시 짰다. 걷어낸 것:
   - 그라데이션 히어로(42px 제목 + 장식 원 두 개) → 얕은 안내 면 + 이미 있던 캠퍼스 사진
   - 급상승·기간요약 카드 두 장이 목록 위를 덮던 구조 → 목록이 본문, 둘은 오른쪽 보조 열
     (1440px 에서 첫 건의 제목이 y=1095px 에 있었다)
   - 분홍 통계 타일·인디고 알약 칩 → 중립 숫자·밑줄 탭. 강조는 인디고 하나로 모은다
   - 카드 그리드 → 목록 행(FeedParts). 최소 340px 열이 390px 화면에서 가로로 넘쳤다
   레이아웃 클래스는 index.css 의 .feed-* 다 — 모바일 한 열 접힘에 미디어 쿼리가 필요하다.

   데이터·필터·정렬·기간 계산은 그대로다. 화면만 바꾼다. */

import { useRef, useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { usePetitions } from "../../stores/petitions";
import { Button, CATEGORIES, ConfirmDialog, Icon, IconButton } from "../../components/ui";
import { EmptyState, PageIntro, PetitionList } from "../../components/web/FeedParts";
import { toast } from "../../components/Toast";
import { ReportDialog } from "../../components/web/ReportDialog";

/* 카카오톡 채팅방 상단 공지처럼 — 기본은 현재 공지 제목 한 줄(처음엔 최신 것), 펼치면 그 한 건만
   본문까지 보이고 오른쪽 버튼으로 다음 공지로 넘어간다. 마지막 다음은 처음으로 돈다 — 버튼이
   하나뿐이라 되돌아갈 다른 길이 없다. 닫으면 헤더 확성기로 되살린다(닫힘은 WebLayout 이 들고 있다).
   인디고 면 + 알약 개수 배지였던 것을 한 줄 띠로 낮췄다 — 공지는 본문이 아니라 알림이다. */
function NoticeRow({ notices, onClose }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const current = notices[idx] ?? notices[0];
  const many = notices.length > 1;

  return (
    <>
      <div className="feed-notice">
        <Icon name="megaphone" size={17} color="var(--color-primary)" />
        <button type="button" className="feed-notice-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {/* 접혔을 때만 한 줄로 자른다 — 펼치면 이 줄이 그 공지의 제목 역할을 그대로 해서 본문 위에 제목을 또 쓰지 않는다. */}
          <span className="feed-notice-title">{current.title}</span>
          <Icon name="chevronDown" size={16} style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : undefined }} />
        </button>
        {/* 접힌 줄에서 "더 있다"를 알리는 건 이 숫자뿐이다 — 한 건이면 알릴 것이 없어 안 그린다. */}
        {many && (
          <>
            <span className="feed-notice-count">
              {idx + 1} / {notices.length}
            </span>
            <IconButton variant="ghost" size={32} ariaLabel="다음 공지" onClick={() => setIdx((i) => (i + 1) % notices.length)}>
              <Icon name="chevronRight" size={16} />
            </IconButton>
          </>
        )}
        <IconButton variant="ghost" size={32} ariaLabel="공지사항 닫기" onClick={onClose}>
          <Icon name="x" size={16} />
        </IconButton>
      </div>
      {open && (
        <p className="feed-notice-body">
          {current.content}
          <time>{current.date}</time>
        </p>
      )}
    </>
  );
}

/** 홈 머리말. 문구는 원래 히어로의 것을 그대로 쓴다 — 바꾼 것은 크기와 배경뿐이다. */
function FeedIntro() {
  return (
    <section className="feed-intro">
      <div className="feed-intro-copy">
        <h1>당신의 목소리를 들려주세요</h1>
      </div>
      <img src="/campus-hero.jpg" alt="성공회대학교 캠퍼스" width="360" height="176" />
    </section>
  );
}

/* 급상승·기간요약이 공유하는 기간 정의. "전체"는 ms:null 로 시작점을 안 걸러 전체 기간을 뜻한다.
   ponytail: 진짜 "그 기간에 새로 발생한 공감 수"를 내려면 공감 이벤트마다 시각이 있어야 하는데
   백엔드 AgreementResponse 는 누적 agreementCount 만 준다(docs/api-spec.md). 그래서 기간별
   집계는 "그 기간에 새로 등록된 건의"만 걸러 그 건의들의 누적 공감 수를 더하는 근사치로 낸다 —
   오래된 건의가 그 기간에 새로 받은 공감은 못 잡는다. 정확한 수치가 필요해지면 백엔드에 공감
   이벤트 타임스탬프부터 요청해야 한다. */
const PERIODS = [
  { key: "day", label: "일간", ms: 86400000 },
  { key: "week", label: "주간", ms: 7 * 86400000 },
  { key: "month", label: "월간", ms: 30 * 86400000 },
  { key: "all", label: "전체", ms: null },
];

/** 보조 열 — 급상승 TOP 5 와 기간 요약. 둘은 같은 period 를 공유한다.
    통계는 아이콘 타일·색 면 없이 숫자만 둔다. 목록이 본문이고 이쪽은 곁다리다. */
function FeedSide({ trending, newCount, newEmpathy, period, onPeriod, onMore }) {
  const label = (PERIODS.find((p) => p.key === period) ?? PERIODS[0]).label;

  return (
    <aside className="feed-side">
      <section className="feed-trending">
        <h2>급상승 건의 TOP 5</h2>
        <div className="feed-period" role="group" aria-label="급상승 기간">
          {PERIODS.map((p) => (
            <button key={p.key} type="button" aria-pressed={p.key === period} onClick={() => onPeriod(p.key)}>
              {p.label}
            </button>
          ))}
        </div>
        {trending.length === 0 ? (
          <p className="feed-page-desc">선택한 기간에 새로 등록된 건의가 없어요.</p>
        ) : (
          <ol>
            {trending.map((p, i) => (
              <li key={p.id}>
                <span className="rank">{i + 1}</span>
                <Link to={`/p/${p.id}`}>
                  <span>{p.title}</span>
                  <small>
                    {(CATEGORIES[p.category] ?? CATEGORIES.facility).label}
                    <b>요청 {p.current.toLocaleString()}</b>
                  </small>
                </Link>
              </li>
            ))}
          </ol>
        )}
        {/* TOP 5 너머를 보여줄 별도 화면 대신 아래 목록을 전체·요청순으로 맞추고 그리로 스크롤한다(사용자 지시). */}
        <button type="button" className="feed-more" onClick={onMore}>
          더보기
          <Icon name="arrowRight" size={15} />
        </button>
      </section>

      <section className="feed-summary">
        <h2>
          기간 요약 <span>({label})</span>
        </h2>
        <dl>
          <div>
            <dt>총 신규 건의 수</dt>
            <dd>
              {newCount}
              <span>건</span>
            </dd>
          </div>
          {/* 누적 요청이라 "새로 발생한" 이라고는 못 쓴다 — PERIODS 주석의 근사치 한계 참고. */}
          <div>
            <dt>총 신규 요청 수</dt>
            <dd>
              {newEmpathy.toLocaleString()}
              <span>회</span>
            </dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}

export default function FeedScreen({ nav = "feed" }) {
  const petitions = usePetitions((s) => s.petitions);
  const categories = usePetitions((s) => s.categories);
  const { query, notices, onCloseNotice } = useOutletContext();
  const navigate = useNavigate();
  const [cat, setCat] = useState("all");
  // 청원 등록 직후에는 최신순으로 연다 — 요청 0인 새 청원이 요청순에서 맨 아래로 밀리기 때문.
  const [sort, setSort] = useState(useLocation().state?.sort ?? "hot");
  /* 기본값이 일간이면 최근 24시간에 등록된 건의가 있어야 두 구역이 차는데, 이 서비스는 등록
     빈도가 그만큼 높지 않아 첫 화면이 거의 늘 비어 보인다. 월간으로 열어 두고 좁히는 건 탭에 맡긴다. */
  const [period, setPeriod] = useState("month");
  // 차단은 스토어(petitions)에서 바로 지워지므로 여기선 API 호출과 토스트만 맡는다.
  const blockPetitionAuthor = usePetitions((s) => s.blockPetitionAuthor);
  const reportPetition = usePetitions((s) => s.reportPetition);
  const removePetition = usePetitions((s) => s.removePetition);
  const [reportId, setReportId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  /* 급상승의 "더보기" — TOP 5 너머를 보여줄 별도 화면 대신 아래 목록을 전체·요청순으로 맞추고
     그 자리로 스크롤한다(사용자 지시). 스크롤 없이 정렬만 바꾸면 화면 밖에서 일어나 아무 반응이
     없어 보인다. */
  const listRef = useRef(null);
  const showAllByEmpathy = () => {
    setCat("all");
    setSort("hot");
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDelete = () => {
    removePetition(deleteId)
      .then(() => toast("건의를 삭제했습니다"))
      .catch((e) => toast(e?.message || "삭제에 실패했습니다"));
  };

  const handleBlock = (id) => {
    blockPetitionAuthor(id)
      .then(() => toast("작성자를 차단했습니다"))
      .catch((e) => toast(e?.message || "차단에 실패했습니다"));
  };

  /* 관리자가 숨긴 청원은 공개 목록(GET /connect/petitions)에서 서버가 이미 걸러 준다 — 학생 응답엔
     hidden 필드조차 없다. 다만 스토어(usePetitions.petitions)를 관리자 콘솔(loadAdmin)과 공용으로
     쓰기 때문에, 관리자가 콘솔에서 학생 화면으로 넘어온 직후 loadFeed 가 끝나기 전까지는 숨김 청원이
     남아 있는 목록이 그대로 그려진다. 여기서 한 번 걸러 목록·급상승 양쪽이 그 창을 타지 않게 한다. */
  const visible = petitions.filter((p) => !p.hidden);
  const base = nav === "answered" ? visible.filter((p) => p.status === "answered") : nav === "mine" ? visible.filter((p) => p.mine) : visible;
  let list = base.filter((p) => cat === "all" || p.category === cat);
  const q = query.trim();
  const needle = q.toLowerCase();
  if (needle) list = list.filter((p) => `${p.title} ${p.excerpt}`.toLowerCase().includes(needle));
  // 만료(30일 경과) 청원은 기본 피드에서 뺀다. 검색 결과와 /mine(마이페이지 진입 지점)에는 남긴다.
  else if (nav !== "mine") list = list.filter((p) => !p.expired);
  list = [...list].sort((a, b) => (sort === "hot" ? b.current - a.current : b.id - a.id));

  // 급상승·기간요약은 카테고리/정렬 선택과 무관하게 항상 선택된 기간 전체를 본다.
  const periodDef = PERIODS.find((p) => p.key === period) ?? PERIODS[0];
  const periodStart = periodDef.ms == null ? 0 : Date.now() - periodDef.ms;
  const periodPetitions = nav === "feed" && !needle ? base.filter((p) => !p.expired && Date.parse(p.createdAt) >= periodStart) : [];
  const trending = [...periodPetitions].sort((a, b) => b.current - a.current).slice(0, 5);
  const newCount = periodPetitions.length;
  const newEmpathy = periodPetitions.reduce((sum, p) => sum + p.current, 0);

  // 홈(검색 안 함)일 때만 안내 면과 보조 열을 쓴다. 나머지는 제목 한 줄 + 한 열이다.
  const isHome = nav === "feed" && !needle;

  return (
    <div className="feed-page">
      {deleteId !== null && (
        <ConfirmDialog
          title="이 건의를 삭제할까요?"
          body="삭제하면 되돌릴 수 없고, 목록과 공유 링크에서도 사라집니다. 삭제해도 다음 건의는 마지막 등록 후 10분이 지나야 올릴 수 있습니다."
          confirmLabel="삭제하기"
          onConfirm={handleDelete}
          onClose={() => setDeleteId(null)}
        />
      )}
      {reportId !== null && (
        <ReportDialog
          target="게시글"
          onClose={() => setReportId(null)}
          onSubmit={(reasonType, reasonDetail) => reportPetition(reportId, reasonType, reasonDetail)}
        />
      )}

      {isHome && <FeedIntro />}
      {nav === "feed" && notices.length > 0 && <NoticeRow notices={notices} onClose={onCloseNotice} />}
      {!isHome && (
        <PageIntro
          title={needle ? `‘${q}’ 검색 결과` : nav === "answered" ? "답변 완료" : "내 건의"}
          count={needle ? list.length : base.length}
        />
      )}

      <div className="feed-layout" data-single={isHome ? undefined : ""}>
        <section className="feed-main" ref={listRef} aria-label="건의 목록">
          <div className="feed-list-head">
            {/* 건수는 한 화면에 한 번만 쓴다 — 홈이 아니면 위 제목이 이미 들고 있다. */}
            <h2>건의 목록{isHome && <span>{list.length}건</span>}</h2>
            <select className="feed-sort" aria-label="정렬 방식" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="hot">요청순</option>
              <option value="new">최신순</option>
            </select>
          </div>
          <div className="feed-cat-tabs" role="group" aria-label="카테고리">
            {[{ key: "all", label: "전체" }, ...categories].map((c) => (
              <button key={c.key} type="button" aria-pressed={cat === c.key} onClick={() => setCat(c.key)}>
                {c.label}
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <EmptyState
              title={needle ? `‘${q}’에 대한 검색 결과가 없습니다` : nav === "mine" ? "아직 등록한 건의가 없습니다" : "해당 조건의 건의가 없습니다"}
              desc={needle ? "다른 검색어로 다시 시도해 주세요." : nav === "mine" ? "첫 건의를 익명으로 등록해 보세요." : "다른 카테고리를 선택해 주세요."}
            >
              {nav === "mine" && !needle && (
                <Button variant="primary" onClick={() => navigate("/submit")}>
                  건의 등록
                </Button>
              )}
            </EmptyState>
          ) : (
            <PetitionList
              list={list}
              authorOf={nav === "mine" ? () => "익명 · 내 건의" : undefined}
              onReport={setReportId}
              onBlock={handleBlock}
              onDelete={setDeleteId}
            />
          )}
        </section>

        {isHome && (
          <FeedSide
            trending={trending}
            newCount={newCount}
            newEmpathy={newEmpathy}
            period={period}
            onPeriod={setPeriod}
            onMore={showAllByEmpathy}
          />
        )}
      </div>
    </div>
  );
}
