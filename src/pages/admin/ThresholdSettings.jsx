/* 관리자 임계치 설정 (#49). GET/PUT /connect/admin/threshold-settings.
   카테고리 5개 고정이라 스토어에 안 넣고 화면 로컬 상태로 조회·수정한다(SignupScreen·
   MyPageScreen 이 이미 쓰는, 화면이 api 를 직접 부르는 패턴). 카테고리 라벨은 petitions
   스토어가 AdminLayout 마운트 시 이미 불러온 categories 를 그대로 읽어 재조회하지 않는다. */

import { useEffect, useState } from "react";
import { usePetitions } from "../../stores/petitions";
import * as api from "../../api";
import PageHead from "../../components/admin/PageHead";
import { Button, CategoryTag, Input, Textarea } from "../../components/ui";

function EditForm({ setting, onCancel, onSave }) {
  const [totalStudentCount, setTotalStudentCount] = useState(String(setting.totalStudentCount ?? ""));
  const [thresholdRate, setThresholdRate] = useState(String(Math.round((setting.thresholdRate ?? 0) * 100)));
  const [minimumCount, setMinimumCount] = useState(String(setting.minimumCount ?? ""));
  const [changeReason, setChangeReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await onSave(setting.category, {
        totalStudentCount: Number(totalStudentCount),
        // 단순 나눗셈(/100)은 부동소수점 오차를 그대로 서버에 보낸다(예: 0.07 → 0.0007000000000000001).
        // 정수로 반올림한 뒤 나눠 0.01% 단위 정밀도로 고정한다.
        thresholdRate: Math.round(Number(thresholdRate) * 100) / 10000,
        minimumCount: Number(minimumCount),
        changeReason,
      });
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 12 }}>
      <Input label="전체 학생 수" type="number" min={1} value={totalStudentCount} onChange={(e) => setTotalStudentCount(e.target.value)} />
      <Input label="임계치 비율 (%)" type="number" min={0.01} max={100} step={0.01} value={thresholdRate} onChange={(e) => setThresholdRate(e.target.value)} />
      <Input label="최소 인원" type="number" min={1} value={minimumCount} onChange={(e) => setMinimumCount(e.target.value)} />
      <Textarea label="변경 사유" maxLength={500} value={changeReason} error={error || undefined} onChange={(e) => setChangeReason(e.target.value)} placeholder="변경 사유를 입력해 주세요." />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button size="sm" variant="outline" onClick={onCancel}>취소</Button>
        <Button size="sm" variant="primary" disabled={busy || !changeReason.trim() || !totalStudentCount || !thresholdRate || !minimumCount} onClick={submit}>
          저장
        </Button>
      </div>
    </div>
  );
}

function SettingCard({ setting, label, editing, onEdit, onCancel, onSave }) {
  return (
    <div style={{ background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)", padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <CategoryTag category={setting.category} size="sm" />
        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-strong)" }}>{label}</span>
        {!editing && (
          <Button size="sm" variant="outline" onClick={onEdit} style={{ marginLeft: "auto" }}>수정</Button>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginTop: 16, fontSize: 13 }}>
        <div>
          <div style={{ color: "var(--text-muted)", fontSize: 11.5 }}>전체 학생 수</div>
          <div style={{ fontWeight: 700, color: "var(--text-strong)", marginTop: 2 }}>{setting.totalStudentCount.toLocaleString()}명</div>
        </div>
        <div>
          <div style={{ color: "var(--text-muted)", fontSize: 11.5 }}>임계치 비율</div>
          <div style={{ fontWeight: 700, color: "var(--text-strong)", marginTop: 2 }}>{(setting.thresholdRate * 100).toFixed(2)}%</div>
        </div>
        <div>
          <div style={{ color: "var(--text-muted)", fontSize: 11.5 }}>최소 인원</div>
          <div style={{ fontWeight: 700, color: "var(--text-strong)", marginTop: 2 }}>{setting.minimumCount.toLocaleString()}명</div>
        </div>
        <div>
          <div style={{ color: "var(--text-muted)", fontSize: 11.5 }}>목표 공감 수</div>
          <div style={{ fontWeight: 700, color: "var(--indigo-600)", marginTop: 2 }}>{setting.targetAgreementCount.toLocaleString()}명</div>
        </div>
      </div>
      {setting.changeReason && (
        <div style={{ marginTop: 12, fontSize: 11.5, color: "var(--text-muted)" }}>
          최근 변경: {setting.changeReason}
        </div>
      )}
      {editing && <EditForm setting={setting} onCancel={onCancel} onSave={onSave} />}
    </div>
  );
}

export default function ThresholdSettings() {
  const categories = usePetitions((s) => s.categories);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editingKey, setEditingKey] = useState(null);

  const load = () => {
    setLoading(true);
    setLoadError(false);
    api.listAdminThresholdSettings().then(setSettings).catch(() => setLoadError(true)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async (category, patch) => {
    const updated = await api.updateAdminThresholdSetting(category, patch);
    setSettings((list) => list.map((s) => (s.category === category ? updated : s)));
    setEditingKey(null);
  };

  const labelOf = (key) => categories.find((c) => c.key === key)?.label ?? key;

  return (
    <div style={{ padding: "26px 30px", overflowY: "auto", flex: 1 }}>
      <PageHead title="임계치 설정" desc="카테고리별 공감 임계치(전체 학생 수·비율·최소 인원)를 조회·수정합니다." />
      {loading ? (
        <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>불러오는 중…</p>
      ) : loadError ? (
        <div>
          <p role="alert" style={{ fontSize: 13.5, color: "var(--danger-500)", marginBottom: 10 }}>임계치 설정을 불러오지 못했습니다.</p>
          <Button variant="outline" onClick={load}>다시 시도</Button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {settings.map((s) => (
            <SettingCard
              key={s.category}
              setting={s}
              label={labelOf(s.category)}
              editing={editingKey === s.category}
              onEdit={() => setEditingKey(s.category)}
              onCancel={() => setEditingKey(null)}
              onSave={save}
            />
          ))}
        </div>
      )}
    </div>
  );
}
