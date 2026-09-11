/* /_ds — DS 프리미티브의 모든 variant/size 를 라이트·다크 두 열로 늘어놓은 확인 페이지.
   제품 화면이 아니다. 다크 열은 data-theme="dark" 로 시맨틱 토큰만 갈아끼운다(index.css). */

import { useState } from "react";
import {
  ActionMenu,
  Avatar,
  Badge,
  Button,
  CATEGORIES,
  Card,
  CategoryTag,
  EmpathyButton,
  ICON_NAMES,
  Icon,
  IconButton,
  Input,
  PetitionCard,
  Select,
  StatusBadge,
  Textarea,
  ThresholdBar,
} from "../components/ui";

const CATS = Object.keys(CATEGORIES);
const STATUSES = ["received", "reviewing", "answered", "expired"];
const TONES = ["neutral", "success", "warning", "danger"];

function Section({ title, note, children }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: 6 }}>
        <h2 style={{ margin: 0, font: "var(--text-h3)", color: "var(--text-strong)" }}>{title}</h2>
        {note && <p style={{ margin: "2px 0 0", font: "var(--text-caption-role)", color: "var(--text-muted)" }}>{note}</p>}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>{children}</div>
    </section>
  );
}

function Row({ children }) {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 10, width: "100%", alignItems: "center" }}>{children}</div>;
}

/** 한 테마 열. 상태(입력값·요청 토글)는 열마다 따로 가진다. 입력칸 id 는 라벨에서 파생되므로
    두 열이 겹치지 않게 theme 을 앞에 붙인다. */
