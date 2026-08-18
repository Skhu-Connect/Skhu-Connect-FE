import { useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../icons";
import { BASIS_NOTE, CAT_LABEL, type Comment, type Petition } from "../data";
import { count, ddayLabel, ymd } from "../logic";
import type { Votes } from "../logic";
import { Avatar, Button, Card, CategoryTag, EmpathyButton, StatusBadge, ThresholdBar } from "../ui";
import { colors, font, gradient, radius } from "../theme";
import type { ReportReasonType } from "../api";

const t = { fontFamily: font };
const REPORT_REASONS: { value: ReportReasonType; label: string }[] = [
  { value: "SPAM", label: "광고·도배" },
  { value: "ABUSE", label: "욕설·괴롭힘" },
  { value: "INAPPROPRIATE", label: "부적절한 콘텐츠" },
  { value: "FALSE_INFORMATION", label: "허위 정보" },
  { value: "OTHER", label: "기타" },
];

function ReportSheet({ target, onClose, onSubmit }: { target: string; onClose: () => void; onSubmit: (reasonType: ReportReasonType, reasonDetail: string) => Promise<void> }) {
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

export type DetailProps = {
  petition: Petition;
  votes: Votes;
  comments: Comment[];
  draft: string;
  onDraft: (s: string) => void;
  onAddComment: () => void;
  onBack: () => void;
  onVote: () => void;
  onOpenShare: () => void;
  onReport: (reasonType: ReportReasonType, reasonDetail: string) => Promise<void>;
  onReportComment: (commentId: number, reasonType: ReportReasonType, reasonDetail: string) => Promise<void>;
  onBlockComment: (commentId: number) => void;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  /** 공유 링크로 들어와 아직 공감하지 않은 상태에서만 뜬다. */
  deepPrompt: boolean;
};

/* Feed.tsx 의 askSort 와 같은 이유로 Alert.alert 를 쓴다 — iOS 에서 버튼 목록이 액션시트처럼 뜬다.
   항목 2개짜리 메뉴에 커스텀 드롭다운을 새로 만들지 않는다. 실제 차단 확인창은 App.tsx 가 띄운다. */
function askCommentAction(commentId: number, onReport: (id: number) => void, onBlock: (id: number) => void) {
  Alert.alert("댓글", undefined, [
    { text: "신고", onPress: () => onReport(commentId) },
    { text: "차단", style: "destructive", onPress: () => onBlock(commentId) },
    { text: "취소", style: "cancel" },
  ]);
}

export function DetailScreen(p: DetailProps) {
  const insets = useSafeAreaInsets();
  const d = p.petition;
  const c = count(d, p.votes);
  const reached = c >= d.threshold;
  const answered = d.status === "answered";
  const [reportTarget, setReportTarget] = useState<{ type: "petition" } | { type: "comment"; id: number } | null>(null);

  const steps = [
    { label: "접수", note: `${ymd(d.createdAt)} 익명 등록 · 담당 카테고리 ${CAT_LABEL[d.category]}`, done: true },
    {
      label: "검토중",
      note: reached ? "도달률 100% 달성 · 담당 부서에 이메일·SMS로 전달되었습니다." : "도달률 100% 달성 시 담당 부서로 전달됩니다.",
      done: reached,
    },
    { label: "답변 완료", note: answered ? "공식 답변이 등록되었습니다." : "담당 부서 검토 후 공식 답변이 등록됩니다.", done: answered },
  ];

  const barHeight = 52 + 12 + Math.max(insets.bottom, 22);

  return (
    <View className="flex-1 bg-page">
      <View className="flex-row items-center px-[10px] bg-card border-b border-subtle" style={{ height: 52 }}>
        <Pressable onPress={p.onBack} accessibilityRole="button" accessibilityLabel="뒤로" className="w-9 h-9 items-center justify-center rounded-full">
          <Icon name="arrowLeft" size={20} color={colors.strong} />
        </Pressable>
        <Text style={[t, { fontWeight: "800", fontSize: 16.5, color: colors.strong, marginLeft: 4 }]}>건의 상세</Text>
        {/* 옆의 공유가 선아이콘이라 이모지 하나만 튀었다 — 같은 형식으로 맞춘다. */}
        <Pressable onPress={() => setReportTarget({ type: "petition" })} accessibilityRole="button" accessibilityLabel="게시글 신고" className="ml-auto w-9 h-9 items-center justify-center rounded-full">
          <Icon name="flag" size={19} color={colors.body} />
        </Pressable>
        <Pressable onPress={p.onOpenShare} accessibilityRole="button" accessibilityLabel="공유" className="w-9 h-9 items-center justify-center rounded-full">
          <Icon name="share" size={19} color={colors.body} />
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={insets.top + 52} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {p.deepPrompt ? (
            <LinearGradient {...gradient.mileage} style={{ paddingVertical: 12, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Icon name="heartSolid" size={15} color="#fff" />
              <Text style={[t, { fontSize: 12.5, fontWeight: "700", color: "#fff" }]}>에타에서 오셨네요. 아래에서 바로 공감해 주세요.</Text>
            </LinearGradient>
          ) : null}

          <View className="bg-card" style={{ paddingTop: 18, paddingHorizontal: 18, paddingBottom: 22, gap: 13 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <CategoryTag category={d.category} size="sm" />
              <StatusBadge status={d.status} size="sm" />
            </View>
            <Text style={[t, { fontWeight: "800", fontSize: 21, color: colors.strong, lineHeight: 28.6, letterSpacing: -0.315 }]}>{d.title}</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Text style={[t, { fontSize: 12.5, color: colors.muted }]}>{d.author}</Text>
              <Text style={[t, { fontSize: 12.5, color: colors.muted }]}>{ddayLabel(d)}</Text>
              <Text style={[t, { fontSize: 12.5, color: colors.muted }]}>조회 {d.views}</Text>
            </View>
            <Text style={[t, { fontSize: 14.5, color: colors.body, lineHeight: 25.8 }]}>{d.body}</Text>
          </View>

          <View style={{ paddingVertical: 14, paddingHorizontal: 16, gap: 13 }}>
            <Card style={{ gap: 12 }}>
              <ThresholdBar current={c} threshold={d.threshold} basisLabel={d.basis} size="lg" />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.sunken, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 13 }}>
                <Text style={[t, { fontSize: 11.5, fontWeight: "800", color: colors.indigo[600] }]}>도달률 기준</Text>
                <Text style={[t, { flex: 1, fontSize: 12, color: colors.body, lineHeight: 18 }]}>{BASIS_NOTE[d.basis]}</Text>
              </View>
            </Card>

            <Card style={{ gap: 14 }}>
              <Text style={[t, { fontSize: 13, fontWeight: "800", color: colors.strong }]}>처리 상태</Text>
              {steps.map((s) => (
                <View key={s.label} style={{ flexDirection: "row", gap: 11, alignItems: "flex-start" }}>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: s.done ? (s.label === "답변 완료" ? colors.success : colors.indigo[600]) : colors.gray[150],
                    }}
                  >
                    <Icon name="check" size={12} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[t, { fontSize: 13.5, fontWeight: "700", color: s.done ? colors.strong : colors.muted }]}>{s.label}</Text>
                    <Text style={[t, { fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 18 }]}>{s.note}</Text>
                  </View>
                </View>
              ))}
            </Card>

            {d.answer ? (
              <Card style={{ borderLeftWidth: 4, borderLeftColor: colors.success, backgroundColor: "#EFFAF4" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: colors.success, alignItems: "center", justifyContent: "center" }}>
                    <Icon name="checkCircle" size={16} color="#fff" />
                  </View>
                  <View>
                    <Text style={[t, { fontWeight: "700", fontSize: 13.5, color: colors.strong }]}>{d.answer.dept}</Text>
                    <Text style={[t, { fontSize: 11.5, color: colors.muted }]}>{d.answer.date}</Text>
                  </View>
                </View>
                <Text style={[t, { fontSize: 13.5, color: colors.body, lineHeight: 21.6 }]}>{d.answer.body}</Text>
              </Card>
            ) : null}

            <Card>
              <Text style={[t, { fontSize: 13, fontWeight: "800", color: colors.strong, marginBottom: 6 }]}>댓글 {p.comments.length}</Text>
              {p.comments.map((cm, i) => (
                <View key={`${cm.author}-${i}`} style={{ flexDirection: "row", gap: 11, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.subtle }}>
                  <Avatar name="익" size={32} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                      <Text style={[t, { fontWeight: "700", fontSize: 12.5, color: colors.strong }]}>{cm.author}</Text>
                      <Text style={[t, { fontSize: 11.5, color: colors.muted }]}>{cm.date}</Text>
                      {/* 내 댓글엔 안 띄운다 — 자기 신고는 무의미하고, 본인 차단은 서버가 400 으로 막는다(웹 CommentRow 와 같은 조건).
                          신고·차단을 줄에 펼치지 않고 ⋮ 뒤에 넣는다 — 공감까지 셋이 나란히 붙으면 줄이 복잡하고,
                          에타처럼 목록 행의 부가 동작을 오버플로 메뉴에 두는 게 학생들에게 익숙한 형태다. */}
                      {cm.id != null && !cm.mine ? (
                        <Pressable
                          onPress={() => askCommentAction(cm.id!, (id) => setReportTarget({ type: "comment", id }), p.onBlockComment)}
                          accessibilityRole="button"
                          accessibilityLabel="댓글 메뉴"
                          hitSlop={8}
                          style={{ marginLeft: "auto", width: 24, height: 24, alignItems: "center", justifyContent: "center" }}
                        >
                          <Icon name="moreVertical" size={16} color={colors.muted} />
                        </Pressable>
                      ) : null}
                    </View>
                    <Text style={[t, { fontSize: 13.5, color: colors.body, lineHeight: 22.3, marginTop: 4 }]}>{cm.body}</Text>
                  </View>
                </View>
              ))}
              <View style={{ flexDirection: "row", gap: 8, paddingTop: 12, alignItems: "center" }}>
                <TextInput
                  value={p.draft}
                  onChangeText={p.onDraft}
                  onSubmitEditing={p.onAddComment}
                  returnKeyType="send"
                  placeholder="익명으로 의견을 남겨보세요"
                  placeholderTextColor={colors.muted}
                  style={[t, { flex: 1, borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 15, fontSize: 13.5, color: colors.strong }]}
                />
                <Button variant="primary" size="sm" onPress={p.onAddComment}>
                  등록
                </Button>
              </View>
            </Card>
          </View>

          <View style={{ height: barHeight + 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: colors.subtle,
          paddingTop: 12,
          paddingHorizontal: 16,
          paddingBottom: Math.max(insets.bottom, 22),
          flexDirection: "row",
          gap: 10,
          alignItems: "center",
        }}
      >
        <EmpathyButton count={c} active={!!p.votes[d.id]} size="lg" block onToggle={p.onVote} />
        <Pressable
          onPress={p.onToggleBookmark}
          accessibilityRole="button"
          accessibilityLabel={p.bookmarked ? "북마크 해제" : "북마크"}
          accessibilityState={{ selected: p.bookmarked }}
          style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: p.bookmarked ? colors.indigo[600] : colors.line, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}
        >
          <Icon name={p.bookmarked ? "bookmarkSolid" : "bookmark"} size={20} color={colors.indigo[600]} />
        </Pressable>
        <Pressable
          onPress={p.onOpenShare}
          accessibilityRole="button"
          accessibilityLabel="에타에 공유"
          style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: colors.line, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}
        >
          <Icon name="link" size={20} color={colors.indigo[600]} />
        </Pressable>
      </View>
      {reportTarget ? <ReportSheet target={reportTarget.type === "petition" ? "게시글" : "댓글"} onClose={() => setReportTarget(null)} onSubmit={(reasonType, reasonDetail) => reportTarget.type === "petition" ? p.onReport(reasonType, reasonDetail) : p.onReportComment(reportTarget.id, reasonType, reasonDetail)} /> : null}
    </View>
  );
}
