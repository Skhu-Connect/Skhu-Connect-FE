/* 아이콘 — 디자인 원본 HTML 의 <svg> path 를 그대로 옮겼다.
   전부 24x24 stroke 아이콘이라 아이콘 라이브러리로 갈아끼우지 않는다: 이름 매칭이
   빗나가면 획 두께·끝단이 미묘하게 달라져 원본과 어긋난다. */
import Svg, { Circle, Path, Polyline, Rect } from "react-native-svg";

export type IconName =
  | "search"
  | "bell"
  | "arrowLeft"
  | "share"
  | "x"
  | "heart"
  | "heartSolid"
  | "home"
  | "inbox"
  | "user"
  | "plus"
  | "check"
  | "checkCircle"
  | "sort"
  | "lock"
  | "link"
  | "chevronDown"
  | "message"
  | "graduationCap"
  | "facilityBuilding"
  | "dormHouse"
  | "bookOpen"
  | "peopleGroup";

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  /** 원본이 지정한 stroke-width 를 덮어쓸 때만 준다. */
  strokeWidth?: number;
};

export function Icon({ name, size = 20, color = "currentColor", strokeWidth }: Props) {
  const common = {
    stroke: color,
    strokeWidth: strokeWidth ?? DEFAULT_WIDTH[name] ?? 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {render(name, common, color)}
    </Svg>
  );
}

const DEFAULT_WIDTH: Partial<Record<IconName, number>> = {
  check: 3.2,
  plus: 2.4,
  chevronDown: 2.2,
};

function render(name: IconName, p: Record<string, unknown>, color: string) {
  switch (name) {
    case "search":
      return (
        <>
          <Circle cx={11} cy={11} r={8} {...p} />
          <Path d="m21 21-4.3-4.3" {...p} />
        </>
      );
    case "bell":
      return (
        <>
          <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" {...p} />
          <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" {...p} />
        </>
      );
    case "arrowLeft":
      return (
        <>
          <Path d="m12 19-7-7 7-7" {...p} />
          <Path d="M19 12H5" {...p} />
        </>
      );
    case "share":
      return (
        <>
          <Circle cx={18} cy={5} r={3} {...p} />
          <Circle cx={6} cy={12} r={3} {...p} />
          <Circle cx={18} cy={19} r={3} {...p} />
          <Path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" {...p} />
        </>
      );
    case "x":
      return <Path d="M18 6 6 18M6 6l12 12" {...p} />;
    case "heart":
      return <Path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" {...p} />;
    case "heartSolid":
      return <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill={color} stroke="none" />;
    case "home":
      return (
        <>
          <Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" {...p} />
          <Path d="M9 22V12h6v10" {...p} />
        </>
      );
    case "inbox":
      return (
        <>
          <Path d="M22 12h-6l-2 3h-4l-2-3H2" {...p} />
          <Path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" {...p} />
        </>
      );
    case "user":
      return (
        <>
          <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" {...p} />
          <Circle cx={12} cy={7} r={4} {...p} />
        </>
      );
    case "plus":
      return <Path d="M5 12h14M12 5v14" {...p} />;
    case "check":
      return <Path d="M20 6 9 17l-5-5" {...p} />;
    case "checkCircle":
      return (
        <>
          <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" {...p} />
          <Path d="m9 11 3 3L22 4" {...p} />
        </>
      );
    case "sort":
      return (
        <>
          <Path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3" {...p} />
          <Circle cx={14} cy={4} r={2} {...p} />
          <Circle cx={8} cy={12} r={2} {...p} />
          <Circle cx={16} cy={20} r={2} {...p} />
        </>
      );
    case "lock":
      return (
        <>
          <Rect x={3} y={11} width={18} height={11} rx={2} {...p} />
          <Path d="M7 11V7a5 5 0 0 1 10 0v4" {...p} />
        </>
      );
    case "link":
      return (
        <>
          <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" {...p} />
          <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" {...p} />
        </>
      );
    case "chevronDown":
      return <Polyline points="6 9 12 15 18 9" {...p} />;
    case "message":
      return <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" {...p} />;

    /* 건의 분류 5종. 웹 src/components/ui/Icon.jsx 의 같은 이름 지오메트리를 그대로 옮겼다
       (원본: skhu_tag_components/category/icon_only/*.svg). */
    case "graduationCap":
      return (
        <>
          <Path d="M3 9l9-5 9 5-9 5-9-5Z" {...p} />
          <Path d="M7 11.5V16c0 1.4 2.2 3 5 3s5-1.6 5-3v-4.5" {...p} />
          <Path d="M21 9v6" {...p} />
        </>
      );
    case "facilityBuilding":
      return (
        <>
          <Path d="M4 21V5h7v16" {...p} />
          <Path d="M11 9h9v12" {...p} />
          <Path d="M7 8h1M7 12h1M7 16h1M15 12h1M15 16h1" {...p} />
          <Path d="M2 21h20" {...p} />
        </>
      );
    case "dormHouse":
      return (
        <>
          <Path d="M3 10.5 12 3l9 7.5" {...p} />
          <Path d="M5 9.5V21h14V9.5" {...p} />
          <Path d="M9 21v-7h6v7" {...p} />
        </>
      );
    case "bookOpen":
      return (
        <>
          <Path d="M3 5.5c3-1 6-.4 9 2v13c-3-2.4-6-3-9-2V5.5Z" {...p} />
          <Path d="M21 5.5c-3-1-6-.4-9 2v13c3-2.4 6-3 9-2V5.5Z" {...p} />
        </>
      );
    case "peopleGroup":
      return (
        <>
          <Circle cx={8} cy={8} r={3} {...p} />
          <Circle cx={16} cy={8} r={3} {...p} />
          <Path d="M2.5 20c.3-4 2.4-6 5.5-6s5.2 2 5.5 6" {...p} />
          <Path d="M10.5 20c.3-4 2.4-6 5.5-6s5.2 2 5.5 6" {...p} />
        </>
      );
  }
}
