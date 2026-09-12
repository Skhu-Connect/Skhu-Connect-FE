/* 마이페이지 (ROADMAP Phase 5-2 → 이슈 #39 로 iOS MY 화면과 동일하게 재구성).
   헤더 아바타 드롭다운의 로그아웃, 알림 벨의 알림 목록, 환경설정 모달의 알림 설정 토글을
   전부 여기로 모았다 — 그 자리에서는 뺐다(중복 표시 방지). "내가 쓴 댓글"은 iOS 에는 없는
   화면 전용 섹션이다. 소속 학부 수정(Select+저장)은 기존 그대로 유지한다.

   이슈 #100 으로 겉모습만 다시 짰다. 데이터·동작·문구는 그대로다. 걷어낸 것:
   - 그라데이션 히어로(장식 원 2개 + 11px 대문자 eyebrow) → 아바타 + 이름 + 숫자 세 개
   - 머리말 여섯 개의 파스텔 아이콘 타일 → 글자 위계. 타일 색이 인디고·회색·분홍·연보라·틸
     다섯 갈래여서 한 화면에서 "액센트는 인디고 하나" 규칙이 정면으로 깨져 있었다
   - 카드 상자 여섯 개 → 머리선 하나로 묶은 목록
   레이아웃은 index.css 의 .mypage-* 가 맡는다. 2열은 auto-fit 그리드라 좁은 화면에서
   iOS 와 같은 세로 1열 순서로 접힌다. */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../../stores/session";
import { usePetitions } from "../../stores/petitions";
import * as api from "../../api";
import { Avatar, Button, Icon, Input, Select } from "../../components/ui";
import { toast } from "../../components/Toast";
import { pointOf } from "../../components/web/notifMeta";
import { PRIVACY_POLICY_PATH, TERMS_PATH } from "../../legal";
import { PASSWORD_HINT, validatePassword } from "../../utils/credentials";

/* 서버가 이름을 안 준다(익명 설계) — 학부를 주 정보로 올리고 아이디를 보조로 둔다.
   통계는 그 숫자를 만든 목록으로 가는 지름길이다. "등록한 건의"만 헤더 내비에 같은 목록이
   있어 그리로 보내고(iOS 는 하단 탭바), 나머지 둘은 갈 곳이 없어 그 자리에서 창을 띄운다. */
