/* 모바일 폭 판정. WebLayout(공유 링크 축소 헤더)과 AuthLayout(로그인·가입 1단 배치)이 같은
   기준을 써야 해서 여기 하나만 둔다 — 둘 중 한쪽에 두고 다른 쪽이 import 하면, 로그인 화면
   번들에 반대쪽 레이아웃의 헤더·스토어까지 딸려 들어간다.
   ponytail: 프로젝트에 @media 가 하나도 없어 CSS 대신 matchMedia 로 본다. */
import { useEffect, useState } from "react";

export const MOBILE_QUERY = "(max-width: 767px)";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}
