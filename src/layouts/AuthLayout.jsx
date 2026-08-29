/* 로그인·회원가입 공용 셸. 400px 카드가 그라디언트 위에 떠 있던 이전 모습은 모바일 앱
   로그인 화면을 그대로 옮긴 것처럼 보인다는 지적을 받았다 — 데스크톱 웹에 맞게
   좌(브랜드 문구) · 우(폼) 스플릿 스크린으로 바꾼다.

   모바일은 스플릿을 접고 폼만 한 칸으로 세운다 — 에타에 공유된 링크를 폰에서 열면
   42% 를 브랜드 문구가 가져가 폼이 100px 대로 찌그러졌다. 문구는 숨기고(영상과 좌상단
   로고가 이미 브랜드를 보여준다) 가장자리 여백도 좁힌다.

   배경은 캠퍼스 영상(이슈 #24). 폼을 담던 흰 패널은 뺐다 — 스크림이 오른쪽까지
   충분히 어두워서 패널 없이도 글자가 읽힌다. */

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useIsMobile } from "../utils/useIsMobile";

// 화면 가장자리 여백. 왼쪽 문구와 오른쪽 폼이 같은 값을 써야 좌우가 대칭으로 앉는다.
const EDGE = 56;
const FORM_WIDTH = 400;

// 영상 위에 얹는 스크림 두 겹. 뒤의 linear 는 화면 전체 바닥 톤이고, 앞의 radial 은 흰 카드를
// 대신해 폼 뒤에만 고이는 어둠이다 — 테두리 없이 대비만 주므로 뺀 흰 배경을 다시 들여오지
// 않는다(폼이 앉는 오른쪽 71% 지점이 중심).
// 값은 영상에서 가장 밝은 프레임(한낮) 기준으로 잡았다. 인디고로 물들이지 않고 어둡게만 깐다 —
// 브랜드 색을 겹치면 노을이 통째로 보라로 죽는다.
const SCRIM =
  // 폼이 오른쪽 끝(EDGE + 폼폭 400 의 절반)에 앉으므로 그 자리를 px 로 따라간다. % 로 잡으면
  // 창 폭이 바뀔 때 어둠이 폼에서 미끄러진다.
  `radial-gradient(58% 82% at calc(100% - ${EDGE + FORM_WIDTH / 2}px) 50%, rgba(8,8,22,.8) 0%, rgba(8,8,22,.46) 55%, rgba(8,8,22,0) 80%),` +
  "linear-gradient(100deg, rgba(10,10,26,.9) 0%, rgba(14,14,36,.76) 24%, rgba(14,14,36,.5) 46%, rgba(12,12,30,.56) 74%, rgba(10,10,26,.7) 100%)";