function ProfileHead({ dept, loginId, stats }) {
  return (
    <>
      <div className="mypage-head">
        <Avatar size={56} />
        <div>
          <h1>{dept}</h1>
          <p>{loginId}</p>
        </div>
      </div>
      <div className="mypage-stats">
        {stats.map(({ value, label, to, onClick }) => {
          const face = (
            <>
              <b>{value}</b>
              <span>{label}</span>
            </>
          );
          if (to) {
            return (
              <Link key={label} to={to} className="mypage-stat" aria-label={`${label} ${value}건 보기`}>
                {face}
              </Link>
            );
          }
          if (onClick) {
            return (
              <button key={label} type="button" className="mypage-stat" onClick={onClick} aria-label={`${label} ${value}건 보기`}>
                {face}
              </button>
            );
          }
          return (
            <div key={label} className="mypage-stat">
              {face}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* 계정 정보 변경 진입 행. HelpLinkRow 와 같은 뼈대인데 외부 링크가 아니라
   onClick 으로 다이얼로그를 연다 — 화살표를 link 대신 chevronRight 로 바꿔 "안에서 열리는" 동작임을 구분한다. */
function AccountRow({ icon, label, onClick }) {
  return (
    <button type="button" className="mypage-row" onClick={onClick}>
      <Icon name={icon} size={16} color="var(--text-muted)" />
      <span className="mypage-row-label">{label}</span>
      <Icon name="chevronRight" size={16} color="var(--text-muted)" />
    </button>
  );
}

/* 회원가입 때 동의받은 약관 두 가지를 마이페이지에서도 다시 볼 수 있게 한다(사용자 지시). */
function HelpLinkRow({ href, label }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="mypage-row">
      <span className="mypage-row-label">{label}</span>
      <Icon name="link" size={16} color="var(--text-muted)" />
    </a>
  );
}

function MoreButton({ onClick }) {
  return (
    <button type="button" className="mypage-more" onClick={onClick}>
      더보기
    </button>
  );
}

function Section({ title, meta, action, children }) {
  return (
    <section className="mypage-section">
      <div className="mypage-section-head">
        <h2>
          {title}
          {meta && <span>{meta}</span>}
        </h2>
        {action}
      </div>
      {children}
    </section>
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
    <div role="dialog" aria-modal="true" aria-labelledby="change-password-title" onClick={onClose} className="ds-dialog-scrim">
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="ds-dialog" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <h2 id="change-password-title">비밀번호 변경</h2>
          <p style={{ margin: "6px 0 0", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>현재 비밀번호를 확인한 뒤 새 비밀번호로 바꿔드려요.</p>
        </div>
        <Input type="password" label="현재 비밀번호" placeholder="••••••••" autoComplete="current-password" value={current} onChange={(e) => { setCurrent(e.target.value); setError(""); }} />
        <Input type="password" label="새 비밀번호" hint={PASSWORD_HINT} placeholder="••••••••" autoComplete="new-password" value={next} onChange={(e) => { setNext(e.target.value); setError(""); }} />
        <Input type="password" label="새 비밀번호 확인" placeholder="••••••••" autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(""); }} />
        {error && <p role="alert" style={{ margin: 0, fontSize: "var(--fs-caption)", fontWeight: "var(--fw-semibold)", color: "var(--danger-500)" }}>{error}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
          <Button type="button" variant="outline" onClick={onClose}>취소</Button>
          <Button type="submit" variant="primary" disabled={busy}>{busy ? "변경 중…" : "변경"}</Button>
        </div>
      </form>
    </div>
  );
}

/* 통계 타일이 띄우는 건의 목록 창. "누른 요청"·"받은 답변" 두 창이 문구와 목록만 다르고
   나머지가 같아 한 컴포넌트로 둔다(iOS My.tsx 의 PetitionSheet 와 같은 구성·같은 문구).
   3건까지만 펼치고 나머지는 더보기로 넘긴다 — 창이 화면을 꽉 채우지 않게 한다(사용자 지시). */
const PETITION_PREVIEW = 3;

const ymd = (iso) => {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
};

function PetitionDialog({ badge, empty, list, onClose }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? list : list.slice(0, PETITION_PREVIEW);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="petition-dialog-title" onClick={onClose} className="ds-dialog-scrim">
      <div onClick={(e) => e.stopPropagation()} className="ds-dialog" style={{ width: "min(100%, 520px)", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
          <h2 id="petition-dialog-title">
            {badge} <span style={{ fontWeight: "var(--fw-regular)", color: "var(--text-muted)" }}>{list.length}건</span>
          </h2>
          <button type="button" onClick={onClose} aria-label="닫기" style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "inline-flex" }}>
            <Icon name="x" size={18} />
          </button>
        </div>

        {list.length === 0 ? (
          <p className="mypage-empty">{empty}</p>
        ) : (
          <div className="mypage-list">
            {shown.map((item) => (
              <button
                key={item.id}
                type="button"
                className="mypage-row"
                style={{ display: "block", padding: "14px 0" }}
                onClick={() => { onClose(); navigate(`/p/${item.id}`); }}
                aria-label={`${badge} · ${item.title}`}
              >
                <span style={{ display: "block", font: "var(--text-h3)", color: "var(--text-strong)" }}>{item.title}</span>
                <span style={{ display: "block", marginTop: 6, fontSize: "var(--fs-sm)", lineHeight: "var(--lh-relaxed)", color: "var(--text-body)" }}>{item.excerpt}</span>
                <span style={{ display: "block", marginTop: 6, fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>{ymd(item.createdAt)}</span>
              </button>
            ))}
            {!expanded && list.length > PETITION_PREVIEW && <MoreButton onClick={() => setExpanded(true)} />}
          </div>
        )}
      </div>
    </div>
  );
}

/* 신고 모달(DetailScreen.jsx ReportDialog)과 같은 뼈대(스크림 + 면)를 쓴다. */
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
    <div role="dialog" aria-modal="true" aria-labelledby="delete-account-title" onClick={() => !busy && onClose()} className="ds-dialog-scrim">
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="ds-dialog">
        <h2 id="delete-account-title">회원탈퇴</h2>
        <p style={{ margin: "6px 0 14px", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>계정 삭제를 위해 가입한 비밀번호를 입력해 주세요.</p>
        <div style={{ background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", padding: "12px 14px", fontSize: "var(--fs-caption)", color: "var(--text-muted)", lineHeight: "var(--lh-relaxed)", marginBottom: 16 }}>
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
  const [dialog, setDialog] = useState(null); // "voted" | "answered" — 통계가 띄우는 목록 창

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
  /* 통계가 띄우는 두 목록. ponytail: 위 count 는 서버가 센 값이고 이 목록은 화면에 로드된
     최근 100건에서 고른 것이라, 100건 너머의 오래된 건의는 숫자에는 있어도 목록에는 안 나온다.
     전용 목록 엔드포인트가 생기면 그때 맞춘다 — 지금 화면이 아는 건 이 100건뿐이다. */
  const votedPetitions = petitions.filter((p) => voted[p.id]);
  const myAnsweredPetitions = petitions.filter((p) => p.mine && p.status === "answered");

  const shownNotifications = notifExpanded ? notifications : notifications.slice(0, 5);
  const shownBookmarks = bookmarksExpanded ? bookmarkedPetitions : bookmarkedPetitions.slice(0, 5);
  const shownComments = commentsExpanded ? myComments : myComments.slice(0, 5);

  return (
    <div className="mypage">
      <ProfileHead
        dept={user.dept}
        loginId={user.loginId}
        stats={[
          { value: mineCount, label: "등록한 건의", to: "/mine" },
          { value: voteCount, label: "누른 요청", onClick: () => setDialog("voted") },
          { value: answeredCount, label: "받은 답변", onClick: () => setDialog("answered") },
        ]}
      />

      {dialog === "voted" && (
        <PetitionDialog badge="누른 요청" empty="요청을 누른 건의가 없습니다." list={votedPetitions} onClose={() => setDialog(null)} />
      )}
      {dialog === "answered" && (
        <PetitionDialog badge="받은 답변" empty="답변을 받은 건의가 없습니다." list={myAnsweredPetitions} onClose={() => setDialog(null)} />
      )}

      <div className="mypage-grid">
        {/* 왼쪽: 계정 설정 — 학부 수정 · 계정 정보 · 알림 설정 · 도움말 */}
        <div className="mypage-col">
          <Section title="소속 학부 수정">
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
              <Select label="소속 학부" options={departments} value={deptId} onChange={(e) => setDeptId(e.target.value)} placeholder="학부를 선택하세요" />
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Button variant="outline" onClick={() => navigate("/mine")}>내 건의 보기</Button>
                <Button variant="primary" disabled={!deptId || saving} onClick={save}>저장</Button>
              </div>
            </div>
          </Section>

          <Section title="계정 정보 변경">
            <div className="mypage-list">
              <AccountRow icon="lock" label="비밀번호 변경" onClick={() => setChangePwOpen(true)} />
            </div>
          </Section>

          {/* 저장할 곳이 없던 토글 3개(도달률·답변·공감)를 걷어내고, 백엔드가 실제로 알림을 보내는
              지점을 보여주는 화면으로 넘긴다 — NotificationSettingsScreen.jsx. */}
          <Section title="알림 설정" meta={unread > 0 ? `${unread}건 안 읽음` : undefined}>
            <div className="mypage-list">
              <AccountRow icon="bell" label="알림 종류" onClick={() => navigate("/mypage/notifications")} />
            </div>
          </Section>

          <Section title="도움말">
            <div className="mypage-list">
              <HelpLinkRow href={TERMS_PATH} label="이용약관 및 커뮤니티 정책" />
              <HelpLinkRow href={PRIVACY_POLICY_PATH} label="개인정보처리방침" />
            </div>
          </Section>

          <Button variant="outline" block onClick={logout}>로그아웃</Button>
          <button type="button" className="mypage-quit" onClick={() => setDeleteOpen(true)}>
            회원탈퇴
          </button>
        </div>

        {/* 오른쪽: 활동 — 알림 · 북마크한 건의 · 내가 쓴 댓글 */}
        <div className="mypage-col">
          <Section
            title="알림"
            meta={unread > 0 ? `${unread}건 안 읽음` : undefined}
            action={
              notifications.length > 0 ? (
                <button type="button" className="mypage-section-action" onClick={markAllNotifRead}>
                  모두 읽음
                </button>
              ) : undefined
            }
          >
            {notifications.length === 0 ? (
              <p className="mypage-empty">알림이 없습니다.</p>
            ) : (
              <>
                <div className="mypage-list">
                  {shownNotifications.map((n) => {
                    const m = pointOf(n.type);
                    return (
                      <button
                        key={n.id}
                        type="button"
                        className="notif-row"
                        data-unread={n.read ? undefined : ""}
                        onClick={() => {
                          if (!n.read) markNotifRead(n.id);
                          // 공지(NOTICE) 알림엔 청원이 없다 — /p/undefined 로 튀지 않게 막는다.
                          if (n.petitionId) navigate(`/p/${n.petitionId}`);
                        }}
                      >
                        <span className="notif-tile">
                          <Icon name={m.icon} size={17} />
                        </span>
                        <span className="notif-body">
                          <b className="notif-title">{n.title}</b> {n.body}
                          <span className="notif-date" style={{ display: "block" }}>{n.date}</span>
                        </span>
                      </button>
                    );
                  })}
                  {!notifExpanded && notifications.length > 5 && <MoreButton onClick={() => setNotifExpanded(true)} />}
                </div>
              </>
            )}
          </Section>

          <Section title="북마크한 건의" meta={bookmarkedPetitions.length ? `${bookmarkedPetitions.length}건` : undefined}>
            {bookmarkedPetitions.length === 0 ? (
              <p className="mypage-empty">북마크한 건의가 없습니다.</p>
            ) : (
              <div className="mypage-list">
                {shownBookmarks.map((p) => (
                  <button key={p.id} type="button" className="mypage-row" onClick={() => navigate(`/p/${p.id}`)}>
                    <span className="mypage-row-label">{p.title}</span>
                  </button>
                ))}
                {!bookmarksExpanded && bookmarkedPetitions.length > 5 && <MoreButton onClick={() => setBookmarksExpanded(true)} />}
              </div>
            )}
          </Section>

          <Section title="내가 쓴 댓글" meta={myComments.length ? `${myComments.length}건` : undefined}>
            {myComments.length === 0 ? (
              <p className="mypage-empty">아직 작성한 댓글이 없습니다.</p>
            ) : (
              <div className="mypage-list">
                {shownComments.map((c) => (
                  <button
                    key={`${c.petitionId}-${c.id}`}
                    type="button"
                    className="mypage-row"
                    style={{ display: "block", padding: "13px 0" }}
                    onClick={() => navigate(`/p/${c.petitionId}`)}
                  >
                    <span style={{ display: "block", fontSize: "var(--fs-caption)", fontWeight: "var(--fw-semibold)", color: "var(--color-primary)" }}>{c.title}</span>
                    <span style={{ display: "block", marginTop: 4, fontSize: "var(--fs-sm)", color: "var(--text-body)" }}>{c.body}</span>
                    <span style={{ display: "block", marginTop: 4, fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>{c.date}</span>
                  </button>
                ))}
                {!commentsExpanded && myComments.length > 5 && <MoreButton onClick={() => setCommentsExpanded(true)} />}
              </div>
            )}
          </Section>
        </div>
      </div>

      {deleteOpen && <DeleteAccountDialog onClose={() => setDeleteOpen(false)} />}
      {changePwOpen && <ChangePasswordDialog onClose={() => setChangePwOpen(false)} />}
    </div>
  );
}
