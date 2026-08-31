/* 인증코드 재발송 쿨다운. 서버는 같은 이메일에 60초에 한 번만 코드를 보내준다
   (백엔드 EmailVerification.RESEND_WAIT_SECONDS, 초과하면 429). 화면에서 그 60초를 같이 세지
   않으면 코드를 받자마자 누른 "다시 받기"가 매번 실패하고, 사용자는 이유도 못 본다.
   웹 src/utils/useResendCooldown.js 와 같은 규칙이다 — 한쪽을 고치면 다른 쪽도 고칠 것. */
import { useEffect, useState } from "react";
import { ApiError } from "./api";

export const RESEND_WAIT_SECONDS = 60;

/** [남은 초, 다시 60초로 채우기]. 코드를 막 보낸 직후 뜨는 화면은 initial 을 60 으로 두고 시작한다. */
export function useResendCooldown(initial = 0): [number, () => void] {
  const [left, setLeft] = useState(initial);
  useEffect(() => {
    if (left <= 0) return undefined;
    const id = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  return [left, () => setLeft(RESEND_WAIT_SECONDS)];
}

/** 429(RESEND_TOO_SOON) 인지. 서버가 이미 코드를 보내 둔 상태라 화면도 쿨다운을 시작해야 한다. */
export function isTooSoon(error: unknown): boolean {
  return error instanceof ApiError && error.status === 429;
}

/** 발송·재발송 실패 문구. 429 는 "이메일이 틀렸다"가 아니라 "너무 빨리 눌렀다"다 — 그렇게 말해준다.
    서버 title 은 영어("Email verification request failed")라 그대로 띄우면 안내가 안 된다. */
export function sendCodeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    /* 이 엔드포인트의 title 은 항상 영어라 사용자에게 보여줄 게 못 된다 — fallback 을 쓴다. */
    return error.status === 429
      ? "인증코드는 1분에 한 번만 보낼 수 있어요. 잠시 후 다시 시도해 주세요."
      : fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
