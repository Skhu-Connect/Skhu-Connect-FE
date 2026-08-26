/* 알림 설정 (이슈 #86). 마이페이지 > 알림 설정 행에서 들어온다.

   백엔드 NotificationEventService 가 알림을 만드는 지점 5곳(notifMeta.js NOTIF_POINTS)을
   보여주고, 각 포인트로 실제 받은 알림을 그 자리에서 걸러 볼 수 있게 한다.

   종류별 on/off 토글은 docs/be-notification-settings-spec.md 의 계약
   (PATCH /connect/users/me/notification-settings)에 맞춰 미리 붙여 뒀다. 그 엔드포인트가 아직
   배포 전이라 GET /connect/users/me 에 notificationSettings 가 없으면 토글은 "준비 중"으로
   잠긴다 — 배포되는 순간 이 파일 수정 없이 풀린다.

   예전 마이페이지의 "도달률/답변/공감" 토글 3개는 아무 데도 저장되지 않는 가짜였고,
   이 화면이 그걸 진짜 계약으로 대체한다. */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../../stores/session";
import { usePetitions } from "../../stores/petitions";
import { Card, Icon } from "../../components/ui";
import { toast } from "../../components/Toast";
import { NOTIF_POINTS, pointOf } from "../../components/web/notifMeta";

/* 마이페이지에서 옮겨온 토글. 이제 여기서만 쓴다. */
function Toggle({ on, label, disabled, onClick }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      style={{ width: 44, height: 26, borderRadius: 99, border: "none", cursor: disabled ? "not-allowed" : "pointer", background: on ? "var(--indigo-600)" : "var(--gray-150)", position: "relative", flexShrink: 0, padding: 0, opacity: disabled ? 0.45 : 1 }}
    >
      <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "var(--shadow-sm)", transition: "left .15s ease" }} />
    </button>
  );
}

/* 카드 본문(누르면 필터)과 토글은 형제로 둔다 — button 안에 button 을 넣으면 HTML 이 깨진다. */
function PointCard({ point, total, unread, selected, enabled, pending, onSelect, onToggle }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 13,
        padding: "16px 18px",
        background: selected ? "var(--indigo-50)" : "#fff",
        border: `1px solid ${selected ? "var(--indigo-200)" : "var(--border-subtle)"}`,
        borderRadius: "var(--radius-lg)",
      }}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        style={{ display: "flex", alignItems: "flex-start", gap: 13, flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-sans)" }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: point.bg, color: point.fg, display: "flex", alignItems: "center", justifyContent: "center", opacity: enabled ? 1 : 0.45 }}>
          <Icon name={point.icon} size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14.5, fontWeight: 800, color: enabled ? "var(--text-strong)" : "var(--text-muted)" }}>{point.title}</span>
            {unread > 0 && (
              <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: "var(--coral-600)", borderRadius: 99, padding: "1px 7px" }}>{unread}</span>
            )}
            {!enabled && !pending && (
              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", background: "var(--gray-150)", borderRadius: 99, padding: "1px 7px" }}>꺼짐</span>
            )}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.55 }}>{point.desc}</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", marginTop: 7 }}>
            {total > 0 ? `지금까지 ${total}건 받음` : "아직 받은 알림 없음"}
          </div>
        </div>
      </button>
      <Toggle on={enabled} disabled={pending} label={`${point.title} 알림`} onClick={onToggle} />
    </div>
  );
}

