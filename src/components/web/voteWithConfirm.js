/* 공감 취소 확인. 취소(voted=true → false)만 확인을 받는다 — 공감을 누르는 쪽은 되돌리기 쉬워
   확인 없이 바로 처리한다(댓글 삭제·청원 복원과 같은 기존 확인 패턴, window.confirm). */

import { toast } from "../Toast";

export async function toggleVoteWithConfirm(vote, id, voted) {
  if (voted && !window.confirm("공감을 취소할까요?")) return;
  toast((await vote(id)) ? "공감했습니다" : "공감을 취소했습니다");
}
