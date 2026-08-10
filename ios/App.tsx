import "./global.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Linking, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Clipboard from "expo-clipboard";

import type { CategoryKey, Comment, MyComment, Notification, Petition, PrefKey } from "./src/data";
import { visibleList, type Sort, type Tab, type Votes } from "./src/logic";
import { FeedScreen } from "./src/screens/Feed";
import { DetailScreen } from "./src/screens/Detail";
import { LoginScreen } from "./src/screens/Login";
import { SignupScreen } from "./src/screens/Signup";
import { MyScreen } from "./src/screens/My";
import { SubmitScreen, categoryOf } from "./src/screens/Submit";
import { ShareSheet, TabBar, Toast } from "./src/shell";
import { colors } from "./src/theme";
import * as api from "./src/api";
import type { Me } from "./src/api";
import * as push from "./src/push";

type Screen = "feed" | "detail" | "submit" | "my";

/* 공유 링크는 학생이 에타에 붙여넣는 https 주소지만, 앱이 받는 건 커스텀 스킴이다.
   (https 로 바로 받으려면 서버에 apple-app-site-association 이 있어야 한다 — 범위 밖.) */
const SHARE_HOST = "cheongwon.skhu.ac.kr";

function petitionIdFromUrl(url: string | null): number | null {
  if (!url) return null;
  const m = url.match(/\/p\/(\d+)/);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [authScreen, setAuthScreen] = useState<"login" | "signup">("login");
  const [screen, setScreen] = useState<Screen>("feed");
  const [tab, setTab] = useState<Tab>("home");

  const [me, setMe] = useState<Me | null>(null);
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [myComments, setMyComments] = useState<MyComment[]>([]);
  const [votes, setVotes] = useState<Votes>({});
  const [openId, setOpenId] = useState<number | null>(null);

  const [category, setCategory] = useState<CategoryKey | "all">("all");
  const [sort, setSort] = useState<Sort>("hot");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const [draft, setDraft] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");

  const [formCat, setFormCat] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");

  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>({ threshold: true, answer: true, empathy: false });

  /* 공유 링크로 들어왔는지. 들어왔고 아직 공감을 안 눌렀으면 상세 상단에 안내가 뜬다. */
  const [deepId, setDeepId] = useState<number | null>(null);
  const [deepUsed, setDeepUsed] = useState(false);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(""), 1900);
  }, []);
  useEffect(() => () => void (toastTimer.current && clearTimeout(toastTimer.current)), []);

  /* 로그인/회원가입 직후, 그리고 콜드 스타트 세션 복구 성공 시 공통으로 부른다.
     votes 는 로컬 오버레이다 — Petition.current 는 api.ts 에서 이미 "나를 뺀 공감 수" 로
     저장돼 있으므로, 여기서 voted 집합을 true 로 심어야 logic.ts 의 count() 가 원래 총합을
     복원한다(mock 시절 SEED.current 가 "나를 제외한 공감 수" 였던 것과 같은 자리). */
  /** 실패하면 던진다 — 호출부가 authed 로 넘어가지 않고 재시도 경로(로그인 화면)를 유지한다. */
  const bootstrap = useCallback(async () => {
    const [meVal, ps, notifs] = await Promise.all([api.getMe(), api.listPetitions(), api.listNotifications()]);
    setMe(meVal);
    setPetitions(ps);
    setNotifications(notifs);
    setVotes(Object.fromEntries([...api.getVotedIds()].map((id) => [id, true])));
    push.registerForPush().catch(() => {}); // 부가 기능 — 실패해도 로그인 흐름을 막지 않는다
  }, []);

  /* 콜드 스타트: accessToken 은 메모리 전용이라 앱을 껐다 켜면 사라진다. refreshToken
     쿠키로 세션 복구를 시도하고, 되면 바로 인증 상태로 진입한다. 복구는 됐는데 목록 로딩이
     실패하면(네트워크 등) 빈 화면으로 authed 진입시키지 않고 로그인 화면에 남긴다 —
     로그인 화면에서 다시 시도할 수 있다. */
  useEffect(() => {
    api.restoreSession().then(async (meVal) => {
      if (meVal) {
        try {
          await bootstrap();
          setAuthed(true);
        } catch {
          flash("정보를 불러오지 못했습니다. 다시 로그인해 주세요.");
        }
      }
      setBooting(false);
    });
  }, [bootstrap, flash]);

  /* 딥링크: 콜드 스타트와 실행 중 수신 둘 다 받는다. */
  useEffect(() => {
    const arrive = (url: string | null) => {
      const id = petitionIdFromUrl(url);
      if (id == null) return;
      setDeepId(id);
      setDeepUsed(false);
      setOpenId(id);
      setAuthed((was) => {
        if (was) setScreen("detail");
        return was;
      });
    };
    Linking.getInitialURL().then(arrive);
    const sub = Linking.addEventListener("url", (e) => arrive(e.url));
    return () => sub.remove();
  }, []);

  /* 상세 화면 진입 시 그 청원의 댓글을 불러온다 — 목록 응답엔 댓글 본문이 없다. */
  useEffect(() => {
    if (screen !== "detail" || openId == null) return;
    let cancelled = false;
    api
      .listComments(openId)
      .then((cs) => {
        if (!cancelled) setComments((all) => ({ ...all, [openId]: cs }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [screen, openId]);

  /* MY 화면을 열 때마다 알림·내가 쓴 댓글을 다시 불러온다 — 로그인 시 한 번만 받으면 그 사이에
     다른 사용자의 공감·댓글로 새로 생긴 알림을 놓친다(탭바 벨 배지·피드 헤더 벨 점도 이 값을 쓴다). */
  useEffect(() => {
    if (screen !== "my") return;
    api.listNotifications().then(setNotifications).catch(() => {});
    api.listMyComments().then(setMyComments).catch(() => {});
  }, [screen]);

  /* 웹 WebLayout.jsx 와 같은 방식 — 진짜 푸시가 아니라 로그인 중 30초마다 목록을 다시
     불러와 벨 배지가 실시간처럼 보이게 한다. 실패는 조용히 넘기고 다음 주기에 재시도한다. */
  useEffect(() => {
    if (!authed) return;
    const id = setInterval(() => {
      api.listNotifications().then(setNotifications).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [authed]);

  /* 앱이 열려 있는 동안 FCM 이 오면(시스템 배너 없음) 알림 목록을 바로 갱신하고 토스트로 알린다. */
  useEffect(() => {
    if (!authed) return;
    return push.onForegroundMessage(() => {
      api.listNotifications().then(setNotifications).catch(() => {});
      flash("새 알림이 도착했습니다");
    });
  }, [authed, flash]);

  /* 푸시 알림을 탭해서 열린 경우 — URL 딥링크와 같은 경로(deepId/openId)를 탄다.
     킬 상태 콜드 스타트와 백그라운드 탭 둘 다 여기로 모인다. */
  useEffect(() => {
    const arrive = (petitionId: number | null) => {
      if (petitionId == null) return;
      setDeepId(petitionId);
      setDeepUsed(false);
      setOpenId(petitionId);
      setAuthed((was) => {
        if (was) setScreen("detail");
        return was;
      });
    };
    push.getTappedNotificationPetitionId().then(arrive).catch(() => {});
    return push.onNotificationTapped(arrive);
  }, []);

  const detail = useMemo(() => petitions.find((p) => p.id === openId), [petitions, openId]);
  const deepPetition = useMemo(() => (deepId == null ? null : (petitions.find((p) => p.id === deepId) ?? null)), [petitions, deepId]);

  /* 목록에 없는 청원을 연 상태(만료된 딥링크, 최근 100건 밖의 청원)로 남으면 빈 화면에
     갇힌다 — 상세 화면엔 탭바도 없어 빠져나올 길이 없다. 피드로 되돌린다. */
  useEffect(() => {
    if (authed && screen === "detail" && !detail) {
      setScreen("feed");
      flash("건의를 찾을 수 없습니다.");
    }
  }, [authed, screen, detail, flash]);

  const list = useMemo(() => visibleList(petitions, { tab, category, query, sort }, votes), [petitions, tab, category, query, sort, votes]);
  const mineCount = useMemo(() => petitions.filter((p) => p.mine).length, [petitions]);
  const bookmarkedList = useMemo(() => petitions.filter((p) => p.bookmarked), [petitions]);
  const hasUnread = useMemo(() => notifications.some((n) => !n.read), [notifications]);
  /* MyScreen 의 answeredCount(내 건의 중 답변받은 것)와 다르다 — 이건 전체 답변 완료 건수다. */
  const totalAnsweredCount = useMemo(() => petitions.filter((p) => p.status === "answered").length, [petitions]);

  const doVote = useCallback(
    (id: number, wasVoted: boolean) => {
      setVotes((v) => ({ ...v, [id]: !wasVoted }));
      if (!wasVoted) setDeepUsed(true);
      flash(!wasVoted ? "공감했습니다" : "공감을 취소했습니다");
      api.toggleEmpathy(id, wasVoted).catch(() => {
        setVotes((v) => ({ ...v, [id]: wasVoted }));
        flash("공감 처리에 실패했습니다");
      });
    },
    [flash],
  );

  /* 취소(voted=true → false)만 확인을 받는다 — 공감을 누르는 쪽은 확인 없이 바로 처리한다. */
  const vote = useCallback(
    (id: number) => {
      const wasVoted = !!votes[id];
      if (!wasVoted) {
        doVote(id, wasVoted);
        return;
      }
      Alert.alert("공감을 취소할까요?", undefined, [
        { text: "취소", style: "cancel" },
        { text: "확인", onPress: () => doVote(id, wasVoted) },
      ]);
    },
    [votes, doVote],
  );

  const toggleBookmark = useCallback(
    (id: number) => {
      const wasBookmarked = !!petitions.find((p) => p.id === id)?.bookmarked;
      setPetitions((prev) => prev.map((p) => (p.id === id ? { ...p, bookmarked: !wasBookmarked } : p)));
      flash(wasBookmarked ? "북마크를 해제했습니다" : "북마크에 저장했습니다");
      api.toggleBookmark(id, wasBookmarked).catch(() => {
        setPetitions((prev) => prev.map((p) => (p.id === id ? { ...p, bookmarked: wasBookmarked } : p)));
        flash("북마크 처리에 실패했습니다");
      });
    },
    [petitions, flash],
  );

  const openPetition = useCallback((id: number) => {
    setOpenId(id);
    setScreen("detail");
  }, []);

  const onOpenNotification = useCallback(
    (n: Notification) => {
      if (!n.read) {
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
        api.markNotifRead(n.id).catch(() => {});
      }
      openPetition(n.petitionId);
    },
    [openPetition],
  );

  const onMarkAllNotifRead = useCallback(() => {
    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
    api.markAllNotifRead().catch(() => {});
  }, []);

  const addComment = useCallback(() => {
    const text = draft.trim();
    if (!text || openId == null) return;
    api
      .addComment(openId, text)
      .then((c) => {
        setDraft(""); // 성공한 뒤에만 지운다 — 실패하면 입력한 내용이 남아 있어야 한다.
        setComments((all) => ({ ...all, [openId]: [...(all[openId] ?? []), c] }));
        setPetitions((prev) => prev.map((p) => (p.id === openId ? { ...p, comments: p.comments + 1 } : p)));
        flash("댓글을 익명으로 등록했습니다");
      })
      .catch((e) => flash(e instanceof Error ? e.message : "댓글 등록에 실패했습니다"));
  }, [draft, openId, flash]);

  const submitPetition = useCallback(() => {
    const key = categoryOf(formCat);
    const title = formTitle.trim();
    if (!key || !title) return;
    api
      .createPetition({ category: key, title, body: formBody })
      .then((created) => {
        setPetitions((prev) => [created, ...prev]);
        setOpenId(created.id);
        setScreen("detail");
        setShareOpen(true);
        setCopied(false);
        setFormCat("");
        setFormTitle("");
        setFormBody("");
        flash("건의가 익명으로 등록되었습니다");
      })
      .catch((e) => flash(e instanceof Error ? e.message : "건의 등록에 실패했습니다"));
  }, [formCat, formTitle, formBody, flash]);

  const shareUrl = `${SHARE_HOST}/p/${detail?.id ?? ""}`;
  const onCopy = useCallback(() => {
    Clipboard.setStringAsync(`https://${shareUrl}`);
    setCopied(true);
    flash("링크를 복사했습니다");
  }, [shareUrl, flash]);

  const onLogin = useCallback(async () => {
    try {
      await bootstrap();
    } catch {
      flash("정보를 불러오지 못했습니다. 다시 시도해 주세요.");
      return;
    }
    setAuthed(true);
    if (deepId != null) {
      setOpenId(deepId);
      setScreen("detail");
    } else {
      setScreen("feed");
    }
  }, [bootstrap, deepId, flash]);

  const onLogout = useCallback(() => {
    api.logout();
    push.unregisterFromPush();
    setAuthed(false);
    setAuthScreen("login");
    setScreen("feed");
    setTab("home");
    setVotes({});
    setQuery("");
    setSearchOpen(false);
    setMe(null);
    setPetitions([]);
    setComments({});
    setNotifications([]);
    setMyComments([]);
  }, []);

  const onTab = useCallback((next: Tab) => {
    setTab(next);
    setScreen(next === "my" ? "my" : "feed");
  }, []);

  const showTabs = authed && screen !== "detail" && screen !== "submit";

  if (booting) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.page }}>
          <ActivityIndicator color={colors.indigo[600]} />
        </View>
      </SafeAreaProvider>
    );
  }

  if (!authed) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        {authScreen === "login" ? (
          <LoginScreen deepTitle={deepPetition?.title} onLogin={onLogin} onSignup={() => setAuthScreen("signup")} />
        ) : (
          <SignupScreen onBack={() => setAuthScreen("login")} onSignup={onLogin} />
        )}
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.card }}>
        <View style={{ flex: 1, backgroundColor: colors.page }}>
          {screen === "feed" ? (
            <FeedScreen
              petitions={petitions}
              votes={votes}
              filter={{ tab, category, query, sort }}
              list={list}
              mineCount={mineCount}
              answeredCount={totalAnsweredCount}
              hasUnread={hasUnread}
              searchOpen={searchOpen}
              onToggleSearch={() => {
                setSearchOpen((s) => !s);
                setQuery("");
              }}
              onQuery={setQuery}
              onCategory={setCategory}
              onSort={setSort}
              onOpen={openPetition}
              onVote={vote}
              onOpenMy={() => {
                setTab("my");
                setScreen("my");
              }}
            />
          ) : null}

          {screen === "detail" && detail ? (
            <DetailScreen
              petition={detail}
              votes={votes}
              comments={comments[detail.id] ?? []}
              draft={draft}
              onDraft={setDraft}
              onAddComment={addComment}
              onBack={() => setScreen(tab === "my" ? "my" : "feed")}
              onVote={() => vote(detail.id)}
              onOpenShare={() => {
                setShareOpen(true);
                setCopied(false);
              }}
              bookmarked={!!detail.bookmarked}
              onToggleBookmark={() => toggleBookmark(detail.id)}
              deepPrompt={deepId === detail.id && !deepUsed}
            />
          ) : null}

          {screen === "submit" ? (
            <SubmitScreen
              category={formCat}
              title={formTitle}
              body={formBody}
              onCategory={setFormCat}
              onTitle={setFormTitle}
              onBody={setFormBody}
              onSubmit={submitPetition}
              onBack={() => setScreen("feed")}
            />
          ) : null}

          {screen === "my" ? (
            <MyScreen
              me={me}
              mineCount={mineCount}
              voteCount={Object.values(votes).filter(Boolean).length}
              answeredCount={petitions.filter((p) => p.mine && p.status === "answered").length}
              notifications={notifications}
              bookmarks={bookmarkedList}
              myComments={myComments}
              prefs={prefs}
              onTogglePref={(k) => setPrefs((p) => ({ ...p, [k]: !p[k] }))}
              onOpenPetition={openPetition}
              onOpenNotification={onOpenNotification}
              onMarkAllNotifRead={onMarkAllNotifRead}
              onLogout={onLogout}
            />
          ) : null}

          <Toast message={toast} bottom={showTabs ? 88 : 100} />
        </View>

        {showTabs ? <TabBar tab={tab} screen={screen} onTab={onTab} onCompose={() => setScreen("submit")} /> : null}
      </SafeAreaView>

      <ShareSheet open={shareOpen} url={shareUrl} copied={copied} onCopy={onCopy} onClose={() => setShareOpen(false)} />
    </SafeAreaProvider>
  );
}
