/* 디자인 시스템 프리미티브.
   처음엔 design-handoff 의 _ds_bundle.js 를 픽셀 그대로 옮긴 것이었다. 이슈 #100 에서 "AI 가 만든
   것 같다"는 피드백으로 시각 규칙을 새로 잡았다 — 규칙은 src/index.css 머리 주석에 있다.
   크기·간격은 인라인 style, 색·테두리·:hover 같은 상태는 index.css 의 .ds-* 클래스가 맡는다.
   export 이름은 그대로라 호출부는 바뀌지 않는다. */

import { useState } from "react";
export { Icon, ICON_NAMES } from "./Icon.jsx";
import { Icon } from "./Icon.jsx";

/* ───────────────────────── core ───────────────────────── */

/** name 이 없으면(서버가 이름을 안 주는 계정) 이니셜 대신 사람 아이콘을 보인다.
    연보라 원·링은 뺐다 — 익명 서비스에서 아바타는 정보가 아니라 자리 표시다. */
export function Avatar({ src, name = "", size = 44, style, ...rest }) {
  const initials = name.trim().slice(0, 2);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: "var(--radius-full)",
        background: src ? `center/cover no-repeat url(${src})` : "var(--surface-sunken)",
        border: "1px solid var(--border-subtle)",
        color: "var(--text-muted)",
        fontFamily: "var(--font-sans)",
        fontWeight: "var(--fw-semibold)",
        fontSize: size * 0.4,
        overflow: "hidden",
        ...style,
      }}
      {...rest}
    >
      {!src && (initials || <Icon name="user" size={size * 0.5} />)}
    </span>
  );
}

const BADGE_TONES = {
  neutral: { bg: "var(--surface-sunken)", fg: "var(--text-body)" },
  success: { bg: "var(--status-answered-bg)", fg: "var(--status-answered-fg)" },
  warning: { bg: "var(--status-review-bg)", fg: "var(--status-review-fg)" },
  danger: { bg: "var(--danger-bg)", fg: "var(--danger-500)" },
};

