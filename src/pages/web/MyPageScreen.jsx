/* 마이페이지 (ROADMAP Phase 5-2 → 이슈 #39 로 iOS MY 화면과 동일하게 재구성).
   헤더 아바타 드롭다운의 로그아웃, 알림 벨의 알림 목록, 환경설정 모달의 알림 설정 토글을
   전부 여기로 모았다 — 그 자리에서는 뺐다(중복 표시 방지). "내가 쓴 댓글"은 iOS 에는 없는
   화면 전용 섹션이다. 소속 학부 수정(Select+저장)은 기존 그대로 유지한다.

   레이아웃: iOS MY 화면을 그대로 옮겨 560px 단일 열로 짰던 걸 데스크톱 폭에 맞게 다시 짰다.
   히어로에 통계를 통합하고(WEB-02 피드 히어로와 같은 패턴), 나머지 섹션은
   FeedScreen 폭(--page-max)에서 2열로 펼친다 — auto-fit 그리드라 미디어 쿼리 없이도
   좁은 화면에서는 iOS 와 같은 세로 1열 순서로 접힌다. */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../../stores/session";
import { usePetitions } from "../../stores/petitions";
import * as api from "../../api";
import { Avatar, Button, Card, Icon, Input, Select } from "../../components/ui";
import { toast } from "../../components/Toast";
import { pointOf } from "../../components/web/notifMeta";
import { PRIVACY_POLICY_PATH, TERMS_PATH } from "../../legal";
import { PASSWORD_HINT, validatePassword } from "../../utils/credentials";

/* FeedScreen 의 HeroBanner 와 같은 뼈대(그라데이션·radius-xl·shadow-md·장식 원)를 쓰되,
   기존엔 따로 떠 있던 회색 통계 카드 3장을 히어로 안에 통합했다 — WEB-02 피드 히어로가
   이미 쓰는 "제목 아래 인라인 숫자" 패턴 그대로다. */
function HeroCard({ dept, loginId, stats }) {
  return (
    <div style={{ position: "relative", overflow: "hidden", background: "var(--gradient-hero)", borderRadius: "var(--radius-xl)", padding: "36px 40px", color: "#fff", boxShadow: "var(--shadow-md)" }}>
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 18 }}>
        <Avatar size={64} ring />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".04em", opacity: 0.75, textTransform: "uppercase" }}>소속 학부</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 3 }}>{dept}</div>
          <div style={{ fontSize: 13.5, opacity: 0.85, marginTop: 3 }}>{loginId}</div>
        </div>
      </div>
      <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 40, marginTop: 28, paddingTop: 22, borderTop: "1px solid rgba(255,255,255,.16)" }}>
        {/* 통계는 그 숫자를 만든 목록으로 가는 지름길이다. "등록한 건의"만 헤더 내비에 같은 목록이
            있어 그리로 보내고(iOS 는 하단 탭바), 나머지 둘은 갈 곳이 없어 그 자리에서 창을 띄운다. */}
        {stats.map(({ value, label, to, onClick }) => {
          const face = (
            <>
              <div style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{value}</div>
              <div style={{ fontSize: 12.5, opacity: 0.8, marginTop: 3, fontWeight: 600 }}>{label}</div>
            </>
          );
          const hit = { color: "inherit", textDecoration: "none", background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", font: "inherit" };
          if (to) return <Link key={label} to={to} aria-label={`${label} ${value}건 보기`} style={hit}>{face}</Link>;
          if (onClick) return <button key={label} type="button" onClick={onClick} aria-label={`${label} ${value}건 보기`} style={hit}>{face}</button>;
          return <div key={label}>{face}</div>;
        })}
      </div>
      <div style={{ position: "absolute", right: -60, top: -50, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
      <div style={{ position: "absolute", right: 60, bottom: -100, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
    </div>
  );
}

/* 계정 정보 변경 진입 행. HelpLinkRow 와 같은 뼈대인데 외부 링크가 아니라
   onClick 으로 다이얼로그를 연다 — 화살표를 link 대신 chevronRight 로 바꿔 "안에서 열리는" 동작임을 구분한다. */
function AccountRow({ icon, label, onClick, first = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "13px 18px", background: "none", border: "none", borderTop: first ? "none" : "1px solid var(--border-subtle)", cursor: "pointer", fontFamily: "var(--font-sans)" }}
    >
      <Icon name={icon} size={15} color="var(--text-muted)" />
      <span style={{ flex: 1, textAlign: "left", fontSize: 13.5, fontWeight: 700, color: "var(--text-strong)" }}>{label}</span>
      <Icon name="chevronRight" size={15} color="var(--text-muted)" />
    </button>
  );
}

function ChangePasswordDialog({ onClose }) {
  const changePassword = useSession((s) => s.changePassword);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!current) return setError("현재 비밀번호를 입력해 주세요.");
    const passwordError = validatePassword(next, "새 비밀번호");
    if (passwordError) return setError(passwordError);
    if (next !== confirm) return setError("새 비밀번호가 서로 다릅니다.");
    setError("");
    setBusy(true);
    try {
      await changePassword(current, next);
      toast("비밀번호가 변경되었습니다");
      onClose();
    } catch (e) {
      setError(e?.status === 400 ? "현재 비밀번호와 다른 새 비밀번호를 입력해 주세요." : e?.status === 401 ? "현재 비밀번호가 올바르지 않습니다." : e?.status === 404 ? "사용자 정보를 찾을 수 없습니다." : e instanceof TypeError ? "네트워크 연결을 확인해 주세요." : "비밀번호를 변경하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="change-password-title" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, display: "grid", placeItems: "center", padding: 20, background: "rgba(15, 23, 42, .45)" }}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} style={{ width: "min(100%, 420px)", background: "#fff", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <h2 id="change-password-title" style={{ margin: 0, fontSize: 18, color: "var(--text-strong)" }}>비밀번호 변경</h2>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--text-muted)" }}>현재 비밀번호를 확인한 뒤 새 비밀번호로 바꿔드려요.</p>
        </div>
        <Input type="password" label="현재 비밀번호" placeholder="••••••••" autoComplete="current-password" value={current} onChange={(e) => { setCurrent(e.target.value); setError(""); }} />
        <Input type="password" label="새 비밀번호" hint={PASSWORD_HINT} placeholder="••••••••" autoComplete="new-password" value={next} onChange={(e) => { setNext(e.target.value); setError(""); }} />
        <Input type="password" label="새 비밀번호 확인" placeholder="••••••••" autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(""); }} />
        {error && <p role="alert" style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--danger-500)" }}>{error}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
          <Button type="button" variant="outline" onClick={onClose}>취소</Button>
          <Button type="submit" variant="primary" disabled={busy}>{busy ? "변경 중…" : "변경"}</Button>
        </div>
      </form>
    </div>
  );
}