// 카드가 사라지면서 폼 글자가 영상 위에 바로 앉는다. 프리미티브(Input·Select)를 고치는 대신
// 이 컨테이너에서 토큰만 갈아끼운다 — CSS 변수는 상속되므로 auth 화면 안에서만 밝은 팔레트가
// 되고, 같은 프리미티브를 쓰는 관리자 콘솔은 그대로다.
const LIGHT_ON_VIDEO = {
  // 여기만 dark 로 뒤집는다(:root 는 light 그대로). UA 가 그리는 것들 — placeholder 회색,
  // select 드롭다운 목록, 비밀번호 표시 아이콘 — 이 알아서 어두운 팔레트로 따라온다.
  colorScheme: "dark",
  color: "#fff",
  "--text-strong": "#fff",
  // 사진 위 12~13px 보조 문구라 .72 로는 AA 가 안 나온다. 어두운 면 위 흰 글자는 옅게 깔아도
  // 위계가 충분히 읽히므로 대비 쪽으로 올린다.
  "--text-muted": "rgba(255,255,255,.84)",
  // 흰 반투명(.16)은 영상이 밤 장면일 땐 잘 보이지만, 낮 장면(밝은 건물·하늘)이 필드 뒤를
  // 지날 때 옅은 흰 틴트가 묻혀 테두리째로 안 보인다(이슈 리포트: 학과 선택란 보호색).
  // 영상 밝기와 무관하게 항상 도드라지도록 스크림과 같은 톤의 어두운 채움으로 바꾼다 —
  // 밝은 배경 위에서도 채움 자체가 어두우니 그 위의 흰 테두리가 항상 대비를 갖는다.
  "--surface-card": "rgba(10,10,26,.55)",
  "--border-strong": "rgba(255,255,255,.42)",
  // 포커스 표시도 같이 뒤집는다. 프리미티브가 쓰는 원래 값(--indigo-400 #605dbe, 반투명 인디고
  // 링)은 흰 카드 기준이라 영상 위에서는 평상시 테두리보다 오히려 안 보인다 — 포커스했더니
  // 흐려지는 꼴이 된다.
  "--indigo-400": "#ffffff",
  "--focus-ring": "rgba(255,255,255,.38)",
  // 원래 빨강(#e5354a)은 어두운 배경에서 대비 3.4:1 로 AA 미달이다. 어두운 면 위에서만 쓰는
  // 밝은 빨강으로 올린다 — 토큰 원본은 안 건드리므로 다른 화면 오류 문구는 그대로다.
  "--danger-500": "#ff8a92",
};

// ponytail: 프로젝트에 @media 가 하나도 없어 CSS 대신 matchMedia 로 본다. 모듈 로드 시
// 한 번만 읽는다 — 로그인 화면에서 설정을 바꿔가며 쓰는 시나리오는 없다.
const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// 등장 속도를 한 곳에서 잡는다. 지속시간과 지연을 같은 배수로 밀어야 리듬이 안 깨진다.
const FADE = 1.1; // 한 조각이 떠오르는 시간(초)

const SEAM_FADE = 0.6; // 루프 이음매에서 영상이 빠지는 시간(초)
const SEAM_WINDOW = 1.2; // 끝에서 이만큼 남았을 때 빼기 시작한다

// 왼쪽 패널 문구는 두 화면이 똑같다(학교 슬로건 + 서비스명). 화면별로 다를 게 없어서
// prop 으로 받지 않고 여기 둔다.
const EYEBROW = "SUNGKONGHOE UNIVERSITY";
const SLOGAN = [
  { text: "더불어 사는 큰 사람을 키우는 곳,", weight: 500 },
  { text: "인권과 평화의 대학", weight: 800 },
];
const VOICE_LINE = "당신의 목소리를 들려주세요";
const SERVICE_NAME = "성공잇다";

// 글자 하나가 늦게 들어오는 정도. 뒤의 항은 순서를 살짝 흐트러뜨리는 지터다 — 완전한 좌→우
// 순서보다 학교 홍보영상 자막처럼 흩어져 들어오는 쪽에 가깝다. 결정론적이라 리렌더해도 같다.
const charOffset = (index) => index * 0.06 + ((index * 7) % 5) * 0.05;
const lineDelay = (line) => 0.5 + line * 0.7;
// 슬로건 마지막 글자가 앉은 뒤에 서비스명이 따라 나온다.
const MARK_DELAY =
  lineDelay(SLOGAN.length - 1) + charOffset(SLOGAN[SLOGAN.length - 1].text.length - 1) + 0.45;

// ponytail: @keyframes 를 새로 들이는 대신 마운트 직후 상태를 한 번 뒤집어 transition 으로
// 처리한다. 이 프로젝트는 CSS 파일이 토큰 정의뿐이고 나머지가 전부 인라인 스타일이다.
const rise = (shown, delay, dy = 14) => ({
  opacity: shown ? 1 : 0,
  transform: shown ? "none" : `translateY(${dy}px)`,
  // opacity 0 은 그리지만 않을 뿐 클릭·포커스·자동완성이 그대로 닿는다. 폼이 아직 안 보이는
  // 동안 안 보이는 입력칸에 포커스가 가는 걸 막으려면 visibility 가 필요하다.
  // 전환 시간을 0s 로 두고 지연만 주면, 페이드가 시작되는 바로 그 순간 보이면서 조작 가능해진다
  // (페이드 도중에는 눈에 보이므로 막지 않는다).
  visibility: shown ? "visible" : "hidden",
  transition: reduceMotion
    ? "none"
    : `opacity ${FADE}s ease, transform ${FADE}s cubic-bezier(.2,.7,.3,1), visibility 0s`,
  transitionDelay: `${delay}s`,
});