export default function NotificationSettingsScreen() {
  const user = useSession((s) => s.user);
  const notifications = usePetitions((s) => s.notifications);
  const refreshNotifications = usePetitions((s) => s.refreshNotifications);
  const markNotifRead = usePetitions((s) => s.markNotifRead);
  const markAllNotifRead = usePetitions((s) => s.markAllNotifRead);
  const updateNotificationSettings = useSession((s) => s.updateNotificationSettings);
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(null);

  /* 서버가 notificationSettings 를 아직 안 내려주면 전부 켜진 것으로 보이되 토글은 잠근다. */
  const settings = user?.notificationSettings ?? null;
  const ready = settings !== null;
  const isOn = (key) => (ready ? settings[key] !== false : true);

  const toggle = async (key, title) => {
    if (!ready) return toast("알림 종류별 설정은 아직 준비 중이에요.");
    const next = !isOn(key);
    setSaving(key);
    try {
      await updateNotificationSettings({ [key]: next });
      toast(next ? `${title} 알림을 켰습니다` : `${title} 알림을 껐습니다`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "알림 설정을 저장하지 못했습니다.");
    } finally {
      setSaving(null);
    }
  };

  // WebLayout 이 주기적으로도 부르지만, 들어오자마자 한 번은 최신으로 맞춘다.
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const countsOf = (point) => {
    const mine = notifications.filter((n) => point.types.includes(n.type));
    return { total: mine.length, unread: mine.filter((n) => !n.read).length };
  };
  const shown = selected
    ? notifications.filter((n) => NOTIF_POINTS.find((p) => p.key === selected).types.includes(n.type))
    : notifications;
  const selectedPoint = selected ? NOTIF_POINTS.find((p) => p.key === selected) : null;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px var(--page-gutter) 80px", display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <Link to="/mypage" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textDecoration: "none" }}>
          <Icon name="chevronLeft" size={15} />
          마이페이지
        </Link>
        <h1 style={{ margin: "10px 0 0", fontSize: 22, fontWeight: 800, color: "var(--text-strong)" }}>알림 설정</h1>
        <p style={{ margin: "7px 0 0", fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
          받고 싶은 알림만 골라서 켜고 끌 수 있어요. 항목을 누르면 그 알림만 모아서 볼 수 있어요.
        </p>
      </div>

      {/* 서버가 주는 유일한 알림 스위치. 변경 엔드포인트가 없어 읽기 전용으로 상태만 보여준다. */}
      <Card padding="18px" style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: "var(--indigo-50)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="bell" size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text-strong)" }}>
            알림 수신 {user?.notificationEnabled === false ? "중지됨" : "사용 중"}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.55 }}>
            {ready
              ? "기기로 오는 푸시 알림은 iOS 앱에서만 보내드려요. 웹에서는 이 목록과 상단 알림 벨로 확인할 수 있어요."
              : "알림 종류를 하나씩 끄고 켜는 기능은 준비 중이에요. 지금은 모든 알림을 받고 있어요."}
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {NOTIF_POINTS.map((point) => {
          const { total, unread } = countsOf(point);
          return (
            <PointCard
              key={point.key}
              point={point}
              total={total}
              unread={unread}
              selected={selected === point.key}
              enabled={isOn(point.key)}
              pending={!ready || saving === point.key}
              onSelect={() => setSelected(selected === point.key ? null : point.key)}
              onToggle={() => toggle(point.key, point.title)}
            />
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--text-strong)" }}>
            {selectedPoint ? `${selectedPoint.title} 알림` : "받은 알림 전체"}
          </h2>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)" }}>{shown.length}건</span>
          {selected && (
            <button type="button" onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700, color: "var(--indigo-600)" }}>
              전체 보기
            </button>
          )}
          <button type="button" onClick={markAllNotifRead} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700, color: "var(--indigo-600)" }}>
            모두 읽음
          </button>
        </div>

        <Card padding={0} style={{ overflow: "hidden" }}>
          {shown.length === 0 ? (
            <div style={{ padding: 18, fontSize: 13.5, color: "var(--text-muted)" }}>해당하는 알림이 없습니다.</div>
          ) : (
            shown.map((n, i) => {
              const m = pointOf(n.type);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (!n.read) markNotifRead(n.id);
                    if (n.petitionId) navigate(`/p/${n.petitionId}`);
                  }}
                  style={{ display: "flex", gap: 11, width: "100%", textAlign: "left", padding: "13px 18px", background: n.read ? "transparent" : "var(--indigo-50)", border: "none", borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)", cursor: "pointer", fontFamily: "var(--font-sans)" }}
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
      </div>
    </div>
  );
}
