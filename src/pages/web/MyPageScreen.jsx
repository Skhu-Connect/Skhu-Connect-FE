/* 마이페이지 (ROADMAP Phase 5-2 → 이슈 #39 로 iOS MY 화면과 동일하게 재구성).
   헤더 아바타 드롭다운의 로그아웃, 알림 벨의 알림 목록, 환경설정 모달의 알림 설정 토글을
   전부 여기로 모았다 — 그 자리에서는 뺐다(중복 표시 방지). "내가 쓴 댓글"은 iOS 에는 없는
   화면 전용 섹션이다. 소속 학부 수정(Select+저장)은 기존 그대로 유지한다. */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../stores/session";
import { usePetitions } from "../../stores/petitions";
import * as api from "../../api";
import { Avatar, Button, Card, Icon, Select } from "../../components/ui";
import { toast } from "../../components/Toast";

// Header.jsx 의 NotifBell 이 쓰던 것을 그대로 옮겼다.
const NOTIF_META = {
  threshold: { icon: "trending", bg: "var(--status-review-bg)", fg: "var(--status-review-fg)" },
  answer: { icon: "checkCircle", bg: "var(--status-answered-bg)", fg: "var(--status-answered-fg)" },
  empathy: { icon: "heart", bg: "#FCE7E9", fg: "var(--coral-600)" },
};

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

function StatCard({ value, label }) {
  return (
    <Card style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 20, fontWeight: 800, color: "var(--indigo-600)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
      <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600 }}>{label}</span>
    </Card>
  );
}

function SectionTitle({ children }) {
  return <h2 style={{ margin: "28px 0 10px", fontSize: 15, fontWeight: 800, color: "var(--text-strong)" }}>{children}</h2>;
}

export default function MyPageScreen() {
  const user = useSession((s) => s.user);
  const updateProfile = useSession((s) => s.updateProfile);
  const prefs = useSession((s) => s.prefs) ?? {};
  const savePrefs = useSession((s) => s.savePrefs);
  const logout = useSession((s) => s.logout);
  const navigate = useNavigate();

  const petitions = usePetitions((s) => s.petitions);
  const voted = usePetitions((s) => s.voted);
  const notifications = usePetitions((s) => s.notifications);
  const markAllNotifRead = usePetitions((s) => s.markAllNotifRead);
  const myComments = usePetitions((s) => s.myComments);
  const loadMyComments = usePetitions((s) => s.loadMyComments);

  const [departments, setDepartments] = useState([]);
  const [dept, setDept] = useState(user.dept);
  const [saving, setSaving] = useState(false);

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

  const mineCount = petitions.filter((p) => p.mine).length;
  const voteCount = Object.values(voted).filter(Boolean).length;
  const answeredCount = petitions.filter((p) => p.mine && p.answer).length;
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ position: "relative", overflow: "hidden", background: "var(--gradient-hero)", padding: "40px var(--page-gutter) 32px", color: "#fff", display: "flex", alignItems: "center", gap: 16 }}>
        <Avatar name={user.name.slice(1)} size={56} ring />
        <div>
          <div style={{ fontSize: 19, fontWeight: 800 }}>{user.name}</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 3 }}>{user.dept}</div>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 var(--page-gutter)" }}>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <StatCard value={mineCount} label="등록한 건의" />
          <StatCard value={voteCount} label="누른 공감" />
          <StatCard value={answeredCount} label="받은 답변" />
        </div>

        <Card padding="var(--pad-card-lg)" style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 24 }}>
          <Select label="소속 학부" options={departments} value={dept} onChange={(e) => setDept(e.target.value)} placeholder="학부를 선택하세요" />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="outline" onClick={() => navigate("/mine")}>내 건의 보기</Button>
            <Button variant="primary" disabled={!dept || saving} onClick={save}>저장</Button>
          </div>
        </Card>

        <SectionTitle>알림</SectionTitle>
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
            notifications.map((n) => {
              const m = NOTIF_META[n.type];
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => navigate(`/p/${n.petitionId}`)}
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
        </Card>

        <SectionTitle>알림 설정</SectionTitle>
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

        <SectionTitle>내가 쓴 댓글</SectionTitle>
        {myComments.length === 0 ? (
          <Card style={{ fontSize: 13.5, color: "var(--text-muted)", textAlign: "center" }}>아직 작성한 댓글이 없습니다.</Card>
        ) : (
          <Card padding={0} style={{ overflow: "hidden" }}>
            {myComments.map((c, i) => (
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
          </Card>
        )}

        <div style={{ marginTop: 28 }}>
          <Button variant="outline" block onClick={logout}>로그아웃</Button>
        </div>
      </div>
    </div>
  );
}