export function Badge({ children, tone = "neutral", size = "md", style, ...rest }) {
  const t = BADGE_TONES[tone] || BADGE_TONES.neutral;
  const dims = size === "sm" ? { padding: "2px 8px", fontSize: "var(--fs-caption)" } : { padding: "3px 10px", fontSize: "var(--fs-sm)" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "var(--font-sans)",
        fontWeight: "var(--fw-semibold)",
        lineHeight: 1.4,
        borderRadius: "var(--radius-sm)",
        background: t.bg,
        color: t.fg,
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
  sm: { height: 36, padding: "0 14px", fontSize: "var(--fs-sm)" },
  md: { height: 44, padding: "0 18px", fontSize: "var(--fs-body)" },
  lg: { height: 52, padding: "0 22px", fontSize: "var(--fs-md)" },
};

/** variant: primary · outline · ghost · danger. 색은 index.css 의 .ds-btn[data-variant] 가 정한다. */
export function Button({
  children,
  variant = "primary",
  size = "md",
  block = false,
  disabled = false,
  leadingIcon,
  trailingIcon,
  onClick,
  type = "button",
  style,
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="ds-btn"
      data-variant={variant}
      style={{
        display: block ? "flex" : undefined,
        width: block ? "100%" : undefined,
        ...(BUTTON_SIZES[size] || BUTTON_SIZES.md),
        ...style,
      }}
      {...rest}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}

/** 떠 있지 않은 면. 그림자·호버 들림은 뺐다 — 카드는 위계가 정말 필요한 곳에만 쓴다. */
export function Card({ children, padding = "var(--pad-card)", as: Tag = "div", style, ...rest }) {
  return (
    <Tag
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** variant: outline · ghost · solid(켜진 토글 — primary 채움). */
export function IconButton({ children, size = 40, variant = "outline", ariaLabel, onClick, disabled = false, style, ...rest }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className="ds-btn"
      data-variant={variant === "solid" ? "primary" : variant}
      data-icon=""
      style={{ width: size, height: size, padding: 0, flexShrink: 0, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ───────────────────────── forms ───────────────────────── */

const labelStyle = { font: "var(--text-label)", color: "var(--text-strong)" };
// 16px — iOS 사파리·에타 웹뷰는 16px 미만 입력칸에 포커스하면 화면을 확대한다.
const controlFont = { fontFamily: "var(--font-sans)", fontSize: "var(--fs-md)", lineHeight: 1.5 };

export function Input({ label, hint, error, prefix, suffix, id, style, wrapStyle, ...rest }) {
  const inputId = id || (label ? `in-${label}` : undefined);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...wrapStyle }}>
      {label && (
        <label htmlFor={inputId} style={labelStyle}>
          {label}
        </label>
      )}
      <div className="ds-field" data-error={error ? "" : undefined} style={{ padding: "0 12px" }}>
        {prefix && <span style={{ color: "var(--text-muted)", display: "inline-flex" }}>{prefix}</span>}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", color: "var(--text-strong)", padding: "10px 0", ...controlFont, ...style }}
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
        <label htmlFor={inputId} style={labelStyle}>
          {label}
        </label>
      )}
      <div style={{ position: "relative", display: "flex" }}>
        <select
          id={inputId}
          value={value}
          onChange={onChange}
          className="ds-control"
          style={{ appearance: "none", padding: "10px 40px 10px 12px", cursor: "pointer", ...controlFont, color: value ? "var(--text-strong)" : "var(--text-muted)", ...style }}
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
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)", display: "inline-flex" }}>
          <Icon name="chevronDown" size={16} />
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
        <label htmlFor={inputId} style={labelStyle}>
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        value={value}
        maxLength={maxLength}
        className="ds-control"
        data-error={error ? "" : undefined}
        aria-invalid={error ? true : undefined}
        style={{ minHeight: 128, resize: "vertical", padding: "10px 12px", ...controlFont, lineHeight: 1.6, ...style }}
        {...rest}
      />
      <div style={{ display: "flex", justifyContent: "space-between", font: "var(--text-caption-role)" }}>
        <span style={{ color: error ? "var(--danger-500)" : "var(--text-muted)" }}>{error || hint}</span>
        {maxLength != null && count != null && (
          <span style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
            {count} / {maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── petition ───────────────────────── */

/* 다섯 카테고리. 태그는 이제 글자만 보인다(CategoryTag) — icon 은 피드 필터 칩이 아직 쓴다.
   임계치·담당자는 src/api 에 있다. */
export const CATEGORIES = {
  scholarship: { label: "장학", icon: "graduationCap" },
  facility: { label: "시설", icon: "facilityBuilding" },
  dorm: { label: "기숙사", icon: "dormHouse" },
  library: { label: "도서관", icon: "bookOpen" },
  department: { label: "학부", icon: "peopleGroup" },
};

export function CategoryTag({ category = "facility", size = "md", style, ...rest }) {
  const c = CATEGORIES[category] || CATEGORIES.facility;
  return (
    <span
      style={{
        fontFamily: "var(--font-sans)",
        fontWeight: "var(--fw-semibold)",
        lineHeight: 1.3,
        color: "var(--text-body)",
        fontSize: size === "sm" ? "var(--fs-caption)" : "var(--fs-sm)",
        ...style,
      }}
      {...rest}
    >
      {c.label}
    </span>
  );
}

/* 핵심 인터랙션: 요청을 누르면 청원이 임계치로 다가간다.
   화면 표기는 "요청"이지만 서버·코드의 개념명은 그대로 agreement(공감)다 — agreementCount,
   SELF_AGREEMENT_NOT_ALLOWED, votes/voted, EmpathyButton 이 다 그 이름을 쓴다. 아래 주석들이
   "공감"이라 부르는 것은 전부 이 서버 개념이고, 사용자에게 보이는 낱말만 "요청"으로 바꿨다.
   댓글·답글의 공감(COMMENT_LIKE/REPLY_LIKE)은 별개 동작이라 표기도 "공감" 그대로 둔다.
   하트는 뺐다 — 좋아요 버튼으로 읽히는데 뜻은 청원 동의라 어긋났다. 누른 상태는 채움과 체크로 보인다. */
export function EmpathyButton({ count = 0, active = false, onToggle, size = "md", block = false, style, ...rest }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className="ds-btn"
      data-variant={active ? "primary" : "outline"}
      style={{
        display: block ? "flex" : undefined,
        width: block ? "100%" : undefined,
        ...(BUTTON_SIZES[size] || BUTTON_SIZES.md),
        ...style,
      }}
      {...rest}
    >
      {active && <Icon name="check" size={size === "sm" ? 15 : 18} />}
      <span>요청</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{count.toLocaleString()}</span>
    </button>
  );
}

/* 청원 라이프사이클: received (진행중) → reviewing (검토중) → answered (답변 완료), + 파생 상태 expired (만료됨).
   색 원 안의 흰 글리프는 뺐다 — 뜻은 안 읽히고 색만 늘렸다. 남은 글자색 하나마저도 이슈 #100
   피드백(파스텔 제거)으로 진한 단색 면 + 흰 글자가 됐다. 목록에서 상태가 카테고리·날짜와
   같은 회색 글자로 섞여 안 읽히던 것을 면으로 떼어낸다.
   면 색은 index.css 의 .ds-status[data-status] 가 정한다 — 만료만 중립 회색 면이다(시간이
   지난 것이지 처리 상태가 아니라 의미색을 주지 않는다). */
const STATUS = {
  received: { label: "진행중" },
  reviewing: { label: "검토중" },
  answered: { label: "답변 완료" },
  expired: { label: "만료됨" },
};

export function StatusBadge({ status = "received", size = "md", style, ...rest }) {
  const s = STATUS[status] || STATUS.received;
  return (
    <span
      className="ds-status"
      data-status={status}
      style={{
        fontFamily: "var(--font-sans)",
        fontWeight: "var(--fw-semibold)",
        lineHeight: 1.3,
        fontSize: size === "sm" ? "var(--fs-caption)" : "var(--fs-sm)",
        ...style,
      }}
      {...rest}
    >
      {s.label}
    </span>
  );
}
StatusBadge.STATUS = STATUS;

/** 답변 완료가 만료보다 우선한다 — 이미 결론이 난 청원에 "만료됨"을 얹지 않는다.
    카드·상세 양쪽이 이 값을 그대로 StatusBadge status 로 넘긴다. */
export function petitionStatus(p) {
  if (p.status === "answered") return "answered";
  if (p.expired) return "expired";
  return p.status;
}

/* 요청이 기준(학과 정원 또는 전체 학생 대비 %)에 얼마나 다가갔는지. 막대 대신 숫자와 남은 인원으로
   보인다 — 회색 트랙 위 채움 막대는 대시보드 템플릿으로 읽혔다(이슈 #100). 호출부 때문에 이름은 둔다.
   size="lg" 는 상세용 두 줄, 나머지는 목록용 한 줄이다.
   주의: Admin 테이블의 진행바는 이것을 쓰지 않는다(ROADMAP 의존 E). */
export function ThresholdBar({ current = 0, threshold = 100, basisLabel = "학과 정원", reached, size = "md", style, ...rest }) {
  const isReached = reached != null ? reached : current >= threshold;
  const left = Math.max(0, threshold - current).toLocaleString();
  const num = { fontVariantNumeric: "tabular-nums", fontWeight: "var(--fw-bold)", color: "var(--text-strong)" };
  const doneColor = isReached ? "var(--success-500)" : undefined;

  if (size === "lg") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4, ...style }} {...rest}>
        <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", columnGap: 6 }}>
          <span style={{ ...num, fontSize: "var(--fs-title)", lineHeight: 1.15 }}>{current.toLocaleString()}</span>
          <span style={{ fontSize: "var(--fs-lg)", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>/ {threshold.toLocaleString()}명</span>
          <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginLeft: 6 }}>{basisLabel} 기준</span>
        </div>
        <p style={{ margin: 0, fontSize: "var(--fs-sm)", lineHeight: 1.5, fontWeight: isReached ? "var(--fw-semibold)" : undefined, color: doneColor ?? "var(--text-body)" }}>
          {isReached ? "기준 인원을 넘어 담당 부서로 전달되었습니다." : `${left}명 더 요청하면 담당 부서로 전달됩니다.`}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, fontSize: "var(--fs-sm)", ...style }} {...rest}>
      <span style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
        <span style={num}>{current.toLocaleString()}</span> / {threshold.toLocaleString()}명
      </span>
      <span style={{ color: doneColor ?? "var(--text-muted)", fontWeight: isReached ? "var(--fw-semibold)" : undefined }}>
        {isReached ? "담당 부서 전달됨" : `${left}명 남음`}
      </span>
    </div>
  );
}

