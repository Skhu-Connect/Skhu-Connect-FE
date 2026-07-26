/* 전역 토스트. 원본: web-app-v7.jsx 574–582행.
   Web 전용 — Admin 에는 토스트가 없다.

   사용법: 어느 Web 화면에서든 한 줄.
     import { toast } from "../components/Toast";
     toast("공감했습니다");
   <Toaster /> 는 WebLayout 이 한 번만 렌더한다.

   ponytail: 토스트 문구는 도메인 상태가 아니므로 src/stores 에 넣지 않는다.
   구독만 필요하니 이미 있는 zustand 로 모듈 로컬 스토어 하나를 둔다. */

import { create } from "zustand";
import { Icon } from "./ui";

const useToast = create(() => ({ msg: "" }));

let timer;
export function toast(msg) {
  useToast.setState({ msg });
  clearTimeout(timer);
  timer = setTimeout(() => useToast.setState({ msg: "" }), 1900);
}

export function Toaster() {
  const msg = useToast((s) => s.msg);
  if (!msg) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        background: "var(--gray-900)",
        color: "#fff",
        borderRadius: "var(--radius-pill)",
        padding: "13px 22px",
        display: "flex",
        alignItems: "center",
        gap: 9,
        fontSize: 14,
        fontWeight: 600,
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <Icon name="checkCircle" size={18} color="var(--teal-400)" />
      {msg}
    </div>
  );
}
