/* 디자인 시스템 프리미티브 14종.
   스펙 원본: design-handoff/project/_ds/design-system-…/_ds_bundle.js 1–1017행.
   원본이 인라인 style 로 픽셀을 정의하므로 인라인 style 을 그대로 옮긴다 —
   Tailwind 클래스로 바꾸면 값이 드리프트하고 계산값(size*0.4, pct+"%")이 죽는다.
   export 이름은 원본과 동일하다. */

export { Icon, ICON_NAMES } from "./Icon.jsx";
import { Icon } from "./Icon.jsx";

/* ───────────────────────── core ───────────────────────── */

export function Avatar({ src, name = "", size = 44, ring = false, style, ...rest }) {
  const initials = name.trim().slice(0, 2);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "var(--radius-full)",
        background: src ? `center/cover no-repeat url(${src})` : "var(--indigo-100)",
        color: "var(--indigo-700)",
        fontFamily: "var(--font-sans)",
        fontWeight: "var(--fw-bold)",
        fontSize: size * 0.4,
        overflow: "hidden",
        boxShadow: ring ? "0 0 0 3px #fff, 0 0 0 5px var(--indigo-200)" : "none",
        ...style,
      }}
      {...rest}
    >
      {!src && initials}
    </span>
  );
}

const BADGE_TONES = {
  neutral: { bg: "var(--gray-150)", fg: "var(--gray-700)" },
  indigo: { bg: "var(--indigo-50)", fg: "var(--indigo-600)" },
  violet: { bg: "#EAE8F9", fg: "var(--violet-600)" } /* "내부" style */,
  teal: { bg: "var(--teal-50)", fg: "var(--teal-600)" },
  coral: { bg: "#FCE7E9", fg: "var(--coral-600)" },
  success: { bg: "var(--status-answered-bg)", fg: "var(--status-answered-fg)" },
  warning: { bg: "var(--status-review-bg)", fg: "var(--status-review-fg)" },
  danger: { bg: "#FBE2E5", fg: "var(--danger-500)" },
};

export function Badge({ children, tone = "neutral", solid = false, size = "md", style, ...rest }) {
  const t = BADGE_TONES[tone] || BADGE_TONES.neutral;
  const dims = size === "sm" ? { padding: "2px 9px", fontSize: 11 } : { padding: "4px 12px", fontSize: "var(--fs-sm)" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "var(--font-sans)",
        fontWeight: "var(--fw-semibold)",
        lineHeight: 1.4,
        borderRadius: "var(--radius-pill)",
        background: solid ? t.fg : t.bg,
        color: solid ? "#fff" : t.fg,
        ...dims,
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}

const BUTTON_SIZES = {
  sm: { padding: "8px 16px", fontSize: "var(--fs-sm)", height: 36 },
  md: { padding: "11px 22px", fontSize: "var(--fs-body)", height: 44 },
  lg: { padding: "15px 28px", fontSize: "var(--fs-md)", height: 52 },
};

function buttonVariantStyle(variant) {
  switch (variant) {
    case "secondary":
      return { background: "var(--color-secondary)", color: "#fff", border: "1px solid transparent" };
    case "outline":
      return { background: "transparent", color: "var(--color-primary)", border: "1.5px solid var(--indigo-200)" };
    case "ghost":
      return { background: "transparent", color: "var(--color-primary)", border: "1px solid transparent" };
    case "danger":
      return { background: "var(--danger-500)", color: "#fff", border: "1px solid transparent" };
    case "gradient":
      return { background: "var(--gradient-mileage)", color: "#fff", border: "1px solid transparent", boxShadow: "var(--shadow-magenta)" };
    case "primary":
    default:
      return { background: "var(--color-primary)", color: "#fff", border: "1px solid transparent" };
  }
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  pill = true,
  block = false,
  disabled = false,
  leadingIcon,
  trailingIcon,
  onClick,
  type = "button",
  style,
  ...rest
}) {
  const s = BUTTON_SIZES[size] || BUTTON_SIZES.md;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: block ? "flex" : "inline-flex",
        width: block ? "100%" : undefined,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontFamily: "var(--font-sans)",
        fontWeight: "var(--fw-semibold)",
        fontSize: s.fontSize,
        lineHeight: 1,
        padding: s.padding,
        borderRadius: pill ? "var(--radius-pill)" : "var(--radius-md)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "filter .15s ease, transform .05s ease, background .15s ease",
        ...buttonVariantStyle(variant),
        ...style,
      }}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.filter = "none";
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.filter = "brightness(.94)")}
      {...rest}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}