/* 확인·안내 창이 공유하는 뼈대(스크림 + 가운데 면). */
function DialogShell({ labelledBy, onClose, children }) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby={labelledBy} style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--scrim)", padding: 20 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 360, background: "var(--surface-card)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", padding: 22 }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

const dialogTitle = { margin: "0 0 8px", fontSize: "var(--fs-lg)", fontWeight: "var(--fw-bold)", color: "var(--text-strong)" };
const dialogBody = { margin: "0 0 20px", fontSize: "var(--fs-sm)", lineHeight: 1.6, color: "var(--text-body)" };

/* 실 백엔드 POST /connect/users/me/blocks 를 쓴다(FeedScreen.jsx 의 handleBlock 참고) — 서버가
   영구 차단을 기억하고 이후 목록·상세 조회에서 그 작성자 글을 걸러준다. "게시글만 차단"에 대응하는
   서버 기능은 없어 그 옵션은 두지 않는다. */
const BLOCK_BODY = "차단하면 이 사용자가 쓴 모든 글과 댓글이 앞으로 보이지 않습니다. 지금은 해제할 수 없습니다.";

/** 차단 확인 창. 피드 카드와 상세의 댓글이 같은 창을 쓴다 — 따로 만들면 경고 문구가 갈린다. */
export function ConfirmDialog({ title, body = BLOCK_BODY, confirmLabel = "차단하기", onConfirm, onClose }) {
  return (
    <DialogShell labelledBy="confirm-dialog-title" onClose={onClose}>
      <h3 id="confirm-dialog-title" style={dialogTitle}>{title}</h3>
      <p style={dialogBody}>{body}</p>
      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="ghost" block onClick={onClose}>취소</Button>
        <Button
          variant="danger"
          block
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </DialogShell>
  );
}

