/* 청원 등록 (ROADMAP 1-6). 원본: web-app-v7.jsx 418–459행.
   원본 425행은 임계치를 catKey === "department" ? 180 : 480 으로 하드코딩한다 —
   여기서는 categories[].threshold/basis 를 읽는다. Admin 담당자 화면과 같은 출처다 (의존 C). */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePetitions } from "../../stores/petitions";
import { useSession } from "../../stores/session";
import * as api from "../../api";
import { Button, Card, CategoryTag, Icon, Input, Select, StatusBadge, Textarea, ThresholdBar, petitionStatus } from "../../components/ui";
import { toast } from "../../components/Toast";

/* 작성 중인 글과 마지막 유사 청원 결과. 유사 청원 제목을 눌러 /p/:id 로 가면 이 화면이 언마운트되므로
   컴포넌트 밖에 둔다 — 뒤로 오면 그대로 이어 쓴다. 등록 성공 시 비운다.
   ponytail: 모듈 변수라 새로고침·다른 탭에서는 사라진다(요구 범위 밖). 필요해지면 sessionStorage.
   owner 는 같은 탭에서 다른 계정으로 다시 로그인했을 때 앞 사람의 초안이 보이지 않게 하려는 것이다. */
let draft = null;

export default function SubmitScreen() {
  const categories = usePetitions((s) => s.categories);
  const submit = usePetitions((s) => s.submit);
  const navigate = useNavigate();
  const owner = useSession((s) => s.user?.loginId ?? null);
  const [saved] = useState(() => (draft && draft.owner === owner ? draft : null));
  const [cat, setCat] = useState(saved?.cat ?? "");
  const [title, setTitle] = useState(saved?.title ?? "");
  const [body, setBody] = useState(saved?.body ?? "");
  const [saving, setSaving] = useState(false);
  // similar: null(아직 안 찾음) | 결과 배열. usage: 서버가 준 { limit, windowSeconds, remaining, retryAt }.
  const [similar, setSimilar] = useState(saved?.similar ?? null);
  const [usage, setUsage] = useState(saved?.usage ?? null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const selected = categories.find((c) => c.key === cat);
  const exhausted = usage?.remaining === 0;

  // 등록 성공 뒤에는 저장하지 않는다 — navigate 가 트랜지션이라 언마운트 전에 한 번 더 렌더된다.
  const submitted = useRef(false);
  useEffect(() => {
    if (!submitted.current) draft = { owner, cat, title, body, similar, usage };
  });

  // 막혀 있으면 풀리는 시각에 사용량을 한 번 더 물어 버튼을 다시 연다. 시각을 모르면 1분마다 — deps 가 usage
  // 객체라 응답이 올 때마다 타이머가 다시 걸린다.
  useEffect(() => {
    if (!exhausted) return;
    const t = setTimeout(() => api.getSimilarUsage().then(setUsage).catch(() => {}), Math.max(5000, (usage?.retryAt ?? Date.now() + 60000) - Date.now() + 500));
    return () => clearTimeout(t);
  }, [exhausted, usage]);
  // 막혀 있는 동안 "N분 N초 후" 문구가 줄어들도록 1초마다 다시 그린다.
  const [, tick] = useState(0);
  useEffect(() => {
    if (!exhausted) return;
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [exhausted]);
  // 진입할 때마다 서버 사용량으로 맞춘다(나갔다 와도 막힌 상태가 유지되고, 그 사이 풀렸으면 풀린다).
  useEffect(() => {
    api.getSimilarUsage().then(setUsage).catch(() => {}); // 실패하면 횟수 표시만 숨긴다 — 서버가 어차피 강제한다
  }, []);

  const findSimilar = async () => {
    setSearching(true);
    setSearchError("");
    try {
      const { results, remaining } = await api.findSimilarPetitions({ title, content: body });
      setSimilar(results);
      if (remaining === 0) api.getSimilarUsage().then(setUsage).catch(() => setUsage((u) => (u ? { ...u, remaining: 0 } : u)));
      else if (remaining != null) setUsage((u) => (u ? { ...u, remaining } : u));
    } catch (err) {
      // 초안과 직전 결과는 그대로 둔다.
      if (err.status === 429) setUsage((u) => ({ limit: 3, windowSeconds: 600, ...u, remaining: 0, retryAt: err.retryAt ?? u?.retryAt ?? null }));
      else setSearchError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const done = async () => {
    setSaving(true);
    try {
      await submit({ category: cat, title, body });
      submitted.current = true;
      draft = null;
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
          당신의 목소리를 들려주세요. 모든 건의는 <b style={{ color: "var(--indigo-600)" }}>익명</b>으로 등록되며, 요청이 도달률 100%를 달성하면 담당 부서로 전달됩니다.
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

        {/* 유사 청원 찾기 — 등록을 막지 않는다. 결과를 보든 안 보든 아래 등록 버튼은 그대로다. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Button variant="outline" size="sm" disabled={!title.trim() || !body.trim() || searching || exhausted} onClick={findSimilar} leadingIcon={<Icon name="search" size={15} />}>
              {searching ? "찾는 중…" : "유사 청원 찾기"}
            </Button>
            {usage && (
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                남은 검색 {usage.remaining}/{usage.limit}회 · {Math.round(usage.windowSeconds / 60)}분 기준
              </span>
            )}
          </div>

          <div aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {exhausted && (
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-body)" }}>
                {Math.round(usage.windowSeconds / 60)}분 동안 검색 {usage.limit}회를 모두 사용했습니다.{" "}
                {usage.retryAt ? `${api.formatWait((usage.retryAt - Date.now()) / 1000)} 후 다시 찾을 수 있습니다.` : "잠시 후 다시 찾을 수 있습니다."}
              </p>
            )}
            {searchError && <p style={{ margin: 0, fontSize: 13.5, color: "var(--danger-500)" }}>{searchError}</p>}
            {similar && similar.length === 0 && <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-muted)" }}>비슷한 청원이 없습니다</p>}
            {similar && similar.length > 0 && (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {similar.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/p/${p.id}`)}
                      style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", gap: 6, background: "var(--surface-sunken)", border: "none", borderRadius: "var(--radius-md)", padding: "12px 14px", cursor: "pointer", fontFamily: "var(--font-sans)" }}
                    >
                      <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-strong)" }}>{p.title}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12.5, color: "var(--text-muted)" }}>
                        <CategoryTag category={p.category} size="sm" />
                        <StatusBadge status={petitionStatus(p)} size="sm" />
                        공감 {p.current}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--indigo-50)", borderRadius: "var(--radius-md)", padding: "14px 16px" }}>
          <span style={{ flexShrink: 0, marginTop: 1, color: "var(--indigo-600)", display: "inline-flex" }}><Icon name="shield" size={17} /></span>
          <span style={{ fontSize: 13.5, color: "var(--indigo-700)", lineHeight: 1.65 }}>
            건의 취지에 맞지 않는 글은 <b>숨김처리 및 사용제한될 수 있습니다.</b>
            <br />
            등록 후 <b>10분 동안은 새 건의를 올릴 수 없습니다.</b>
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
