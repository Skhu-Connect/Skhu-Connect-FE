/* 마이페이지 (ROADMAP Phase 5-2 → 이슈 #39 로 iOS MY 화면과 동일하게 재구성).
   헤더 아바타 드롭다운의 로그아웃, 알림 벨의 알림 목록, 환경설정 모달의 알림 설정 토글을
   전부 여기로 모았다 — 그 자리에서는 뺐다(중복 표시 방지). "내가 쓴 댓글"은 iOS 에는 없는
   화면 전용 섹션이다. 소속 학부 수정(Select+저장)은 기존 그대로 유지한다.

   레이아웃: iOS MY 화면을 그대로 옮겨 560px 단일 열로 짰던 걸 데스크톱 폭에 맞게 다시 짰다.
   히어로에 통계를 통합하고(WEB-02 피드 히어로와 같은 패턴), 나머지 섹션은
   FeedScreen 폭(--page-max)에서 2열로 펼친다 — auto-fit 그리드라 미디어 쿼리 없이도
   좁은 화면에서는 iOS 와 같은 세로 1열 순서로 접힌다. */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../stores/session";
import { usePetitions } from "../../stores/petitions";
import * as api from "../../api";
import { Avatar, Button, Card, Icon, Select } from "../../components/ui";
import { toast } from "../../components/Toast";
import { NOTIF_META } from "../../components/web/notifMeta";

// SettingsModal.jsx 의 ROWS 를 그대로 옮겼다.
const PREF_ROWS = [
  ["threshold", "도달률 알림", "내 건의가 도달률 100%에 도달하면 알려드립니다."],
  ["answer", "답변 등록 알림", "공감한 건의에 공식 답변이 등록되면 알려드립니다."],
  ["empathy", "공감 알림", "내 건의의 공감 수 변화를 알려드립니다."],
];

// SettingsModal.jsx 의 Toggle 을 그대로 옮겼다 — 여기서만 쓰여서 export 하지 않는다.
function Toggle({ on, label, onClick }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      style={{ width: 44, height: 26, borderRadius: 99, border: "none", cursor: "pointer", background: on ? "var(--indigo-600)" : "var(--gray-150)", position: "relative", flexShrink: 0, padding: 0 }}
    >
      <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "var(--shadow-sm)", transition: "left .15s ease" }} />
    </button>
  );
}

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
        {stats.map(([value, label]) => (
          <div key={label}>
            <div style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{value}</div>
            <div style={{ fontSize: 12.5, opacity: 0.8, marginTop: 3, fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", right: -60, top: -50, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
      <div style={{ position: "absolute", right: 60, bottom: -100, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
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

export default function MyPageScreen() {
  const user = useSession((s) => s.user);
  const updateProfile = useSession((s) => s.updateProfile);
  const prefs = useSession((s) => s.prefs) ?? {};
  const savePrefs = useSession((s) => s.savePrefs);
  const logout = useSession((s) => s.logout);
  const navigate = useNavigate();

  const petitions = usePetitions((s) => s.petitions);
  const bookmarked = usePetitions((s) => s.bookmarked);
  const myTotals = usePetitions((s) => s.myTotals);
  const notifications = usePetitions((s) => s.notifications);
  const markAllNotifRead = usePetitions((s) => s.markAllNotifRead);
  const markNotifRead = usePetitions((s) => s.markNotifRead);
  const myComments = usePetitions((s) => s.myComments);
  const loadMyComments = usePetitions((s) => s.loadMyComments);

  const [departments, setDepartments] = useState([]);
  const [dept, setDept] = useState(user.dept);
  const [saving, setSaving] = useState(false);
  const [notifExpanded, setNotifExpanded] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [bookmarksExpanded, setBookmarksExpanded] = useState(false);

  useEffect(() => {
    api.listDepartments().then(setDepartments);
    loadMyComments();
  }, [loadMyComments]);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({ dept });
      toast("학부 정보가 수정되었습니다");
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

  return (
    <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "28px var(--page-gutter) 80px", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* 서버가 이름을 안 준다(익명 설계) — 학부를 주 정보로 올리고 아이디를 보조로 둔다.
          "이름 빠진 자리" 가 아니라 익명 서비스에 맞는 표시로 다시 짰다. */}
      <HeroCard
        dept={user.dept}
        loginId={user.loginId}
        stats={[
          [mineCount, "등록한 건의"],
          [voteCount, "누른 공감"],
          [answeredCount, "받은 답변"],
        ]}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 24, alignItems: "start" }}>
        {/* 왼쪽: 계정 설정 — 학부 수정 · 알림 설정 · 로그아웃 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SectionHeader icon="pencil" bg="var(--indigo-50)" fg="var(--indigo-600)" title="소속 학부 수정" />
            <Card padding="var(--pad-card-lg)" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Select label="소속 학부" options={departments} value={dept} onChange={(e) => setDept(e.target.value)} placeholder="학부를 선택하세요" />
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Button variant="outline" onClick={() => navigate("/mine")}>내 건의 보기</Button>
                <Button variant="primary" disabled={!dept || saving} onClick={save}>저장</Button>
              </div>
            </Card>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SectionHeader icon="sliders" bg="var(--gray-150)" fg="var(--gray-700)" title="알림 설정" />
            <Card style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {PREF_ROWS.map(([key, title, desc]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 2px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--text-strong)" }}>{title}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{desc}</div>
                  </div>
                  <Toggle on={!!prefs[key]} label={title} onClick={() => savePrefs({ [key]: !prefs[key] })} />
                </div>
              ))}
            </Card>
          </div>

          <Button variant="outline" block onClick={logout}>로그아웃</Button>
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
                  const m = NOTIF_META[n.type];
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        if (!n.read) markNotifRead(n.id);
                        navigate(`/p/${n.petitionId}`);
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
    </div>
  );
}
