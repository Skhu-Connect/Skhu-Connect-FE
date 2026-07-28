import { KeyboardAvoidingView, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../icons";
import { BASIS_NOTE, CAT_CHIPS, CAT_LABEL, type CategoryKey } from "../data";
import { basisFor, thresholdFor } from "../logic";
import { Button, Card, CategoryTag, Input, Select, Textarea, ThresholdBar } from "../ui";
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
};

export function SubmitScreen(p: SubmitProps) {
  const insets = useSafeAreaInsets();
  const key = categoryOf(p.category);
  const basis = key ? basisFor(key) : null;
  const disabled = !p.category || !p.title.trim();

  return (
    <View className="flex-1 bg-page">
      <View className="flex-row items-center px-[10px] bg-card border-b border-subtle" style={{ height: 52 }}>
        <Pressable onPress={p.onBack} accessibilityRole="button" accessibilityLabel="닫기" className="w-9 h-9 items-center justify-center rounded-full">
          <Icon name="x" size={19} color={colors.strong} />
        </Pressable>
        <Text style={[t, { fontWeight: "800", fontSize: 16.5, color: colors.strong, marginLeft: 4 }]}>청원 등록</Text>
      </View>

      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={insets.top + 52} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 26, gap: 16 }}>
          <View style={{ backgroundColor: colors.indigo[50], borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: 15, flexDirection: "row", gap: 9, alignItems: "flex-start" }}>
            <View style={{ marginTop: 2 }}>
              <Icon name="lock" size={16} color={colors.indigo[600]} />
            </View>
            <Text style={[t, { flex: 1, fontSize: 12.5, color: colors.indigo[700], lineHeight: 20 }]}>
              모든 청원은 <Text style={{ fontWeight: "700" }}>익명</Text>으로 등록됩니다. 공감이 임계치를 넘으면 카테고리 담당 부서로 자동 전달됩니다.
            </Text>
          </View>

          <Select label="카테고리" options={OPTIONS} value={p.category} onChange={p.onCategory} placeholder="카테고리를 선택하세요" />
          <Input label="제목" value={p.title} onChangeText={p.onTitle} placeholder="핵심을 담은 한 문장으로 작성해 주세요" />
          <Textarea label="건의 내용" value={p.body} onChangeText={p.onBody} maxLength={MAX_LEN} placeholder="현재 상황과 개선이 필요한 이유를 구체적으로 적어 주세요." />

          {key && basis ? (
            <Card style={{ gap: 11 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                <Text style={[t, { fontSize: 12, color: colors.muted, fontWeight: "700" }]}>적용될 임계치</Text>
                <CategoryTag category={key} size="sm" />
              </View>
              <ThresholdBar current={0} threshold={thresholdFor(basis)} basisLabel={basis} />
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
