/* 북마크 (ROADMAP 1-7). 원본: web-app-v7.jsx 500–527행.
   머리말·그리드·빈 상태는 피드와 같은 부품이다(FeedParts). */

import { usePetitions } from "../../stores/petitions";
import { EmptyState, PageIntro, PetitionGrid } from "../../components/web/FeedParts";

export default function BookmarkScreen() {
  // 셀렉터는 원시 상태만 고른다 — 새 배열을 만드는 셀렉터는 zustand 5 에서 무한 렌더가 된다.
  const petitions = usePetitions((s) => s.petitions);
  const bookmarked = usePetitions((s) => s.bookmarked);
  const list = petitions.filter((p) => bookmarked[p.id]);

  return (
    <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "28px var(--page-gutter) 80px", display: "flex", flexDirection: "column", gap: 26 }}>
      <PageIntro
        icon="bookmark"
        bg="var(--indigo-50)"
        fg="var(--indigo-600)"
        title="북마크"
        count={list.length}
        desc="저장해 둔 청원입니다. 상세 화면의 북마크 버튼으로 추가·해제할 수 있습니다."
      />
      {list.length === 0 ? (
        <EmptyState title="저장한 청원이 없습니다" desc="청원 상세 화면에서 북마크 버튼을 눌러 저장해 보세요." />
      ) : (
        <PetitionGrid list={list} />
      )}
    </div>
  );
}
