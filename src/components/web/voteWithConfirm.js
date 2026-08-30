/* 공감 취소 확인. 취소(voted=true → false)만 확인을 받는다 — 공감을 누르는 쪽은 되돌리기 쉬워
   확인 없이 바로 처리한다(댓글 삭제·청원 복원과 같은 기존 확인 패턴, window.confirm).

   mine 이 true 인데 아직 공감 전이면 서버가 409(SELF_AGREEMENT_NOT_ALLOWED)로 막는다 — 네트워크
   왕복 없이 여기서 먼저 막는다. 이미 공감된 상태(정책을 넣기 전에 자기 글에 공감해 둔 경우)는
   취소만은 그대로 허용한다 — 그게 그 공감을 0건으로 되돌려 삭제로 가는 유일한 경로다. */

import { toast } from "../Toast";

export async function toggleVoteWithConfirm(vote, id, voted, mine) {
  if (mine && !voted) return toast("본인 청원에는 공감할 수 없습니다");
  if (voted && !window.confirm("공감을 취소할까요?")) return;
  try {
    toast((await vote(id)) ? "공감했습니다" : "공감을 취소했습니다");
  } catch (e) {
    // 이전엔 여기 catch 가 없어 vote() 실패가 조용히 묻혔다 — 아래 서버 쪽 최종 방어선
    // (api.toggleEmpathy 의 본인 청원 거부)을 포함해 실패를 사용자에게 보여준다.
    toast(e?.message || "공감 처리에 실패했습니다");
  }
}