/** 로그인 유도 창. 에타 등에서 공유 링크로 들어온 비로그인 방문자가 공감·댓글·북마크를 누르면 뜬다.
    바로 로그인 화면으로 보내면 왜 넘어왔는지 모른 채 처음 보는 폼을 마주하게 된다 — 무엇을 하려다
    막혔는지 알려주고 나서 보낸다. 문구에 동작 이름을 넣지 않는 건 "공감은/북마크는" 처럼 조사가
    갈리기 때문이다. */
export function LoginPromptDialog({ onConfirm, onClose }) {
  return (
    <DialogShell labelledBy="login-prompt-title" onClose={onClose}>
      <h3 id="login-prompt-title" style={dialogTitle}>로그인이 필요합니다</h3>
      <p style={dialogBody}>요청·댓글·북마크는 로그인한 학생만 사용할 수 있습니다. 학교 이메일로 가입하면 바로 참여할 수 있습니다.</p>
      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="ghost" block onClick={onClose}>취소</Button>
        <Button variant="primary" block onClick={onConfirm}>로그인하기</Button>
      </div>
    </DialogShell>
  );
}

/** 신고·차단 오버플로 메뉴. 피드 카드·청원 상세·댓글이 모두 이걸 쓴다 — 같은 두 동작이
    화면마다 다른 모양이면 어디서 뭘 할 수 있는지 매번 다시 찾아야 한다.
    카드 위에서도 쓰이므로 클릭이 카드 이동으로 새지 않게 막는다. */
/* style 은 바깥 span 에 합쳐진다. 아래 marginLeft:auto 를 끄려는 용도다 —
   댓글 행(DetailScreen)처럼 이 메뉴가 유일한 오른쪽 앵커인 곳이 있어 기본값은 그대로 두고,
   이미 앵커가 있는 곳(피드 목록 행)에서만 호출부가 0 으로 덮는다. */
export function ActionMenu({ onReport, onBlock, onDelete, label = "메뉴", style }) {
  const [open, setOpen] = useState(false);
  const item = (danger) => ({
    display: "flex",
    alignItems: "center",
    gap: 9,
    width: "100%",
    padding: "9px 10px",
    border: "none",
    borderRadius: "var(--radius-xs)",
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    fontSize: "var(--fs-sm)",
    fontWeight: "var(--fw-semibold)",
    color: danger ? "var(--danger-500)" : "var(--text-body)",
    textAlign: "left",
  });

  return (
    <span style={{ marginLeft: "auto", position: "relative", display: "inline-flex", ...style }} onClick={(e) => e.stopPropagation()}>
      <IconButton variant="ghost" size={32} ariaLabel={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="moreVertical" size={17} />
      </IconButton>
      {open && (
        <>
          <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 30 }} onClick={() => setOpen(false)} />
          <div role="menu" style={{ position: "absolute", right: 0, top: 36, minWidth: 128, background: "var(--surface-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-lg)", padding: 6, zIndex: 31 }}>
            {onReport && (
              <button type="button" role="menuitem" className="ds-menu-item" onClick={() => { setOpen(false); onReport(); }} style={item(false)}>
                <Icon name="flag" size={15} />
                신고
              </button>
            )}
            {onBlock && (
              <button type="button" role="menuitem" className="ds-menu-item" onClick={() => { setOpen(false); onBlock(); }} style={item(true)}>
                <Icon name="userX" size={15} />
                차단
              </button>
            )}
            {onDelete && (
              <button type="button" role="menuitem" className="ds-menu-item" onClick={() => { setOpen(false); onDelete(); }} style={item(true)}>
                <Icon name="trash" size={15} />
                삭제
              </button>
            )}
          </div>
        </>
      )}
    </span>
  );
}

/* 피드 아이템은 여기 있던 PetitionCard(테두리 카드) 대신 components/web/FeedParts 의
   PetitionRow(목록 행)다 — 제목을 <Link> 로 열어야 키보드로 접근되는데, 그 한 줄 때문에
   DS 프리미티브에 라우터를 끌어들일 이유는 없다. 행은 피드 전용 조합이라 그쪽이 제자리다. */
