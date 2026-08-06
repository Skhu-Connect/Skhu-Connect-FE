import "./global.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Linking, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Clipboard from "expo-clipboard";

import { NOTIFS, SEED, SEED_COMMENTS, type CategoryKey, type Comment, type Petition, type PrefKey } from "./src/data";
import { basisFor, thresholdFor, visibleList, type Sort, type Tab, type Votes } from "./src/logic";
import { FeedScreen } from "./src/screens/Feed";
import { DetailScreen } from "./src/screens/Detail";
import { LoginScreen } from "./src/screens/Login";
import { MyScreen } from "./src/screens/My";
import { SubmitScreen, categoryOf } from "./src/screens/Submit";
import { ShareSheet, TabBar, Toast } from "./src/shell";
import { colors } from "./src/theme";

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
  const [authed, setAuthed] = useState(false);
  const [screen, setScreen] = useState<Screen>("feed");
  const [tab, setTab] = useState<Tab>("home");

  const [petitions, setPetitions] = useState<Petition[]>(SEED);
  const [comments, setComments] = useState<Record<number, Comment[]>>(SEED_COMMENTS);
  const [votes, setVotes] = useState<Votes>({});
  const [openId, setOpenId] = useState(1);

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

  const detail = useMemo(() => petitions.find((p) => p.id === openId) ?? petitions[0], [petitions, openId]);
  const deepPetition = useMemo(() => (deepId == null ? null : (petitions.find((p) => p.id === deepId) ?? null)), [petitions, deepId]);

  const list = useMemo(() => visibleList(petitions, { tab, category, query, sort }, votes), [petitions, tab, category, query, sort, votes]);
  const mineCount = useMemo(() => petitions.filter((p) => p.mine).length, [petitions]);
  /* MyScreen 의 answeredCount(내 건의 중 답변받은 것)와 다르다 — 이건 전체 답변 완료 건수다. */
  const totalAnsweredCount = useMemo(() => petitions.filter((p) => p.status === "answered").length, [petitions]);

  const vote = useCallback(
    (id: number) => {
      setVotes((v) => {
        const on = !v[id];
        if (on) setDeepUsed(true);
        flash(on ? "공감했습니다" : "공감을 취소했습니다");
        return { ...v, [id]: on };
      });
    },
    [flash],
  );

  const openPetition = useCallback((id: number) => {
    setOpenId(id);
    setScreen("detail");
  }, []);

  const addComment = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    setComments((all) => {
      const prev = all[openId] ?? [];
      return { ...all, [openId]: [...prev, { author: `익명 ${prev.length + 1}`, body: text, date: "방금 전" }] };
    });
    setDraft("");
    flash("댓글을 익명으로 등록했습니다");
  }, [draft, openId, flash]);

  const submitPetition = useCallback(() => {
    const key = categoryOf(formCat);
    const title = formTitle.trim();
    if (!key || !title) return;

    const basis = basisFor(key);
    const text = formBody.trim() || "방금 등록된 건의입니다.";
    const id = Math.max(...petitions.map((p) => p.id)) + 1;
    const created: Petition = {
      id,
      title,
      excerpt: text,
      body: text,
      category: key,
      status: "received",
      current: 1,
      threshold: thresholdFor(basis),
      basis,
      author: "익명",
      createdAt: new Date().toISOString(),
      comments: 0,
      views: "1",
      mine: true,
    };

    setPetitions((prev) => [created, ...prev]);
    setOpenId(id);
    setScreen("detail");
    setShareOpen(true);
    setCopied(false);
    setFormCat("");
    setFormTitle("");
    setFormBody("");
    flash("건의가 익명으로 등록되었습니다");
  }, [formCat, formTitle, formBody, petitions, flash]);

  const shareUrl = `${SHARE_HOST}/p/${detail.id}`;
  const onCopy = useCallback(() => {
    Clipboard.setStringAsync(`https://${shareUrl}`);
    setCopied(true);
    flash("링크를 복사했습니다");
  }, [shareUrl, flash]);

  const onLogin = useCallback(() => {
    setAuthed(true);
    if (deepId != null) {
      setOpenId(deepId);
      setScreen("detail");
    } else {
      setScreen("feed");
    }
  }, [deepId]);

  const onLogout = useCallback(() => {
    setAuthed(false);
    setScreen("feed");
    setTab("home");
    setVotes({});
    setQuery("");
    setSearchOpen(false);
  }, []);

  const onTab = useCallback((next: Tab) => {
    setTab(next);
    setScreen(next === "my" ? "my" : "feed");
  }, []);

  const showTabs = authed && screen !== "detail" && screen !== "submit";

  if (!authed) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <LoginScreen deepTitle={deepPetition?.title} onLogin={onLogin} />
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
              hasUnread={NOTIFS.some((n) => !n.read)}
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

          {screen === "detail" ? (
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
              mineCount={mineCount}
              voteCount={Object.values(votes).filter(Boolean).length}
              answeredCount={petitions.filter((p) => p.mine && p.answered).length}
              prefs={prefs}
              onTogglePref={(k) => setPrefs((p) => ({ ...p, [k]: !p[k] }))}
              onOpenPetition={openPetition}
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