// 글자 단위 등장. 조각을 span 으로 쪼개면 보조기술이 한 자씩 읽으므로, 부모 쪽에서 원문을
// 통째로 노출하고(h1 의 aria-label · role="img") 조각마다 aria-hidden 을 박아 트리에서 뺀다.
// role="img" 가 자식을 알아서 지워줄 거라 믿으면 안 된다 — Chromium AX 트리에는 그대로 남는다.
function Chars({ text, shown, start }) {
  return [...text].map((ch, i) => (
    <span key={i} aria-hidden="true" style={{ display: "inline-block", whiteSpace: "pre", ...rise(shown, start + charOffset(i), 18) }}>
      {ch}
    </span>
  ));
}

export default function AuthLayout({ children }) {
  const isMobile = useIsMobile();
  // 좌우 여백. 모바일에서 56px 을 그대로 쓰면 390px 화면에서 폼 폭이 절반 넘게 깎인다.
  const edge = isMobile ? 20 : EDGE;
  const video = useRef(null);
  // 상태는 엘리먼트에서 파생시킨다(onPlay·onPause). 여기서 "autoplay 는 성공했겠지" 하고
  // 넘겨짚으면 자동재생이 막히는 환경(iOS 저전력 모드 등)에서 멈춘 영상 위에 "멈추기" 가 뜬다.
  const [playing, setPlaying] = useState(false);

  // 첫 페인트는 감춘 상태로 나가고 그 다음 프레임에 뒤집는다 — 같은 프레임에 바꾸면
  // 브라우저가 시작·끝 스타일을 한꺼번에 계산해 transition 이 통째로 생략된다.
  const [shown, setShown] = useState(reduceMotion);
  useEffect(() => {
    if (reduceMotion) return;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // WCAG 2.2.2 — 5초 넘게 저절로 움직이는 배경은 멈출 수단이 있어야 한다.
  // prefers-reduced-motion 은 OS 설정을 켠 사람만 덮으므로 그것만으로는 충족되지 않는다.
  const toggle = () => {
    const v = video.current;
    if (!v) return;
    // play() 는 거부될 수 있다(자동재생 정책·디코드 실패). 거부돼도 onPlay 가 안 오므로
    // 라벨은 저절로 "재생" 에 머문다 — 여기서 따로 상태를 만질 게 없다.
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  // 영상이 낮→밤 타임랩스라 루프 이음매에서 밤이 대낮으로 컷된다. 끝에서 뒤에 깔린 브랜드
  // 그라디언트로 흘려보냈다가 새 루프에서 되살린다 — 재인코딩 없이 컷만 지운다.
  // timeupdate 는 초당 4번쯤만 와서 시작이 최대 0.25초 늦는다. 창(1.2초)을 페이드(0.6초)보다
  // 넉넉히 잡아야 랩 전에 0 에 닿는다 — 안 그러면 컷이 지워지지 않고 흐려지기만 한다.
  const fadeAtSeam = (e) => {
    const v = e.currentTarget;
    v.style.opacity = v.duration && v.currentTime > v.duration - SEAM_WINDOW ? "0" : "1";
  };

  // 이음매 구간에서 정지를 누르면 opacity 를 1 로 되돌릴 timeupdate 가 더 안 온다 —
  // 영상이 사라진 채로 굳는다. 멈출 때 무조건 되살린다.
  const onPause = (e) => {
    setPlaying(false);
    e.currentTarget.style.opacity = "1";
  };

  return (
    // 배경 그라디언트는 영상 뒤에 깔아두는 안전판이다. 영상이 아직 안 왔거나, 못 틀거나,
    // 전체화면 전환 중에 비디오 레이어가 한 프레임 늦게 따라오면 그 사이 흰 페이지 배경이
    // 오른쪽에 드러났다 — 뒤가 브랜드 색이면 그 순간에도 화면이 안 깨진다.
    <div style={{ position: "relative", isolation: "isolate", minHeight: "100vh", display: "flex", alignItems: "center", background: "var(--gradient-hero)" }}>
      {/* poster 가 있어 영상이 버퍼링되는 동안에도 같은 구도가 보인다. reduce 면 그 정지 화면에서
          멈추고, 틀지도 않을 4.1MB 를 받지 않도록 preload 도 같이 끈다.
          fixed 라 컨테이너 높이·너비와 무관하게 항상 뷰포트를 덮는다(회원가입 2단계처럼 세로로
          넘칠 때 배경이 같이 밀려 올라가지도 않는다). */}
      <video
        ref={video}
        src="/campus-hero.mp4"
        poster="/campus-hero.jpg"
        autoPlay={!reduceMotion}
        muted
        loop
        playsInline
        preload={reduceMotion ? "none" : "auto"}
        onTimeUpdate={fadeAtSeam}
        onPlay={() => setPlaying(true)}
        onPause={onPause}
        aria-hidden="true"
        tabIndex={-1}
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: -2, pointerEvents: "none", transition: `opacity ${SEAM_FADE}s linear` }}
      />
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: -1, background: SCRIM }} />

      <Link to="/" style={{ position: "absolute", top: 40, left: edge, display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#fff", ...rise(shown, 0.1, 8) }}>
        <img src="/logo.png" alt="" width={34} height={34} style={{ borderRadius: 10, display: "block" }} />
        <span style={{ fontWeight: 800, fontSize: 17 }}>{SERVICE_NAME}</span>
      </Link>

      {/* 두 칸의 높이를 맞추는 장치다. 행 높이는 더 큰 쪽(폼)이 정하고 grid 가 두 칸을 거기 맞춰
          늘린다 — 그래서 왼쪽 문구가 폼과 같은 세로 구간을 차지한다. flex 로는 형제의 높이를
          알 수 없어 안 된다. */}
      {/* 세로 여백 100px 은 좌상단 로고(top 40 + 34px) 를 피하려는 값이다. 화면이 넉넉하면 행이
          가운데 정렬돼 이 여백이 화면에 안 나타나고, 회원가입 2단계처럼 넘칠 때만 벌어진다. */}
      <div style={{ width: "100%", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "42% 1fr", padding: isMobile ? "92px 0 40px" : "100px 0" }}>
        <div style={{ display: isMobile ? "none" : "flex", padding: `0 ${edge}px`, color: "#fff" }}>
          {/* fit-content 라 이 블록의 폭이 가장 긴 줄(슬로건 1행 "…곳,")에 딱 맞춰진다.
              밑줄이 width:100% 로 그 폭을 그대로 쓰므로 문구를 고쳐도 길이를 다시 재지 않는다.
              (flex 아이템이라 display:inline-block 은 block 으로 뭉개진다 — width 로 잡아야 한다.)
              세로로는 stretch 로 칸 전체를 받고 space-between 이 슬로건을 위·서비스명을 아래로
              민다. gap 은 폼이 짧을 때 둘이 붙지 않게 하는 최소 간격이다. */}
          <div
            style={{
              width: "fit-content",
              maxWidth: 480,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 30,
              textShadow: "0 2px 24px rgba(0,0,0,.5)",
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".07em", marginBottom: 14, ...rise(shown, 0.3, 10), opacity: shown ? 0.92 : 0 }}>
                {EYEBROW}
              </div>

              <h1
                aria-label={SLOGAN.map((l) => l.text).join(" ")}
                // 슬로건 1행이 15자라 36px 이면 1280px 화면에서 좌측 칸(42%)을 넘겨 줄이 접힌다.
                // 접히면 글자 단위 등장이 두 줄로 흩어져 무너지므로 32px 로 잡았다(1280 에서 394/425px).
                style={{ margin: 0, fontSize: 32, lineHeight: 1.42, letterSpacing: "-.02em" }}
              >
                {SLOGAN.map((line, li) => (
                  <span key={line.text} aria-hidden="true" style={{ display: "block", fontWeight: line.weight }}>
                    <Chars text={line.text} shown={shown} start={lineDelay(li)} />
                  </span>
                ))}
              </h1>
            </div>

            {/* 서비스명. 슬로건이 다 앉은 뒤 밑줄이 왼쪽에서 그어지고 이름이 따라 나온다.
                marginBottom: justify-content:space-between 이 이 블록을 컨테이너 맨 아래까지
                붙이므로, 바닥에서 살짝 띄워 위로 당긴다. */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ margin: "0 0 16px", fontSize: 32, fontWeight: 800, lineHeight: 1.42, letterSpacing: "-.02em", ...rise(shown, MARK_DELAY - 0.55, 10) }}>
                {VOICE_LINE}
              </p>
              <div
                aria-hidden="true"
                style={{
                  width: "100%",
                  height: 3,
                  marginBottom: 16,
                  background: "rgba(255,255,255,.55)",
                  transformOrigin: "left center",
                  transform: shown ? "scaleX(1)" : "scaleX(0)",
                  transition: reduceMotion ? "none" : "transform .7s cubic-bezier(.2,.7,.3,1)",
                  transitionDelay: `${MARK_DELAY - 0.25}s`,
                }}
              />
              {/* role="img" + aria-label 이면 쪼갠 글자 조각이 접근성 트리에서 자동으로 빠진다. */}
              <div role="img" aria-label={SERVICE_NAME} style={{ fontSize: 58, fontWeight: 800, letterSpacing: "-.01em", lineHeight: 1.15 }}>
                <Chars text={SERVICE_NAME} shown={shown} start={MARK_DELAY} />
              </div>
            </div>
          </div>
        </div>

        {/* 폼은 가운데가 아니라 오른쪽 끝에 붙는다 — 왼쪽 문구가 화면 왼쪽에서 EDGE 만큼 떨어져
            있으므로 같은 값을 오른쪽에 줘서 좌우 여백을 맞춘다.
            폼은 글자 단위로 쪼개지 않는다 — 헤드라인이 다 앉기 전에 바로 입력할 수 있어야 하므로
            한 덩어리로 짧게 떠오르고 끝낸다.
            className 은 placeholder 하나 때문이다 — 가상 요소라 인라인 스타일로 못 준다. */}
        <div style={{ display: "flex", justifyContent: isMobile ? "center" : "flex-end", padding: `0 ${edge}px` }}>
          <div className="auth-on-video" style={{ width: FORM_WIDTH, maxWidth: "100%", ...LIGHT_ON_VIDEO, ...rise(shown, 0.6, 16) }}>
            {children}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "배경 영상 멈추기" : "배경 영상 재생"}
        style={{
          // 영상과 같이 fixed 다. absolute 로 두면 회원가입 2단계처럼 문서가 넘칠 때
          // 배경은 계속 도는데 정지 수단만 접힘 아래로 밀려난다.
          position: "fixed", right: 24, bottom: 24,
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 34, height: 34, padding: 0,
          borderRadius: "var(--radius-full)",
          // 테두리가 .3 이면 영상 대비 2.4:1 로 1.4.11 미달이라 컨트롤 경계가 안 보인다.
          border: "1px solid rgba(255,255,255,.55)",
          background: "rgba(0,0,0,.42)",
          color: "rgba(255,255,255,.9)",
          cursor: "pointer",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
          {playing ? <path d="M2 1h3v10H2zM7 1h3v10H7z" /> : <path d="M3 1l8 5-8 5z" />}
        </svg>
      </button>
    </div>
  );
}
