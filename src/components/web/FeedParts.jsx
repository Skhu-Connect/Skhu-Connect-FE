/* 피드·북마크 화면이 공유하는 3부품 (ROADMAP 1-3 · 1-7).

   이슈 #100 에서 카드 그리드를 목록 행으로 바꿨다. 이유 셋:
   - 같은 테두리 상자가 반복되면서 건의 제목보다 상자가 먼저 읽혔다
   - 최소 340px 열 + 좌우 24px 여백이라 390px 화면에서 가로로 넘쳤다
   - 카드가 클릭 가능한 div 여서 제목을 키보드로 열 수 없었다 — 이제 제목이 링크다

   레이아웃은 index.css 의 .petition-row · .feed-empty 가 맡는다. 모바일에서 행이 접히는 게
   이번 교체의 핵심인데 인라인 style 로는 미디어 쿼리를 못 쓴다. */

import { useState } from "react";
import { Link } from "react-router-dom";
import { ActionMenu, CategoryTag, ConfirmDialog, EmpathyButton, Icon, StatusBadge, petitionStatus } from "../ui";
import { usePetitions } from "../../stores/petitions";
import { toggleVoteWithConfirm } from "./voteWithConfirm";

/** 목록 화면의 머리말. 아이콘 타일이 박힌 테두리 카드였는데 제목 한 줄로 줄였다 —
    화면 이름과 건수만 있으면 되는 자리라 카드를 쓰면 바로 아래 목록과 위계가 겹친다. */
export function PageIntro({ title, count, desc }) {
  return (
    <div>
      <h1 className="feed-page-title">
        {title} <span>{count}건</span>
      </h1>
      {desc && <p className="feed-page-desc">{desc}</p>}
    </div>
  );
}

export function EmptyState({ title, desc, children }) {
  return (
    <div className="feed-empty">
      <Icon name="inbox" size={24} />
      <h3>{title}</h3>
      <p>{desc}</p>
      {children && <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>{children}</div>}
    </div>
  );
}

/** 청원 하나를 나타내는 목록 행. p.current 에는 내 요청이 이미 반영돼 있다(api view) — 여기서 +1 하지 않는다.
    남은 인원만 글로 쓰고 기준 인원은 버튼 아래 보조 숫자로 내렸다 — 카드에선 현재/기준/남은 수가
    한 상자 안에서 세 번 반복됐다. */
export function PetitionRow({ p, author, onReport, onBlock, onDelete }) {
  const voted = usePetitions((s) => !!s.voted[p.id]);
  const vote = usePetitions((s) => s.vote);
  const [blocking, setBlocking] = useState(false);
  const reached = p.current >= p.threshold;

  return (
    <article className="petition-row">
      <div className="petition-row-info">
        <div className="petition-row-meta">
          <CategoryTag category={p.category} size="sm" />
          <StatusBadge status={petitionStatus(p)} size="sm" />
          {/* 오른쪽 끝 앵커(margin-left:auto). 조건부로 그리면 안 된다 — 마감이 없는 청원은
              adaptPetition(api/index.js)이 date: "" 를 내는데, 그때 span 이 사라지면 앵커가
              통째로 없어져 메뉴가 상태 배지 옆까지 튄다. 빈 span 은 폭 0 이라 보이지 않는다. */}
          <span className="petition-row-date">{p.date}</span>
          {(onReport || onBlock || onDelete) && (
            <ActionMenu
              label="게시글 메뉴"
              style={{ marginLeft: 0 }}
              onReport={onReport}
              onBlock={onBlock && (() => setBlocking(true))}
              onDelete={onDelete}
            />
          )}
        </div>
        <h3>
          <Link to={`/p/${p.id}`}>{p.title}</Link>
        </h3>
        <div className="petition-row-foot">
          <span>{author ?? p.author}</span>
          <span>댓글 {p.comments}</span>
          <span className={reached ? "reached" : undefined}>
            {reached ? "담당 부서 전달됨" : `${(p.threshold - p.current).toLocaleString()}명 남음`}
          </span>
        </div>
      </div>
      <div className="petition-row-action">
        <EmpathyButton count={p.current} active={voted} onToggle={() => toggleVoteWithConfirm(vote, p.id, voted, p.mine)} />
        <span>기준 {p.threshold.toLocaleString()}명</span>
      </div>
      {blocking && (
        <ConfirmDialog
          title="이 글을 쓴 사용자를 차단할까요?"
          onConfirm={() => onBlock()}
          onClose={() => setBlocking(false)}
        />
      )}
    </article>
  );
}

/** 삭제는 내 글이면서 요청 0건인 진행중 청원에만 띄운다. 서버가 그때만 허용하므로(아니면 409)
    실패할 버튼을 보여주지 않는다 — 상세 화면과 같은 조건이다. */
export function PetitionList({ list, authorOf, onReport, onBlock, onDelete }) {
  return (
    <div>
      {list.map((p) => (
        <PetitionRow
          key={p.id}
          p={p}
          author={authorOf ? authorOf(p) : undefined}
          onReport={onReport && !p.mine ? () => onReport(p.id) : undefined}
          onBlock={onBlock && !p.mine ? () => onBlock(p.id) : undefined}
          onDelete={onDelete && p.mine && p.current === 0 && p.status === "received" ? () => onDelete(p.id) : undefined}
        />
      ))}
    </div>
  );
}
