/* 청원 등록 (ROADMAP 1-6). 원본: web-app-v7.jsx 418–459행.
   원본 425행은 임계치를 catKey === "department" ? 180 : 480 으로 하드코딩한다 —
   여기서는 categories[].threshold/basis 를 읽는다. Admin 담당자 화면과 같은 출처다 (의존 C). */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePetitions } from "../../stores/petitions";
import { Button, Card, CategoryTag, Icon, Input, Select, Textarea, ThresholdBar } from "../../components/ui";
import { toast } from "../../components/Toast";

export default function SubmitScreen() {
  const categories = usePetitions((s) => s.categories);
  const submit = usePetitions((s) => s.submit);
  const navigate = useNavigate();
  const [cat, setCat] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = categories.find((c) => c.key === cat);

  const done = async () => {
    setSaving(true);
    try {
      await submit({ category: cat, title, body });
      // 기본 정렬이 공감순이라 새 청원(공감 0)은 맨 아래로 간다 — 등록 직후만 최신순으로 연다.
      navigate("/", { state: { sort: "new" } });
      toast("건의가 익명으로 등록되었습니다");
    } catch (err) {
      toast(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "22px var(--page-gutter) 90px" }}>
      <button type="button" onClick={() => navigate("/")} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text-body)", fontWeight: 600, fontSize: 14, marginBottom: 18, fontFamily: "var(--font-sans)" }}>
        <Icon name="arrowLeft" size={18} /> 취소
      </button>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "var(--text-strong)" }}>건의 등록</h1>
        <p style={{ margin: "6px 0 0", color: "var(--text-body)", fontSize: 14.5 }}>
          당신의 목소리를 들려주세요. 모든 건의는 <b style={{ color: "var(--indigo-600)" }}>익명</b>으로 등록되며, 공감이 도달률 100%를 달성하면 담당 부서로 전달됩니다.
        </p>
      </div>

      <Card padding="var(--pad-card-lg)" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Select
          label="카테고리"
          options={categories.map((c) => ({ value: c.key, label: c.label }))}
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          placeholder="카테고리를 선택하세요"
        />
        <Input label="제목" placeholder="핵심을 담은 한 문장으로 작성해 주세요" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label="건의 내용" maxLength={1000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="현재 상황과 개선이 필요한 이유를 구체적으로 적어 주세요." />

        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--indigo-50)", borderRadius: "var(--radius-md)", padding: "14px 16px" }}>
          <span style={{ flexShrink: 0, marginTop: 1, color: "var(--indigo-600)", display: "inline-flex" }}><Icon name="shield" size={17} /></span>
          <span style={{ fontSize: 13.5, color: "var(--indigo-700)", lineHeight: 1.65 }}>
            공감 도달률은 카테고리별 기준(학과 정원 또는 전체 학생 대비 %)에 따라 <b>관리자가 설정</b>합니다. 공감이 도달률 100%를 달성하면 담당 부서로 자동 전달됩니다.
            <br />
            등록 후 <b>10분 동안은 새 건의를 올릴 수 없습니다.</b> 이 시간은 등록한 건의를 삭제해도 줄어들지 않으니, 내용을 확인하고 등록해 주세요.
          </span>
        </div>

        {selected && (
          <div style={{ background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>
              미리보기 <CategoryTag category={selected.key} size="sm" />
            </div>
            <ThresholdBar current={0} threshold={selected.threshold} basisLabel={selected.basis} />
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Button variant="outline" onClick={() => navigate("/")}>취소</Button>
          <Button variant="primary" disabled={!title.trim() || !body.trim() || !cat || saving} onClick={done} leadingIcon={<Icon name="check" size={16} />}>익명으로 등록</Button>
        </div>
      </Card>
    </div>
  );
}
