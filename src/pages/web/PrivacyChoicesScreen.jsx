import MobileShareHeader from "../../components/web/MobileShareHeader";

const PRIVACY_EMAIL = "skhu202214139@gmail.com";
const PRIVACY_POLICY_PATH = "/privacy-policy.html";

function Section({ title, children }) {
  return (
    <section style={{ padding: "clamp(22px, 5vw, 30px)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}>
      <h2 style={{ margin: 0, color: "var(--text-strong)", font: "var(--text-h2)" }}>{title}</h2>
      <div style={{ marginTop: 14, color: "var(--text-body)", fontSize: 15, lineHeight: 1.75 }}>{children}</div>
    </section>
  );
}

const listStyle = { margin: "12px 0 0", paddingLeft: 20 };
const itemStyle = { marginTop: 6 };

export default function PrivacyChoicesScreen() {
  return (
    <>
      <title>개인정보 선택 및 관리 | 성공잇다</title>
      <meta name="description" content="성공잇다 사용자의 개인정보 선택 사항 및 권리 안내" />

      <MobileShareHeader />
      <main style={{ width: "min(100% - 32px, 720px)", margin: "0 auto", padding: "clamp(48px, 9vw, 88px) 0 64px" }}>
        <section aria-labelledby="privacy-choices-title">
          <span style={{ display: "inline-block", marginBottom: 14, color: "var(--indigo-600)", fontSize: 13, fontWeight: 700, letterSpacing: ".04em" }}>
            PRIVACY CHOICES
          </span>
          <h1 id="privacy-choices-title" style={{ margin: 0, color: "var(--text-strong)", fontSize: "clamp(30px, 6vw, 40px)", lineHeight: 1.2, letterSpacing: "var(--ls-tight)" }}>
            개인정보 선택 및 관리
          </h1>
          <p style={{ margin: "20px 0 0", color: "var(--text-body)", fontSize: 16, lineHeight: 1.75 }}>
            성공잇다는 사용자가 자신의 개인정보와 관련된 사항을 확인하고 관리할 수 있도록 지원합니다.
          </p>
        </section>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 40 }}>
          <Section title="계정 및 개인정보">
            <p style={{ margin: 0 }}>회원가입 시 학교 이메일, 학번(로그인 ID), 비밀번호 및 소속 학부 정보를 제공합니다.</p>
            <ul style={listStyle}>
              <li style={itemStyle}>소속 학부는 로그인 후 <b>마이페이지 &gt; 소속 학부 수정</b>에서 변경할 수 있습니다.</li>
              <li style={itemStyle}>학교 이메일, 학번, 비밀번호 등 앱에서 직접 수정할 수 없는 정보의 열람·정정 요청은 아래 개인정보 문의처로 접수해 주세요.</li>
            </ul>
          </Section>

          <Section title="계정 및 개인정보 삭제">
            <p style={{ margin: 0 }}>사용자는 로그인 후 <b>마이페이지 &gt; 회원탈퇴</b>에서 비밀번호를 입력하여 계정 삭제를 요청할 수 있습니다.</p>
            <p>탈퇴가 완료되면 계정 정보가 삭제됩니다. 동일 학교 이메일의 재가입 남용 방지를 위해 이메일의 복원 불가능한 해시값만 탈퇴일로부터 30일간 보관합니다.</p>
            <p style={{ marginBottom: 0 }}>법령 등에 따라 별도 보관이 필요한 정보는 <a href={PRIVACY_POLICY_PATH}>개인정보처리방침</a>을 참고해 주세요.</p>
          </Section>

          <Section title="알림 설정">
            <p style={{ margin: 0 }}>푸시 알림 사용 여부는 기기 설정에서 변경할 수 있습니다.</p>
            <p style={{ marginBottom: 0 }}><b>iOS:</b> 설정 &gt; 알림 &gt; 성공잇다</p>
            <p style={{ marginBottom: 0 }}>앱 내 알림 항목은 <b>MY &gt; 알림 설정</b>에서 확인할 수 있습니다.</p>
          </Section>

          <Section title="개인정보 관련 문의">
            <p style={{ margin: 0 }}>개인정보의 열람·정정·삭제 및 처리 관련 문의는 아래 이메일로 접수해 주세요.</p>
            <a href={`mailto:${PRIVACY_EMAIL}`} style={{ display: "inline-block", marginTop: 12, color: "var(--indigo-600)", fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 700, wordBreak: "break-all", textDecoration: "underline", textUnderlineOffset: 4 }}>
              {PRIVACY_EMAIL}
            </a>
          </Section>

          <aside style={{ padding: "20px 24px", background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontSize: 13.5, lineHeight: 1.7 }}>
            자세한 개인정보 처리 항목과 보유 기간은 <a href={PRIVACY_POLICY_PATH}>개인정보처리방침</a>에서 확인할 수 있습니다.
          </aside>
        </div>
      </main>
    </>
  );
}
