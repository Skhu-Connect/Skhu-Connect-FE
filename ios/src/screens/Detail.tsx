import { useState } from "react";
import { KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../icons";
import { BASIS_NOTE, CAT_LABEL, type Comment, type Petition } from "../data";
import { count, ddayLabel, ymd } from "../logic";
import type { Votes } from "../logic";
import { ActionMenu, Avatar, Button, Card, CategoryTag, EmpathyButton, StatusBadge, ThresholdBar } from "../ui";
import { colors, font, gradient, radius } from "../theme";
import type { ReportReasonType } from "../api";
import { ReportSheet } from "../reportSheet";

const t = { fontFamily: font };
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
  onToggleCommentLike: (commentId: number) => void;
  onEditComment: (commentId: number, body: string) => Promise<void>;
  onAddReply: (parentId: number, body: string) => Promise<void>;
  onDeleteComment: (commentId: number) => void;
  onBlockPetition: (petitionId: number) => void;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  /** 공유 링크로 들어와 아직 공감하지 않은 상태에서만 뜬다. */
  deepPrompt: boolean;
};


/* 웹 DetailScreen 의 CommentRow 와 같은 짝이다. 수정 상태를 행마다 따로 들어야 해서
   map 안에 인라인으로 두지 않고 컴포넌트로 뺀다. */
