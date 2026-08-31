/* 인증코드 재발송 쿨다운. 서버는 같은 이메일에 60초에 한 번만 코드를 보내준다
   (백엔드 EmailVerification.RESEND_WAIT_SECONDS, 초과하면 429). 화면에서 그 60초를 같이 세지
   않으면 코드를 받자마자 누른 "다시 받기"가 매번 실패하고, 사용자는 이유도 못 본다.
   가입·비밀번호 찾기 두 화면이 같은 엔드포인트를 쓰므로 여기 하나만 둔다. */
import { useEffect, useState } from "react";

export const RESEND_WAIT_SECONDS = 60;

/** [남은 초, 다시 60초로 채우기]. 코드를 막 보낸 직후 뜨는 화면은 initial 을 60 으로 두고 시작한다. */
export function useResendCooldown(initial = 0) {
  const [left, setLeft] = useState(initial);
  useEffect(() => {
    if (left <= 0) return undefined;
    const id = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  return [left, () => setLeft(RESEND_WAIT_SECONDS)];
}

/** 발송·재발송 실패 문구. 429 는 "이메일이 틀렸다"가 아니라 "너무 빨리 눌렀다"다 — 그렇게 말해준다. */
export function sendCodeErrorMessage(error, fallback) {
  if (error?.status === 429) return "인증코드는 1분에 한 번만 보낼 수 있어요. 잠시 후 다시 시도해 주세요.";
  return fallback;
}
