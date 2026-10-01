import { useEffect, useState } from "react";
import { AccessibilityInfo, KeyboardAvoidingView, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../icons";
import { BASIS_NOTE, CAT_CHIPS, CAT_LABEL, type CategoryKey, type Petition } from "../data";
import { badgeStatus, basisFor, count, type Votes } from "../logic";
import * as api from "../api";
import { ApiError, currentThreshold, type SimilarUsage } from "../api";
import { Button, Card, CategoryTag, Input, Select, StatusBadge, Textarea, ThresholdBar } from "../ui";
import { colors, font, radius } from "../theme";

const t = { fontFamily: font };

const MAX_LEN = 1000;
const OPTIONS = CAT_CHIPS.filter((c) => c.key !== "all").map((c) => c.label);

/** 라벨("장학") → 키("scholarship"). Select 가 라벨을 돌려주므로 되짚는다. */
export function categoryOf(label: string): CategoryKey | null {
  const hit = (Object.keys(CAT_LABEL) as CategoryKey[]).find((k) => CAT_LABEL[k] === label);
  return hit ?? null;
}

export type SubmitProps = {
  category: string;
  title: string;
  body: string;
  onCategory: (v: string) => void;
  onTitle: (v: string) => void;
  onBody: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  /* 마지막 유사 청원 결과(null = 아직 안 찾음)와 서버 사용량. 상세로 갔다 와도 남도록 App 이 들고 있다. */
  similar: Petition[] | null;
  usage: SimilarUsage | null;
  votes: Votes;
  onSimilar: (v: Petition[]) => void;
  onUsage: (v: SimilarUsage | null | ((u: SimilarUsage | null) => SimilarUsage | null)) => void;
  onOpenSimilar: (id: number) => void;
};

export function SubmitScreen(p: SubmitProps) {
  const insets = useSafeAreaInsets();
  const key = categoryOf(p.category);
  const basis = key ? basisFor(key) : null;
  const disabled = !p.category || !p.title.trim();
  const { usage, onUsage } = p;
  const exhausted = usage?.remaining === 0;
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // 진입할 때마다 서버 사용량으로 맞춘다(나갔다 와도 막힌 상태가 유지되고, 그 사이 풀렸으면 풀린다).
  useEffect(() => {
    api.getSimilarUsage().then(onUsage).catch(() => {}); // 실패하면 횟수 표시만 숨긴다 — 서버가 어차피 강제한다
  }, [onUsage]);
  // 막혀 있으면 풀리는 시각에 사용량을 한 번 더 물어 버튼을 다시 연다. 시각을 모르면 1분마다 — deps 가 usage
  // 객체라 응답이 올 때마다 타이머가 다시 걸린다.
  useEffect(() => {
    if (!exhausted) return;
    const t = setTimeout(() => api.getSimilarUsage().then(onUsage).catch(() => {}), Math.max(5000, (usage?.retryAt ?? Date.now() + 60000) - Date.now() + 500));
    return () => clearTimeout(t);
  }, [exhausted, usage, onUsage]);
  // 막혀 있는 동안 "N분 N초 후" 문구가 줄어들도록 1초마다 다시 그린다.
  const [, tick] = useState(0);
  useEffect(() => {
    if (!exhausted) return;
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [exhausted]);

  const findSimilar = async () => {
    setSearching(true);
    setSearchError("");
    try {
      const { results, remaining } = await api.findSimilarPetitions(p.title, p.body);
      p.onSimilar(results);
      AccessibilityInfo.announceForAccessibility(results.length ? `비슷한 청원 ${results.length}건` : "비슷한 청원이 없습니다");
      if (remaining === 0) api.getSimilarUsage().then(onUsage).catch(() => onUsage((u) => (u ? { ...u, remaining: 0 } : u)));
      else if (remaining != null) onUsage((u) => (u ? { ...u, remaining } : u));
    } catch (e) {
      // 초안과 직전 결과는 그대로 둔다.
      if (e instanceof ApiError && e.status === 429) onUsage((u) => ({ limit: 3, windowSeconds: 600, ...u, remaining: 0, retryAt: e.body?.retryAt ?? u?.retryAt ?? null }));
      else setSearchError(e instanceof Error ? e.message : "유사 청원을 찾지 못했습니다.");
    } finally {
      setSearching(false);
    }
  };
  const wait = usage?.retryAt ? (usage.retryAt - Date.now()) / 1000 : 0;
  const note = { fontSize: 13, lineHeight: 19, color: colors.body };

  return (
    <View className="flex-1 bg-page">
      <View className="flex-row items-center px-[10px] bg-card border-b border-subtle" style={{ height: 52 }}>
        <Pressable onPress={p.onBack} accessibilityRole="button" accessibilityLabel="닫기" className="w-9 h-9 items-center justify-center rounded-full">
          <Icon name="x" size={19} color={colors.strong} />
        </Pressable>
        <Text style={[t, { fontWeight: "800", fontSize: 16.5, color: colors.strong, marginLeft: 4 }]}>건의 등록</Text>
      </View>

      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={insets.top + 52} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 26, gap: 16 }}>
          <View style={{ backgroundColor: colors.indigo[50], borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: 15, flexDirection: "row", gap: 9, alignItems: "flex-start" }}>
            <View style={{ marginTop: 2 }}>
              <Icon name="lock" size={16} color={colors.indigo[600]} />
            </View>
            <Text style={[t, { flex: 1, fontSize: 12.5, color: colors.indigo[700], lineHeight: 20 }]}>
              건의 취지에 맞지 않는 글은 <Text style={{ fontWeight: "700" }}>숨김처리 및 사용제한될 수 있습니다.</Text>
              {"\n"}등록 후 <Text style={{ fontWeight: "700" }}>10분 동안은 새 건의를 올릴 수 없습니다.</Text>
            </Text>
          </View>

          <Select label="카테고리" options={OPTIONS} value={p.category} onChange={p.onCategory} placeholder="카테고리를 선택하세요" />
          <Input label="제목" value={p.title} onChangeText={p.onTitle} placeholder="핵심을 담은 한 문장으로 작성해 주세요" />
          <Textarea label="건의 내용" value={p.body} onChangeText={p.onBody} maxLength={MAX_LEN} placeholder="현재 상황과 개선이 필요한 이유를 구체적으로 적어 주세요." />

          {/* 유사 청원 찾기 — 등록을 막지 않는다. 결과를 보든 안 보든 아래 등록 버튼은 그대로다. */}
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <Button variant="outline" size="sm" disabled={!p.title.trim() || !p.body.trim() || searching || exhausted} onPress={findSimilar}>
                {searching ? "찾는 중…" : "유사 청원 찾기"}
              </Button>
              {usage ? (
                <Text style={[t, { fontSize: 13, color: colors.muted }]}>
                  남은 검색 {usage.remaining}/{usage.limit}회 · {Math.round(usage.windowSeconds / 60)}분 기준
                </Text>
              ) : null}
            </View>
            {exhausted ? (
              <Text style={[t, note]}>
                {Math.round(usage.windowSeconds / 60)}분 동안 검색 {usage.limit}회를 모두 사용했습니다.{" "}
                {wait > 0 ? `${api.formatWait(wait)} 후 다시 찾을 수 있습니다.` : "잠시 후 다시 찾을 수 있습니다."}
              </Text>
            ) : null}
            {searchError ? <Text style={[t, note, { color: colors.danger }]}>{searchError}</Text> : null}
            {p.similar && p.similar.length === 0 ? <Text style={[t, note, { color: colors.muted }]}>비슷한 청원이 없습니다</Text> : null}
            {p.similar?.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => p.onOpenSimilar(s.id)}
                accessibilityRole="button"
                style={{ gap: 6, backgroundColor: colors.sunken, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 14 }}
              >
                <Text style={[t, { fontSize: 14.5, fontWeight: "700", color: colors.strong }]}>{s.title}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <CategoryTag category={s.category} size="sm" />
                  <StatusBadge status={badgeStatus(s)} size="sm" />
                  <Text style={[t, { fontSize: 12.5, color: colors.muted }]}>공감 {count(s, p.votes)}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          {key && basis ? (
            <Card style={{ gap: 11 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                <Text style={[t, { fontSize: 12, color: colors.muted, fontWeight: "700" }]}>적용될 도달률</Text>
                <CategoryTag category={key} size="sm" />
              </View>
              <ThresholdBar current={0} threshold={currentThreshold(key)} basisLabel={basis} />
              <Text style={[t, { fontSize: 12, color: colors.muted, lineHeight: 18.6 }]}>{BASIS_NOTE[basis]}</Text>
            </Card>
          ) : null}

          <Button variant="primary" size="lg" block disabled={disabled} onPress={p.onSubmit}>
            익명으로 등록
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