function CommentRow({
  cm,
  reply,
  onToggleLike,
  onEdit,
  onDelete,
  onReport,
  onBlock,
}: {
  cm: Comment;
  /** 대댓글이면 원댓글 본문 시작선(아바타 32 + gap 11)에 맞춰 들여쓴다 — 웹 CommentRow 와 같은 근거. */
  reply?: boolean;
  onToggleLike: (id: number) => void;
  onEdit: (id: number, body: string) => Promise<void>;
  onDelete: (id: number) => void;
  onReport: (id: number) => void;
  onBlock: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(cm.body);

  const save = async () => {
    const next = text.trim();
    // 안 바뀌었으면 요청을 보내지 않는다 — 서버 왕복도, 실패 토스트 가능성도 없앤다.
    if (!next || next === cm.body) return setEditing(false);
    await onEdit(cm.id!, next);
    setEditing(false);
  };

  return (
    <View style={{ flexDirection: "row", gap: 11, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.subtle, marginLeft: reply ? 43 : 0 }}>
      <Avatar name="익" size={reply ? 26 : 32} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <Text style={[t, { fontWeight: "700", fontSize: 12.5, color: colors.strong }]}>{cm.author}</Text>
          <Text style={[t, { fontSize: 11.5, color: colors.muted }]}>{cm.date}</Text>
          {/* 내 댓글은 수정·삭제, 남의 댓글은 신고·차단. 웹 CommentRow 와 같은 갈림이다. */}
          {cm.id != null && cm.mine && !editing ? (
            <View style={{ marginLeft: "auto", flexDirection: "row", gap: 12 }}>
              <Pressable onPress={() => { setText(cm.body); setEditing(true); }} accessibilityRole="button" hitSlop={8}>
                <Text style={[t, { fontSize: 12, fontWeight: "600", color: colors.muted }]}>수정</Text>
              </Pressable>
              <Pressable onPress={() => onDelete(cm.id!)} accessibilityRole="button" hitSlop={8}>
                <Text style={[t, { fontSize: 12, fontWeight: "600", color: colors.muted }]}>삭제</Text>
              </Pressable>
            </View>
          ) : null}
          {/* 자기 신고는 무의미하고, 본인 차단은 서버가 400 으로 막는다. 신고·차단을 줄에 펼치지 않고
              ⋮ 뒤에 넣는다 — 공감까지 셋이 나란히 붙으면 줄이 복잡하다. */}
          {cm.id != null && !cm.mine && !editing ? (
            <ActionMenu
              label="댓글 메뉴"
              size={16}
              style={{ width: 24, height: 24 }}
              onReport={() => onReport(cm.id!)}
              onBlock={() => onBlock(cm.id!)}
            />
          ) : null}
        </View>
        {editing ? (
          <View style={{ gap: 8, marginTop: 6 }}>
            <TextInput
              autoFocus
              value={text}
              onChangeText={setText}
              multiline
              accessibilityLabel="댓글 수정"
              style={[t, { borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.md, paddingVertical: 9, paddingHorizontal: 13, fontSize: 13.5, color: colors.strong }]}
            />
            <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}>
              <Button variant="outline" size="sm" onPress={() => setEditing(false)}>취소</Button>
              <Button variant="primary" size="sm" disabled={!text.trim()} onPress={save}>저장</Button>
            </View>
          </View>
        ) : (
          <Text style={[t, { fontSize: 13.5, color: colors.body, lineHeight: 22.3, marginTop: 4 }]}>{cm.body}</Text>
        )}
      </View>
      {/* 웹 CommentRow 의 하트 버튼과 같은 자리(행 오른쪽)·같은 형태(아이콘 위, 숫자 아래). */}
      {cm.id != null && !editing ? (
        <Pressable
          onPress={() => onToggleLike(cm.id!)}
          accessibilityRole="button"
          accessibilityLabel={`댓글 공감 ${cm.votes}`}
          accessibilityState={{ selected: cm.liked }}
          hitSlop={8}
          style={{ alignItems: "center", gap: 2, paddingLeft: 4 }}
        >
          <Icon name={cm.liked ? "heartSolid" : "heart"} size={16} color={cm.liked ? colors.coral[500] : colors.muted} />
          <Text style={[t, { fontSize: 12, fontWeight: "700", color: cm.liked ? colors.coral[500] : colors.muted }]}>{cm.votes}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function DetailScreen(p: DetailProps) {
  const insets = useSafeAreaInsets();
  const d = p.petition;
  const c = count(d, p.votes);
  const reached = c >= d.threshold;
  const answered = d.status === "answered";
  const [reportTarget, setReportTarget] = useState<{ type: "petition" } | { type: "comment"; id: number } | null>(null);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  // 서버 목록 응답에 총계가 없어 트리를 직접 센다(웹 CommentsSection 과 같은 방식).
  const commentTotal = p.comments.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0);

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
        {/* 신고·차단을 ⋮ 하나로 모은다 — 피드 카드·댓글과 같은 형태다. 내 글엔 안 띄운다. */}
        {!d.mine ? (
          <ActionMenu
            label="게시글 메뉴"
            size={19}
            style={{ width: 36, height: 36 }}
            onReport={() => setReportTarget({ type: "petition" })}
            onBlock={() => p.onBlockPetition(d.id)}
          />
        ) : (
          <View className="ml-auto" />
        )}
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
              <Text style={[t, { fontSize: 13, fontWeight: "800", color: colors.strong, marginBottom: 6 }]}>댓글 {commentTotal}</Text>
              {p.comments.map((cm, i) => (
                <View key={cm.id ?? `${cm.author}-${i}`}>
                  <CommentRow
                    cm={cm}
                    onToggleLike={p.onToggleCommentLike}
                    onEdit={p.onEditComment}
                    onDelete={p.onDeleteComment}
                    onReport={(id) => setReportTarget({ type: "comment", id })}
                    onBlock={p.onBlockComment}
                  />
                  {cm.id != null ? (
                    <Pressable
                      onPress={() => { setReplyTo(replyTo === cm.id ? null : cm.id!); setReplyText(""); }}
                      accessibilityRole="button"
                      hitSlop={8}
                      style={{ marginLeft: 43, paddingVertical: 6 }}
                    >
                      <Text style={[t, { fontSize: 12, fontWeight: "600", color: colors.muted }]}>답글달기</Text>
                    </Pressable>
                  ) : null}
                  {(cm.replies ?? []).map((r) => (
                    <CommentRow
                      key={r.id}
                      cm={r}
                      reply
                      onToggleLike={p.onToggleCommentLike}
                      onEdit={p.onEditComment}
                      onDelete={p.onDeleteComment}
                      onReport={(id) => setReportTarget({ type: "comment", id })}
                      onBlock={p.onBlockComment}
                    />
                  ))}
                  {replyTo === cm.id ? (
                    <View style={{ flexDirection: "row", gap: 8, marginLeft: 43, paddingBottom: 10, alignItems: "center" }}>
                      <TextInput
                        autoFocus
                        value={replyText}
                        onChangeText={setReplyText}
                        placeholder="답글을 입력하세요"
                        placeholderTextColor={colors.muted}
                        accessibilityLabel="답글 입력"
                        style={[t, { flex: 1, borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: 14, fontSize: 13.5, color: colors.strong }]}
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!replyText.trim()}
                        onPress={async () => {
                          await p.onAddReply(cm.id!, replyText.trim());
                          setReplyTo(null);
                          setReplyText("");
                        }}
                      >
                        등록
                      </Button>
                    </View>
                  ) : null}
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