function Gallery({ theme }) {
  const id = (name) => `${theme}-${name}`;
  const [text, setText] = useState("");
  const [area, setArea] = useState("");
  const [cat, setCat] = useState("");
  const [voted, setVoted] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <Section title="Button" note="sm 36 / md 44 / lg 52px · primary · outline · ghost · danger · 비활성은 중립 회색 면">
        {["sm", "md", "lg"].map((size) => (
          <Row key={size}>
            {["primary", "outline", "ghost", "danger"].map((variant) => (
              <Button key={variant} size={size} variant={variant}>
                {variant}
              </Button>
            ))}
            <Button size={size} disabled>
              disabled
            </Button>
          </Row>
        ))}
        <Row>
          <Button leadingIcon={<Icon name="plus" size={16} />}>건의 등록</Button>
          <Button block>block</Button>
        </Row>
      </Section>

      <Section title="IconButton" note="outline · ghost · solid(켜진 토글)">
        {["outline", "ghost", "solid"].map((variant) => (
          <IconButton key={variant} variant={variant} ariaLabel={variant}>
            <Icon name="bookmark" size={19} />
          </IconButton>
        ))}
        <IconButton ariaLabel="disabled" disabled>
          <Icon name="x" size={18} />
        </IconButton>
        <ActionMenu label="메뉴" onReport={() => {}} onBlock={() => {}} />
      </Section>

      <Section title="Badge" note="neutral · success · warning · danger × sm/md">
        {TONES.map((tone) => (
          <span key={tone} style={{ display: "inline-flex", gap: 6 }}>
            <Badge tone={tone} size="sm">
              {tone}
            </Badge>
            <Badge tone={tone}>{tone}</Badge>
          </span>
        ))}
      </Section>

      <Section title="Avatar" note="관리자 콘솔 사이드바·헤더 메뉴용">
        {[34, 44].map((size) => (
          <Avatar key={size} name="관리" size={size} />
        ))}
        <Avatar size={44} />
      </Section>

      <Section title="Input · Select · Textarea" note="입력 글자 16px(iOS 확대 방지) · focus 시 --focus-border + --focus-ring">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, width: "100%" }}>
          <Input id={id("in-basic")} label="기본" placeholder="입력하세요" value={text} onChange={(e) => setText(e.target.value)} />
          <Input id={id("in-hint")} label="hint" hint="도움말이 여기 나옵니다" placeholder="입력하세요" />
          <Input id={id("in-error")} label="error" error="오류 문구" placeholder="입력하세요" />
          <Input id={id("in-prefix")} label="prefix" prefix={<Icon name="user" size={16} />} placeholder="아이디" />
          <Select id={id("sel")} label="Select" value={cat} onChange={(e) => setCat(e.target.value)} options={CATS.map((k) => ({ value: k, label: CATEGORIES[k].label }))} placeholder="카테고리를 선택하세요" hint="hint 문구" />
          <Textarea id={id("ta")} label="Textarea" maxLength={1000} value={area} onChange={(e) => setArea(e.target.value)} placeholder="내용을 적어 주세요" />
        </div>
      </Section>

      <Section title="CategoryTag · StatusBadge" note="글자만. 상태는 글자색 하나로 구분">
        <Row>
          {CATS.map((c) => (
            <CategoryTag key={c} category={c} />
          ))}
        </Row>
        <Row>
          {STATUSES.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </Row>
      </Section>

      <Section title="EmpathyButton" note="요청 전 outline · 요청 후 primary 채움 + 체크">
        {["sm", "md", "lg"].map((size) => (
          <span key={size} style={{ display: "inline-flex", gap: 10 }}>
            <EmpathyButton size={size} count={1842} />
            <EmpathyButton size={size} count={1843} active />
          </span>
        ))}
        <EmpathyButton block size="lg" count={512} active={voted} onToggle={() => setVoted((v) => !v)} />
      </Section>

      <Section title="ThresholdBar" note="막대 없이 숫자 + 남은 인원 · lg 는 상세용 두 줄">
        <div style={{ display: "flex", flexDirection: "column", gap: 18, width: "100%" }}>
          <ThresholdBar size="lg" current={16} threshold={40} basisLabel="전체 학생" />
          <ThresholdBar size="lg" current={512} threshold={480} basisLabel="전체 학생" />
          <ThresholdBar current={88} threshold={180} basisLabel="학과 정원" />
          <ThresholdBar current={243} threshold={240} basisLabel="기숙사 정원" />
        </div>
      </Section>

      <Section title="Card · PetitionCard" note="카드는 테두리만. PetitionCard 는 피드 화면을 옮길 때 목록 행으로 바뀐다">
        <Card style={{ width: "100%" }}>기본 Card</Card>
        <PetitionCard
          style={{ width: "100%" }}
          title="중앙도서관 시험기간 24시간 개방 요청"
          excerpt="시험기간만이라도 열람실을 24시간 운영해 주세요. 밤 12시에 문을 닫으면 자리 경쟁이 너무 심합니다."
          category="library"
          status="reviewing"
          current={512}
          threshold={480}
          basisLabel="전체 학생"
          date="2일 전"
          comments={47}
          voted
          onClick={() => {}}
        />
      </Section>
    </div>
  );
}

export default function DsGallery() {
  const column = { padding: "28px 24px 80px", minWidth: 0, background: "var(--surface-page)", color: "var(--text-body)" };
  return (
    <div>
      <header style={{ padding: "28px 24px 0", maxWidth: 1440, margin: "0 auto" }}>
        <h1 style={{ margin: 0, font: "var(--text-h2)", color: "var(--text-strong)" }}>DS 프리미티브</h1>
        <p style={{ margin: "6px 0 0", font: "var(--text-caption-role)", color: "var(--text-muted)" }}>왼쪽 라이트, 오른쪽 다크. 제품 라우트가 아니다.</p>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 520px), 1fr))", maxWidth: 1440, margin: "0 auto" }}>
        <div style={column}>
          <Gallery theme="light" />
        </div>
        <div data-theme="dark" style={column}>
          <Gallery theme="dark" />
        </div>
      </div>
      <section style={{ maxWidth: 1440, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ font: "var(--text-h3)", color: "var(--text-strong)" }}>{`Icon (${ICON_NAMES.length}종)`}</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {ICON_NAMES.map((name) => (
            <span key={name} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4, width: 92, color: "var(--text-body)" }}>
              <Icon name={name} size={22} />
              <span style={{ font: "var(--text-caption-role)", color: "var(--text-muted)" }}>{name}</span>
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
