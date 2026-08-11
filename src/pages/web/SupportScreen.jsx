import MobileShareHeader from "../../components/web/MobileShareHeader";

export const SUPPORT_EMAIL = "skhuconnect@gmail.com";

const INQUIRY_TOPICS = [
  "회원가입 및 로그인",
  "학교 이메일 인증",
  "건의 등록 및 수정",
  "공감 및 댓글",
  "알림",
  "기타 서비스 오류 및 문의",
];

export default function SupportScreen() {
  return (
    <>
      <title>성공잇다 고객지원</title>
      <meta name="description" content="성공잇다 서비스 이용 및 오류 관련 고객지원 안내" />

      <MobileShareHeader />
      <main style={{ width: "min(100% - 32px, 720px)", margin: "0 auto", padding: "clamp(48px, 9vw, 88px) 0 64px" }}>
        <section aria-labelledby="support-title">
          <span style={{ display: "inline-block", marginBottom: 14, color: "var(--indigo-600)", fontSize: 13, fontWeight: 700, letterSpacing: ".04em" }}>
            SUPPORT
          </span>
          <h1 id="support-title" style={{ margin: 0, color: "var(--text-strong)", fontSize: "clamp(30px, 6vw, 40px)", lineHeight: 1.2, letterSpacing: "var(--ls-tight)" }}>
            성공잇다 고객지원
          </h1>
          <p style={{ margin: "20px 0 0", color: "var(--text-body)", fontSize: 16, lineHeight: 1.75 }}>
            서비스 이용 중 문제가 발생하거나 문의사항이 있으신 경우 아래 연락처로 문의해 주세요.
          </p>
        </section>

        <section aria-labelledby="topics-title" style={{ marginTop: 40, padding: "clamp(24px, 5vw, 32px)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}>
          <h2 id="topics-title" style={{ margin: 0, color: "var(--text-strong)", font: "var(--text-h2)" }}>문의 가능 항목</h2>
          <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px 24px", margin: "24px 0 0", padding: 0, listStyle: "none" }}>
            {INQUIRY_TOPICS.map((topic) => (
              <li key={topic} style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-body)", fontSize: 14.5 }}>
                <span aria-hidden="true" style={{ width: 7, height: 7, flexShrink: 0, borderRadius: "var(--radius-full)", background: "var(--teal-500)" }} />
                {topic}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="email-title" style={{ marginTop: 20, padding: "clamp(24px, 5vw, 32px)", background: "var(--indigo-600)", borderRadius: "var(--radius-lg)", color: "var(--text-on-primary)" }}>
          <h2 id="email-title" style={{ margin: 0, fontSize: 14, fontWeight: 600, opacity: .8 }}>문의 이메일</h2>
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ display: "inline-block", marginTop: 10, color: "inherit", fontSize: "clamp(20px, 5vw, 26px)", fontWeight: 700, wordBreak: "break-all", textDecoration: "underline", textUnderlineOffset: 4 }}>
            {SUPPORT_EMAIL}
          </a>
        </section>

        <aside style={{ marginTop: 20, padding: "20px 24px", background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontSize: 13.5, lineHeight: 1.7 }}>
          문의 시 사용 기기, OS 버전, 문제 발생 상황을 함께 작성하면 빠른 확인에 도움이 됩니다.
        </aside>
      </main>
    </>
  );
}