/* 통계 타일이 띄우는 건의 목록 창. "누른 요청"·"받은 답변" 두 창이 배지·아이콘·목록만 다르고
   나머지가 같아 한 컴포넌트로 둔다(iOS My.tsx 의 PetitionSheet 와 같은 구성·같은 문구).
   3건까지만 펼치고 나머지는 더보기로 넘긴다 — 창이 화면을 꽉 채우지 않게 한다(사용자 지시). */
const PETITION_PREVIEW = 3;

const ymd = (iso) => {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
};

function PetitionDialog({ badge, icon, empty, list, onClose }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? list : list.slice(0, PETITION_PREVIEW);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="petition-dialog-title" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, display: "grid", placeItems: "center", padding: 20, background: "rgba(15, 23, 42, .45)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(100%, 520px)", maxHeight: "80vh", overflowY: "auto", background: "#fff", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
          <h2 id="petition-dialog-title" style={{ margin: 0, fontSize: 18, color: "var(--text-strong)" }}>{badge} {list.length}건</h2>
          <button type="button" onClick={onClose} aria-label="닫기" style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "inline-flex" }}>
            <Icon name="x" size={18} />
          </button>
        </div>

        {list.length === 0 ? (
          <p style={{ margin: "18px 0", fontSize: 13.5, color: "var(--text-muted)" }}>{empty}</p>
        ) : (
          shown.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { onClose(); navigate(`/p/${item.id}`); }}
              aria-label={`${badge} · ${item.title}`}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "16px 0", background: "none", border: "none", borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)", cursor: "pointer", fontFamily: "var(--font-sans)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, background: "var(--indigo-50)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={icon} size={20} />
                </div>
                <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                  <span style={{ border: "1px solid var(--indigo-200)", borderRadius: "var(--radius-pill)", padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "var(--indigo-600)" }}>{badge}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text-strong)", lineHeight: 1.4 }}>{item.title}</span>
                </div>
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--text-body)", lineHeight: 1.55 }}>{item.excerpt}</p>
              <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "var(--text-muted)" }}>{ymd(item.createdAt)}</p>
            </button>
          ))
        )}
        {!expanded && list.length > PETITION_PREVIEW && <MoreButton onClick={() => setExpanded(true)} />}
      </div>
    </div>
  );
}

