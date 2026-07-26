/* /_ds — DS 프리미티브 14종의 모든 variant/size 를 늘어놓은 확인 페이지 (ROADMAP 0-5).
   제품 화면이 아니다. 원본 _ds_bundle.js 와 값 대조할 때 쓴다. */

import { useState } from "react";
import {
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
const STATUSES = ["received", "reviewing", "answered"];
const TONES = ["neutral", "indigo", "violet", "teal", "coral", "success", "warning", "danger"];

function Section({ title, note, children }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 6 }}>
        <h2 style={{ margin: 0, font: "var(--text-h2)", color: "var(--text-strong)" }}>{title}</h2>
        {note && <span style={{ font: "var(--text-caption-role)", color: "var(--text-muted)" }}>{note}</span>}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>{children}</div>
    </section>
  );
}

function Label({ children }) {
  return <span style={{ font: "var(--text-caption-role)", color: "var(--text-muted)", width: "100%" }}>{children}</span>;
}

export default function DsGallery() {
  const [text, setText] = useState("");
  const [area, setArea] = useState("");
  const [cat, setCat] = useState("");
  const [voted, setVoted] = useState(false);

  return (
    <div style={{ maxWidth: "var(--page-max)", margin: "0 auto", padding: "32px var(--page-gutter) 120px", display: "flex", flexDirection: "column", gap: 34 }}>
      <header>
        <h1 style={{ margin: 0, font: "var(--text-title)", color: "var(--text-strong)" }}>DS 프리미티브 14종</h1>
        <p style={{ margin: "6px 0 0", color: "var(--text-muted)" }}>_ds_bundle.js 1–1017행 이식 확인용. 제품 라우트가 아니다.</p>
      </header>

      <Section title="Button" note="sm 36 / md 44 / lg 52px · 6 variants · hover brightness(.94) · press scale(.98)">
        {["sm", "md", "lg"].map((size) => (
          <div key={size} style={{ display: "flex", flexWrap: "wrap", gap: 10, width: "100%", alignItems: "center" }}>
            <Label>size={size}</Label>
            {["primary", "secondary", "outline", "ghost", "danger", "gradient"].map((variant) => (
              <Button key={variant} size={size} variant={variant}>
                {variant}
              </Button>
            ))}
            <Button size={size} disabled>
              disabled
            </Button>
            <Button size={size} pill={false}>
              pill=false
            </Button>
            <Button size={size} leadingIcon={<Icon name="plus" size={16} />}>
              leadingIcon
            </Button>
          </div>
        ))}
        <Button block>block</Button>
      </Section>

      <Section title="IconButton" note="5 variants · size 로 원 지름 지정">
        {["outline", "solid", "ghost", "onDark", "soft"].map((variant) => (
          <span key={variant} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: variant === "onDark" ? "var(--navy-900)" : "transparent", padding: 6, borderRadius: 10 }}>
            <IconButton variant={variant} ariaLabel={variant}>
              <Icon name="bell" size={20} />
            </IconButton>
            <span style={{ font: "var(--text-caption-role)", color: variant === "onDark" ? "#fff" : "var(--text-muted)" }}>{variant}</span>
          </span>
        ))}
        <IconButton ariaLabel="52px" size={52}>
          <Icon name="bookmark" size={20} />
        </IconButton>
        <IconButton ariaLabel="disabled" disabled>
          <Icon name="x" size={18} />
        </IconButton>
      </Section>

      <Section title="Badge" note="8 tones × solid/soft × sm/md">
        {TONES.map((tone) => (
          <span key={tone} style={{ display: "inline-flex", gap: 6 }}>
            <Badge tone={tone} size="sm">
              {tone} sm
            </Badge>
            <Badge tone={tone}>{tone}</Badge>
            <Badge tone={tone} solid>
              solid
            </Badge>
          </span>
        ))}
      </Section>

      <Section title="Avatar" note="fontSize = size × 0.4 · ring 시 0 0 0 3px #fff, 0 0 0 5px --indigo-200">
        {[34, 38, 44, 52].map((size) => (
          <Avatar key={size} name="석환" size={size} />
        ))}
        <Avatar name="관리" size={44} ring />
      </Section>

      <Section title="Card" note="padding 기본 --pad-card · hoverable 시 translateY(-2px) + --shadow-md">
        <Card style={{ width: 260 }}>기본 Card</Card>
        <Card hoverable style={{ width: 260 }}>
          hoverable — 마우스를 올려 보세요
        </Card>
        <Card padding="var(--pad-card-lg)" style={{ width: 260 }}>
          padding=--pad-card-lg
        </Card>
        <Card as="section" style={{ width: 260 }}>
          as=&quot;section&quot;
        </Card>
      </Section>

      <Section title="Input · Select · Textarea" note="focus 시 --indigo-400 테두리 + 0 0 0 3px var(--focus-ring)">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, width: "100%" }}>
          <Input label="기본" placeholder="입력하세요" value={text} onChange={(e) => setText(e.target.value)} />
          <Input label="hint" hint="도움말이 여기 나옵니다" placeholder="입력하세요" />
          <Input label="error" error="오류 문구" placeholder="입력하세요" />
          <Input label="prefix/suffix" prefix={<Icon name="user" size={16} />} suffix={<Icon name="check" size={16} />} placeholder="입력하세요" />
          <Select label="Select" value={cat} onChange={(e) => setCat(e.target.value)} options={CATS.map((k) => ({ value: k, label: CATEGORIES[k].label }))} placeholder="카테고리를 선택하세요" hint="hint 문구" />
          <Textarea label="Textarea" maxLength={1000} value={area} onChange={(e) => setArea(e.target.value)} placeholder="내용을 적어 주세요" />
          <Textarea label="Textarea error" error="본문을 입력해 주세요" value="" onChange={() => {}} />
        </div>
      </Section>

      <Section title="CategoryTag" note="soft 배경 = color-mix(in srgb, <색> 14%, #fff)">
        {["soft", "solid", "outline"].map((variant) => (
          <div key={variant} style={{ display: "flex", gap: 8, width: "100%", alignItems: "center", flexWrap: "wrap" }}>
            <Label>variant={variant}</Label>
            {CATS.map((c) => (
              <CategoryTag key={c} category={c} variant={variant} />
            ))}
            {CATS.map((c) => (
              <CategoryTag key={`${c}-sm`} category={c} variant={variant} size="sm" />
            ))}
          </div>
        ))}
      </Section>

      <Section title="StatusBadge" note="접수 → 검토중 → 답변 완료">
        {STATUSES.map((s) => (
          <span key={s} style={{ display: "inline-flex", gap: 6 }}>
            <StatusBadge status={s} size="sm" />
            <StatusBadge status={s} />
          </span>
        ))}
      </Section>

      <Section title="EmpathyButton" note="press scale(.95) · active 시 --gradient-mileage + --shadow-magenta">
        {["sm", "md", "lg"].map((size) => (
          <span key={size} style={{ display: "inline-flex", gap: 10 }}>
            <EmpathyButton size={size} count={1842} />
            <EmpathyButton size={size} count={1843} active />
          </span>
        ))}
        <EmpathyButton block size="lg" count={512} active={voted} onToggle={() => setVoted((v) => !v)} />
      </Section>

      <Section title="ThresholdBar" note="sm 6 / md 9 / lg 12px · width .5s cubic-bezier(.4,0,.2,1)">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18, width: "100%" }}>
          <ThresholdBar size="sm" current={88} threshold={180} basisLabel="학과 정원" />
          <ThresholdBar size="md" current={154} threshold={480} basisLabel="전체 학생" />
          <ThresholdBar size="lg" current={512} threshold={480} basisLabel="전체 학생" />
          <ThresholdBar current={243} threshold={240} basisLabel="기숙사 정원" />
          <ThresholdBar current={96} threshold={480} basisLabel="전체 학생" showMeta={false} />
        </div>
      </Section>

      <Section title="PetitionCard" note="CategoryTag + StatusBadge + ThresholdBar + EmpathyButton 조합">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 18, width: "100%" }}>
          <PetitionCard
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
          <PetitionCard
            title="소프트웨어융합학부 실습실 야간 개방"
            excerpt="팀 프로젝트 기간에 실습실을 밤 10시까지 열어 주세요."
            category="department"
            status="received"
            current={88}
            threshold={180}
            basisLabel="학과 정원"
            date="6시간 전"
            comments={12}
          />
          <PetitionCard title="교내 장학금 신청 절차 간소화" excerpt="매 학기 동일 서류를 반복 제출합니다." category="scholarship" status="answered" current={631} threshold={480} basisLabel="전체 학생" date="2주 전" comments={58} />
        </div>
      </Section>

      <Section title={`Icon (${ICON_NAMES.length}종)`} note="viewBox 0 0 24 24 · strokeWidth 2 · round cap/join">
        {ICON_NAMES.map((name) => (
          <span key={name} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4, width: 92, color: "var(--text-body)" }}>
            <Icon name={name} size={22} />
            <span style={{ font: "var(--text-caption-role)", color: "var(--text-muted)" }}>{name}</span>
          </span>
        ))}
        <span style={{ font: "var(--text-caption-role)", color: "var(--text-muted)", width: "100%" }}>없는 이름(nope) → 렌더 없음: [<Icon name="nope" />]</span>
      </Section>
    </div>
  );
}
