/* 신고 폼 시트. 상세 화면에만 있다가 피드 카드에서도 신고할 수 있게 되면서 공용으로 뺐다 —
   두 벌로 두면 신고 사유 목록과 글자수 검증이 갈린다. 웹 components/web/ReportDialog 와 같은 짝이다. */
import { useState } from "react";
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { colors, font } from "./theme";
import type { ReportReasonType } from "./api";

const t = { fontFamily: font };
const REPORT_REASONS: { value: ReportReasonType; label: string }[] = [
  { value: "SPAM", label: "광고·도배" },
  { value: "ABUSE", label: "욕설·괴롭힘" },
  { value: "INAPPROPRIATE", label: "부적절한 콘텐츠" },
  { value: "FALSE_INFORMATION", label: "허위 정보" },
  { value: "OTHER", label: "기타" },
];


export function ReportSheet({ target, onClose, onSubmit }: { target: string; onClose: () => void; onSubmit: (reasonType: ReportReasonType, reasonDetail: string) => Promise<void> }) {
  const [reasonType, setReasonType] = useState<ReportReasonType | null>(null);
  const [reasonDetail, setReasonDetail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!reasonType) return setError("신고 종류를 선택해 주세요.");
    if (reasonDetail.trim().length < 10) return setError("신고 이유를 10자 이상 입력해 주세요.");
    setBusy(true);
    try {
      await onSubmit(reasonType, reasonDetail);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "신고 접수에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15, 23, 42, .45)" }}>
        <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28, gap: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}><Text style={[t, { fontSize: 18, fontWeight: "800", color: colors.strong }]}>{target} 신고</Text><Text style={[t, { fontSize: 12.5, color: colors.muted, marginTop: 3 }]}>관리자가 신고 내용과 사유를 검토합니다.</Text></View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="신고 창 닫기" hitSlop={10}><Text style={[t, { fontSize: 15, fontWeight: "700", color: colors.muted }]}>닫기</Text></Pressable>
          </View>
          <Text style={[t, { fontSize: 13, fontWeight: "700", color: colors.strong }]}>신고 종류</Text>
          <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
            {REPORT_REASONS.map((reason) => {
              const selected = reasonType === reason.value;
              return <Pressable key={reason.value} onPress={() => { setReasonType(reason.value); setError(""); }} accessibilityRole="radio" accessibilityState={{ selected }} style={{ flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1.5, borderColor: selected ? colors.indigo[600] : colors.line, borderRadius: 10, padding: 11, backgroundColor: selected ? colors.indigo[50] : "#fff" }}><View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 4, borderColor: selected ? colors.indigo[600] : colors.gray[300] }} /><Text style={[t, { fontSize: 13.5, fontWeight: selected ? "700" : "500", color: colors.strong }]}>{reason.label}</Text></Pressable>;
            })}
          </View>
          <Text style={[t, { fontSize: 13, fontWeight: "700", color: colors.strong, marginTop: 2 }]}>신고 이유</Text>
          <TextInput value={reasonDetail} onChangeText={(text) => { setReasonDetail(text); setError(""); }} multiline maxLength={500} placeholder="신고 이유를 10자 이상 입력해 주세요." placeholderTextColor={colors.muted} textAlignVertical="top" style={[t, { minHeight: 104, borderWidth: 1.5, borderColor: error ? colors.danger : colors.line, borderRadius: 10, padding: 12, fontSize: 13.5, color: colors.strong }]} />
          {error ? <Text style={[t, { fontSize: 12, color: colors.danger }]}>{error}</Text> : null}
          <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <Pressable onPress={onClose} disabled={busy} accessibilityRole="button" style={{ paddingVertical: 11, paddingHorizontal: 16 }}><Text style={[t, { fontSize: 14, fontWeight: "700", color: colors.body }]}>취소</Text></Pressable>
            <Pressable onPress={submit} disabled={busy} accessibilityRole="button" style={{ backgroundColor: colors.danger, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 16, opacity: busy ? .5 : 1 }}><Text style={[t, { fontSize: 14, fontWeight: "700", color: "#fff" }]}>{busy ? "접수 중…" : "신고하기"}</Text></Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