/* PageIntro(FeedParts.jsx) 의 "아이콘 타일 + 제목" 패턴을 섹션 헤더 크기로 축소했다. */
function SectionHeader({ icon, bg, fg, title, meta }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={icon} size={15} />
      </div>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--text-strong)" }}>{title}</h2>
      {meta && <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)" }}>{meta}</span>}
    </div>
  );
}

/* 회원가입 때 동의받은 약관 두 가지를 마이페이지에서도 다시 볼 수 있게 한다(사용자 지시). */
function HelpLinkRow({ href, label, first = false }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "13px 18px", background: "none", border: "none", borderTop: first ? "none" : "1px solid var(--border-subtle)", cursor: "pointer", fontFamily: "var(--font-sans)", textDecoration: "none" }}
    >
      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: "var(--text-strong)" }}>{label}</span>
      <Icon name="link" size={15} color="var(--text-muted)" />
    </a>
  );
}

function MoreButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ display: "block", width: "100%", textAlign: "center", padding: "12px", background: "none", border: "none", borderTop: "1px solid var(--border-subtle)", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700, color: "var(--indigo-600)" }}
    >
      더보기
    </button>
  );
}

/* 신고 모달(DetailScreen.jsx ReportDialog)과 같은 뼈대(스크림 + 카드 폼)를 쓴다. */
function DeleteAccountDialog({ onClose }) {
  const deleteAccount = useSession((s) => s.deleteAccount);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return setError("비밀번호를 입력해 주세요.");
    setBusy(true);
    try {
      await deleteAccount(password);
      toast("탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.");
    } catch (err) {
      // 네트워크 실패(fetch 가 던지는 TypeError)는 영어 원문("Failed to fetch")이라 그대로 보여주지 않는다.
      setError(err instanceof TypeError ? "네트워크 연결을 확인해 주세요." : err.message || "탈퇴 처리에 실패했습니다.");
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="delete-account-title" onClick={() => !busy && onClose()} style={{ position: "fixed", inset: 0, zIndex: 100, display: "grid", placeItems: "center", padding: 20, background: "rgba(15, 23, 42, .45)" }}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} style={{ width: "min(100%, 420px)", background: "#fff", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", padding: 24 }}>
        <h2 id="delete-account-title" style={{ margin: 0, fontSize: 18, color: "var(--text-strong)" }}>회원탈퇴</h2>
        <p style={{ margin: "6px 0 14px", fontSize: 13.5, color: "var(--text-muted)" }}>계정 삭제를 위해 가입한 비밀번호를 입력해 주세요.</p>
        <div style={{ background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", padding: "12px 14px", fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 16 }}>
          탈퇴하면 계정 정보가 삭제되며, 이후 30일 동안은 같은 정보로 다시 가입할 수 없어요. 신중히 결정해 주세요.
        </div>
        <Input
          type="password"
          label="비밀번호"
          placeholder="••••••••"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
          error={error || undefined}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>취소</Button>
          <Button type="submit" variant="danger" disabled={busy || !password.trim()}>{busy ? "처리 중…" : "탈퇴하기"}</Button>
        </div>
      </form>
    </div>
  );
}

export default function MyPageScreen() {
  const user = useSession((s) => s.user);
  const updateDepartment = useSession((s) => s.updateDepartment);
  const logout = useSession((s) => s.logout);
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [dialog, setDialog] = useState(null); // "voted" | "answered" — 통계 타일이 띄우는 목록 창

  const petitions = usePetitions((s) => s.petitions);
  const bookmarked = usePetitions((s) => s.bookmarked);
  const voted = usePetitions((s) => s.voted);
  const myTotals = usePetitions((s) => s.myTotals);
  const notifications = usePetitions((s) => s.notifications);
  const markAllNotifRead = usePetitions((s) => s.markAllNotifRead);
  const markNotifRead = usePetitions((s) => s.markNotifRead);
  const myComments = usePetitions((s) => s.myComments);
  const loadMyComments = usePetitions((s) => s.loadMyComments);

  const [departments, setDepartments] = useState([]);
  const [deptId, setDeptId] = useState("");
  const [saving, setSaving] = useState(false);
  const [notifExpanded, setNotifExpanded] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [bookmarksExpanded, setBookmarksExpanded] = useState(false);

  useEffect(() => {
    api.listDepartments()
      .then((list) => {
        setDepartments(list);
        setDeptId(String(list.find((department) => department.label === user.dept)?.value ?? ""));
      })
      .catch((error) => toast(error instanceof Error ? error.message : "학부 목록을 불러오지 못했습니다."));
  }, [user.dept]);

  useEffect(() => {
    loadMyComments();
  }, [loadMyComments]);

  const save = async () => {
    const department = departments.find((item) => String(item.value) === deptId);
    setSaving(true);
    try {
      await updateDepartment(Number(deptId), department?.label ?? "");
      toast("학부 정보가 수정되었습니다");
    } catch (error) {
      toast(error instanceof Error ? error.message : "학부 정보 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // petitions 는 전체 플랫폼 기준 최근 100건 피드라 여기서 세면 100건 너머에서 값이 샌다.
  // myTotals 는 /connect/users/me/{agreements,bookmarks,petitions} 가 직접 센 개수다(ensureFlags, api/index.js).
  const mineCount = myTotals.mine;
  const voteCount = myTotals.voted;
  const answeredCount = myTotals.answered;
  const unread = notifications.filter((n) => !n.read).length;
  const bookmarkedPetitions = petitions.filter((p) => bookmarked[p.id]);
  /* 통계 타일이 띄우는 두 목록. ponytail: 위 count 는 서버가 센 값이고 이 목록은 화면에 로드된
     최근 100건에서 고른 것이라, 100건 너머의 오래된 건의는 숫자에는 있어도 목록에는 안 나온다.
     전용 목록 엔드포인트가 생기면 그때 맞춘다 — 지금 화면이 아는 건 이 100건뿐이다. */
  const votedPetitions = petitions.filter((p) => voted[p.id]);
  const myAnsweredPetitions = petitions.filter((p) => p.mine && p.status === "answered");

  return (
    <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "28px var(--page-gutter) 80px", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* 서버가 이름을 안 준다(익명 설계) — 학부를 주 정보로 올리고 아이디를 보조로 둔다.
          "이름 빠진 자리" 가 아니라 익명 서비스에 맞는 표시로 다시 짰다. */}
      <HeroCard
        dept={user.dept}
        loginId={user.loginId}
        stats={[
          { value: mineCount, label: "등록한 건의", to: "/mine" },
          { value: voteCount, label: "누른 요청", onClick: () => setDialog("voted") },
          { value: answeredCount, label: "받은 답변", onClick: () => setDialog("answered") },
        ]}
      />

      {dialog === "voted" && (
        <PetitionDialog badge="누른 요청" icon="heart" empty="요청을 누른 건의가 없습니다." list={votedPetitions} onClose={() => setDialog(null)} />
      )}
      {dialog === "answered" && (
        <PetitionDialog badge="받은 답변" icon="checkCircle" empty="답변을 받은 건의가 없습니다." list={myAnsweredPetitions} onClose={() => setDialog(null)} />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 24, alignItems: "start" }}>
        {/* 왼쪽: 계정 설정 — 학부 수정 · 알림 설정 · 로그아웃 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SectionHeader icon="pencil" bg="var(--indigo-50)" fg="var(--indigo-600)" title="소속 학부 수정" />
            <Card padding="var(--pad-card-lg)" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Select label="소속 학부" options={departments} value={deptId} onChange={(e) => setDeptId(e.target.value)} placeholder="학부를 선택하세요" />
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Button variant="outline" onClick={() => navigate("/mine")}>내 건의 보기</Button>
                <Button variant="primary" disabled={!deptId || saving} onClick={save}>저장</Button>
              </div>
            </Card>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SectionHeader icon="lock" bg="var(--indigo-50)" fg="var(--indigo-600)" title="계정 정보 변경" />
            <Card padding={0} style={{ overflow: "hidden" }}>
              <AccountRow icon="lock" label="비밀번호 변경" onClick={() => setChangePwOpen(true)} first />
            </Card>
          </div>

          {/* 저장할 곳이 없던 토글 3개(도달률·답변·공감)를 걷어내고, 백엔드가 실제로 알림을 보내는
              5개 지점을 보여주는 화면으로 넘긴다 — NotificationSettingsScreen.jsx. */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SectionHeader icon="sliders" bg="var(--gray-150)" fg="var(--gray-700)" title="알림 설정" meta={unread > 0 ? `${unread}건 안 읽음` : undefined} />
            <Card padding={0} style={{ overflow: "hidden" }}>
              <AccountRow icon="bell" label="알림 종류" onClick={() => navigate("/mypage/notifications")} first />
            </Card>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SectionHeader icon="fileText" bg="var(--gray-150)" fg="var(--gray-700)" title="도움말" />
            <Card padding={0} style={{ overflow: "hidden" }}>
              <HelpLinkRow href={TERMS_PATH} label="이용약관 및 커뮤니티 정책" first />
              <HelpLinkRow href={PRIVACY_POLICY_PATH} label="개인정보처리방침" />
            </Card>
          </div>

          <Button variant="outline" block onClick={logout}>로그아웃</Button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", padding: "2px 0" }}
          >
            회원탈퇴
          </button>
        </div>

        {/* 오른쪽: 활동 — 알림 · 북마크한 건의 · 내가 쓴 댓글 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SectionHeader icon="bell" bg="#FCE7E9" fg="var(--coral-600)" title="알림" />
            <Card padding={0} style={{ overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "14px 18px" }}>
                <span style={{ fontWeight: 800, fontSize: 14.5, color: "var(--text-strong)" }}>
                  {unread > 0 ? `${unread}건 안 읽음` : "알림"}
                </span>
                <button type="button" onClick={markAllNotifRead} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, color: "var(--indigo-600)" }}>
                  모두 읽음
                </button>
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: "18px", fontSize: 13.5, color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)" }}>알림이 없습니다.</div>
              ) : (
                (notifExpanded ? notifications : notifications.slice(0, 5)).map((n) => {
                  const m = pointOf(n.type);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        if (!n.read) markNotifRead(n.id);
                        // 공지(NOTICE) 알림엔 청원이 없다 — /p/undefined 로 튀지 않게 막는다.
                        if (n.petitionId) navigate(`/p/${n.petitionId}`);
                      }}
                      style={{ display: "flex", gap: 11, width: "100%", textAlign: "left", padding: "13px 18px", background: n.read ? "transparent" : "var(--indigo-50)", border: "none", borderTop: "1px solid var(--border-subtle)", cursor: "pointer", fontFamily: "var(--font-sans)" }}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: m.bg, color: m.fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={m.icon} size={17} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, color: "var(--text-body)", lineHeight: 1.55 }}>
                          <b style={{ color: "var(--text-strong)" }}>{n.title}</b> · {n.body}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 3 }}>{n.date}</div>
                      </div>
                    </button>
                  );
                })
              )}
              {!notifExpanded && notifications.length > 5 ? <MoreButton onClick={() => setNotifExpanded(true)} /> : null}
            </Card>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SectionHeader icon="bookmark" bg="#EAE8F9" fg="var(--violet-600)" title="북마크한 건의" meta={bookmarkedPetitions.length ? `${bookmarkedPetitions.length}건` : undefined} />
            {bookmarkedPetitions.length === 0 ? (
              <Card style={{ fontSize: 13.5, color: "var(--text-muted)", textAlign: "center" }}>북마크한 건의가 없습니다.</Card>
            ) : (
              <Card padding={0} style={{ overflow: "hidden" }}>
                {(bookmarksExpanded ? bookmarkedPetitions : bookmarkedPetitions.slice(0, 5)).map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => navigate(`/p/${p.id}`)}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "13px 18px", background: "none", border: "none", borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)", cursor: "pointer", fontFamily: "var(--font-sans)" }}
                  >
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-strong)" }}>{p.title}</div>
                  </button>
                ))}
                {!bookmarksExpanded && bookmarkedPetitions.length > 5 ? <MoreButton onClick={() => setBookmarksExpanded(true)} /> : null}
              </Card>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SectionHeader icon="message" bg="var(--teal-50)" fg="var(--teal-600)" title="내가 쓴 댓글" meta={myComments.length ? `${myComments.length}건` : undefined} />
            {myComments.length === 0 ? (
              <Card style={{ fontSize: 13.5, color: "var(--text-muted)", textAlign: "center" }}>아직 작성한 댓글이 없습니다.</Card>
            ) : (
              <Card padding={0} style={{ overflow: "hidden" }}>
                {(commentsExpanded ? myComments : myComments.slice(0, 5)).map((c, i) => (
                  <button
                    key={`${c.petitionId}-${c.id}`}
                    type="button"
                    onClick={() => navigate(`/p/${c.petitionId}`)}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "13px 18px", background: "none", border: "none", borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)", cursor: "pointer", fontFamily: "var(--font-sans)" }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--indigo-600)" }}>{c.title}</div>
                    <div style={{ fontSize: 13.5, color: "var(--text-body)", marginTop: 4 }}>{c.body}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>{c.date}</div>
                  </button>
                ))}
                {!commentsExpanded && myComments.length > 5 ? <MoreButton onClick={() => setCommentsExpanded(true)} /> : null}
              </Card>
            )}
          </div>
        </div>
      </div>

      {deleteOpen && <DeleteAccountDialog onClose={() => setDeleteOpen(false)} />}
      {changePwOpen && <ChangePasswordDialog onClose={() => setChangePwOpen(false)} />}
    </div>
  );
}