export function Card({ children, padding = "var(--pad-card)", hoverable = false, as: Tag = "div", style, ...rest }) {
  return (
    <Tag
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        padding,
        transition: "box-shadow .18s ease, transform .18s ease",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (hoverable) {
          e.currentTarget.style.boxShadow = "var(--shadow-md)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          e.currentTarget.style.boxShadow = "var(--shadow-sm)";
          e.currentTarget.style.transform = "none";
        }
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

const ICON_BUTTON_VARIANTS = {
  outline: { background: "transparent", color: "currentColor", border: "1.5px solid var(--border-strong)" },
  solid: { background: "var(--color-primary)", color: "#fff", border: "1px solid transparent" },
  ghost: { background: "transparent", color: "var(--text-muted)", border: "1px solid transparent" },
  onDark: { background: "rgba(255,255,255,.16)", color: "#fff", border: "1.5px solid rgba(255,255,255,.5)" },
  soft: { background: "var(--indigo-50)", color: "var(--color-primary)", border: "1px solid transparent" },
};

export function IconButton({ children, size = 40, variant = "outline", ariaLabel, onClick, disabled = false, style, ...rest }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-full)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "filter .15s ease, background .15s ease",
        ...ICON_BUTTON_VARIANTS[variant],
        ...style,
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.filter = "brightness(.92)")}
      onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ───────────────────────── forms ───────────────────────── */

export function Input({ label, hint, error, prefix, suffix, id, style, wrapStyle, ...rest }) {
  const inputId = id || (label ? `in-${label}` : undefined);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...wrapStyle }}>
      {label && (
        <label htmlFor={inputId} style={{ font: "var(--text-label)", color: "var(--text-strong)" }}>
          {label}
        </label>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--surface-card)",
          border: `1.5px solid ${error ? "var(--danger-500)" : "var(--border-strong)"}`,
          borderRadius: "var(--radius-md)",
          padding: "0 14px",
          transition: "border-color .15s ease, box-shadow .15s ease",
        }}
        onFocusCapture={(e) => {
          if (!error) {
            e.currentTarget.style.borderColor = "var(--indigo-400)";
            e.currentTarget.style.boxShadow = "0 0 0 3px var(--focus-ring)";
          }
        }}
        onBlurCapture={(e) => {
          e.currentTarget.style.borderColor = error ? "var(--danger-500)" : "var(--border-strong)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {prefix && <span style={{ color: "var(--text-muted)", display: "inline-flex" }}>{prefix}</span>}
        <input
          id={inputId}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            font: "var(--text-body-role)",
            color: "var(--text-strong)",
            padding: "12px 0",
            ...style,
          }}
          {...rest}
        />
        {suffix && <span style={{ color: "var(--text-muted)", display: "inline-flex" }}>{suffix}</span>}
      </div>
      {(hint || error) && (
        <span style={{ font: "var(--text-caption-role)", color: error ? "var(--danger-500)" : "var(--text-muted)" }}>{error || hint}</span>
      )}
    </div>
  );
}

export function Select({ label, hint, options = [], value, onChange, placeholder = "선택하세요", id, style, wrapStyle, ...rest }) {
  const inputId = id || (label ? `sel-${label}` : undefined);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...wrapStyle }}>
      {label && (
        <label htmlFor={inputId} style={{ font: "var(--text-label)", color: "var(--text-strong)" }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative", display: "flex" }}>
        <select
          id={inputId}
          value={value}
          onChange={onChange}
          style={{
            width: "100%",
            appearance: "none",
            border: "1.5px solid var(--border-strong)",
            borderRadius: "var(--radius-md)",
            padding: "12px 40px 12px 15px",
            font: "var(--text-body-role)",
            color: value ? "var(--text-strong)" : "var(--text-muted)",
            background: "var(--surface-card)",
            outline: "none",
            cursor: "pointer",
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--indigo-400)";
            e.currentTarget.style.boxShadow = "0 0 0 3px var(--focus-ring)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border-strong)";
            e.currentTarget.style.boxShadow = "none";
          }}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => {
            const opt = typeof o === "string" ? { value: o, label: o } : o;
            return (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            );
          })}
        </select>
        <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
      {hint && <span style={{ font: "var(--text-caption-role)", color: "var(--text-muted)" }}>{hint}</span>}
    </div>
  );
}

export function Textarea({ label, hint, error, maxLength, value, id, style, wrapStyle, ...rest }) {
  const inputId = id || (label ? `ta-${label}` : undefined);
  const count = typeof value === "string" ? value.length : undefined;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...wrapStyle }}>
      {label && (
        <label htmlFor={inputId} style={{ font: "var(--text-label)", color: "var(--text-strong)" }}>
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        value={value}
        maxLength={maxLength}
        style={{
          width: "100%",
          minHeight: 128,
          resize: "vertical",
          border: `1.5px solid ${error ? "var(--danger-500)" : "var(--border-strong)"}`,
          borderRadius: "var(--radius-md)",
          padding: "13px 15px",
          font: "var(--text-body-role)",
          color: "var(--text-strong)",
          outline: "none",
          background: "var(--surface-card)",
          transition: "border-color .15s ease, box-shadow .15s ease",
          ...style,
        }}
        onFocus={(e) => {
          if (!error) {
            e.currentTarget.style.borderColor = "var(--indigo-400)";
            e.currentTarget.style.boxShadow = "0 0 0 3px var(--focus-ring)";
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? "var(--danger-500)" : "var(--border-strong)";
          e.currentTarget.style.boxShadow = "none";
        }}
        {...rest}
      />
      <div style={{ display: "flex", justifyContent: "space-between", font: "var(--text-caption-role)" }}>
        <span style={{ color: error ? "var(--danger-500)" : "var(--text-muted)" }}>{error || hint}</span>
        {maxLength != null && count != null && (
          <span style={{ color: "var(--text-muted)" }}>
            {count} / {maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── petition ───────────────────────── */

/* 다섯 카테고리. 아이콘 + 라벨만 쓰고 색으로 구분하지 않는다 — skhu_tag_components/category
   에셋이 전부 무채색(#1F2937) 선 아이콘 + 텍스트라, 카테고리마다 다른 색을 칠하지 않는 게
   이 태그 시스템의 의도다(구분은 아이콘 모양이 한다). 임계치·담당자는 src/api 에 있다. */
export const CATEGORIES = {
  scholarship: { label: "장학", icon: "graduationCap" },
  facility: { label: "시설", icon: "facilityBuilding" },
  dorm: { label: "기숙사", icon: "dormHouse" },
  library: { label: "도서관", icon: "bookOpen" },
  department: { label: "학부", icon: "peopleGroup" },
};

export function CategoryTag({ category = "facility", size = "md", style, ...rest }) {
  const c = CATEGORIES[category] || CATEGORIES.facility;
  const dims = size === "sm" ? { icon: 15, fontSize: 12.5 } : { icon: 18, fontSize: "var(--fs-body)" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "var(--font-sans)",
        fontWeight: "var(--fw-semibold)",
        lineHeight: 1.3,
        color: "var(--text-strong)",
        fontSize: dims.fontSize,
        ...style,
      }}
      {...rest}
    >
      <Icon name={c.icon} size={dims.icon} stroke={2.2} color="var(--text-strong)" />
      {c.label}
    </span>
  );
}

/* 핵심 인터랙션: 공감을 누르면 청원이 임계치로 다가간다. */
export function EmpathyButton({ count = 0, active = false, onToggle, size = "md", block = false, style, ...rest }) {
  const dims =
    size === "lg"
      ? { padding: "14px 26px", fontSize: "var(--fs-md)", icon: 22 }
      : size === "sm"
        ? { padding: "7px 14px", fontSize: "var(--fs-sm)", icon: 16 }
        : { padding: "11px 20px", fontSize: "var(--fs-body)", icon: 19 };
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      style={{
        display: block ? "flex" : "inline-flex",
        width: block ? "100%" : undefined,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontFamily: "var(--font-sans)",
        fontWeight: "var(--fw-bold)",
        fontSize: dims.fontSize,
        lineHeight: 1,
        padding: dims.padding,
        borderRadius: "var(--radius-pill)",
        cursor: "pointer",
        transition: "transform .1s ease, background .15s ease, color .15s ease",
        background: active ? "var(--gradient-mileage)" : "var(--surface-card)",
        color: active ? "#fff" : "var(--coral-600)",
        border: active ? "1.5px solid transparent" : "1.5px solid var(--coral-400)",
        boxShadow: active ? "var(--shadow-magenta)" : "none",
        ...style,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.95)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      {...rest}
    >
      <svg width={dims.icon} height={dims.icon} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
      <span>공감</span>
      <span style={{ fontVariantNumeric: "tabular-nums", opacity: active ? 1 : 0.85 }}>{count.toLocaleString()}</span>
    </button>
  );
}

/* 청원 라이프사이클: received (진행중) → reviewing (검토중) → answered (답변 완료), + 파생 상태 expired (만료됨).
   원본: skhu_tag_components/status/icon_only/*.svg — 색을 채운 원 안에 흰 글리프, 라벨은 중립 텍스트.
   received 는 원본 에셋에 대응 항목이 없어(진행중=in_progress) 라벨을 "진행중"으로 옮겼다. */
const STATUS = {
  received: { label: "진행중", tone: "in-progress" },
  reviewing: { label: "검토중", tone: "reviewing" },
  answered: { label: "답변 완료", tone: "answered" },
  expired: { label: "만료됨", tone: "expired" },
};

const STATUS_GLYPH = {
  "in-progress": <path d="m10 8 6 4-6 4Z" fill="#fff" stroke="none" />,
  reviewing: (
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  answered: <path d="m7.5 12.2 3 3.1 6-7" />,
  expired: (
    <>
      <rect x="7.5" y="8.5" width="9" height="8" rx="1.5" />
      <path d="M9.5 6.5v3M14.5 6.5v3M7.5 11h9" />
    </>
  ),
};

function StatusDot({ tone, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" fill={`var(--status-dot-${tone})`} />
      <g fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {STATUS_GLYPH[tone]}
      </g>
    </svg>
  );
}

export function StatusBadge({ status = "received", size = "md", style, ...rest }) {
  const s = STATUS[status] || STATUS.received;
  const dims = size === "sm" ? { dot: 18, fontSize: 12.5 } : { dot: 22, fontSize: "var(--fs-body)" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--font-sans)",
        fontWeight: "var(--fw-semibold)",
        lineHeight: 1.3,
        color: "var(--text-strong)",
        fontSize: dims.fontSize,
        ...style,
      }}
      {...rest}
    >
      <StatusDot tone={s.tone} size={dims.dot} />
      {s.label}
    </span>
  );
}
StatusBadge.STATUS = STATUS;

/* 공감 임계치까지의 진행도. 임계치는 학과 정원 또는 전체 학생 대비 %.
   주의: Admin 테이블의 진행바는 이것을 쓰지 않는다(높이 7px, 별개 산출물 — ROADMAP 의존 E). */
export function ThresholdBar({ current = 0, threshold = 100, basisLabel = "학과 정원", reached, showMeta = true, size = "md", style, ...rest }) {
  const pct = Math.min(100, threshold > 0 ? (current / threshold) * 100 : 0);
  const isReached = reached != null ? reached : current >= threshold;
  const h = size === "lg" ? 12 : size === "sm" ? 6 : 9;
  const fill = isReached ? "var(--success-500)" : "var(--gradient-hero)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, ...style }} {...rest}>
      {showMeta && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ font: "var(--text-caption-role)", color: "var(--text-muted)" }}>{basisLabel} 대비 임계치</span>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-sm)",
              fontWeight: "var(--fw-bold)",
              color: isReached ? "var(--success-500)" : "var(--indigo-600)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {current.toLocaleString()} / {threshold.toLocaleString()}
            <span style={{ color: "var(--text-muted)", fontWeight: "var(--fw-medium)" }}> · {Math.round(pct)}%</span>
          </span>
        </div>
      )}
      <div style={{ height: h, borderRadius: "var(--radius-pill)", background: "var(--gray-150)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: "var(--radius-pill)", background: fill, transition: "width .5s cubic-bezier(.4,0,.2,1)" }} />
      </div>
      {showMeta && isReached && (
        <span style={{ font: "var(--text-caption-role)", fontWeight: "var(--fw-semibold)", color: "var(--success-500)" }}>임계치 도달 · 담당자 검토 요청됨</span>
      )}
    </div>
  );
}

/* 청원 하나를 요약하는 피드 아이템. 청원 프리미티브를 조합한다. */
export function PetitionCard({
  title,
  excerpt,
  category = "facility",
  status = "received",
  current = 0,
  threshold = 100,
  basisLabel = "학과 정원",
  author = "익명",
  date,
  comments = 0,
  voted = false,
  onToggleVote,
  onClick,
  style,
  ...rest
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        padding: "var(--pad-card)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow .18s ease, transform .18s ease",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = "var(--shadow-md)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = "var(--shadow-sm)";
          e.currentTarget.style.transform = "none";
        }
      }}
      {...rest}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <CategoryTag category={category} size="sm" />
        <StatusBadge status={status} size="sm" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h3 style={{ margin: 0, font: "var(--text-h3)", color: "var(--text-strong)" }}>{title}</h3>
        {excerpt && (
          <p style={{ margin: 0, font: "var(--text-body-role)", color: "var(--text-body)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {excerpt}
          </p>
        )}
      </div>
      <ThresholdBar current={current} threshold={threshold} basisLabel={basisLabel} showMeta />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, font: "var(--text-caption-role)", color: "var(--text-muted)" }}>
          <span>{author}</span>
          {date && <span>· {date}</span>}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {comments}
          </span>
        </div>
        <EmpathyButton
          count={current}
          active={voted}
          size="sm"
          onToggle={(e) => {
            e.stopPropagation();
            onToggleVote?.(e);
          }}
        />
      </div>
    </div>
  );
}
