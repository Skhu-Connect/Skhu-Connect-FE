/* 로그인 (ROADMAP 1-1). 원본: web-app-v7.jsx 467–492행.
   원본 우하단 "에타 공유 링크 진입 데모" 토글은 디자인 툴 데모 장치라 옮기지 않는다 —
   그 시나리오는 /login?next=/p/1 실제 경로가 재현한다(의존 G). */

import { Navigate, useSearchParams } from "react-router-dom";
import { useSession } from "../../stores/session";
import { Button, Icon, Input } from "../../components/ui";
import { toast } from "../../components/Toast";

export default function LoginScreen() {
  const authed = useSession((s) => s.authed);
  const login = useSession((s) => s.login);
  const [params] = useSearchParams();
  const raw = params.get("next") || "/";
  // 오픈 리다이렉트 방지: 앱 내부 절대경로만 허용한다(//evil.com 은 브라우저가 외부로 읽는다).
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  const deepLink = next !== "/";

  if (authed) return <Navigate to={next} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await login(form.get("sid"), form.get("password"));
    } catch (err) {
      toast(err.message);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--gradient-hero)", padding: 20 }}>
      <div style={{ width: 400, maxWidth: "100%", background: "#fff", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: 36 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--gradient-hero)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 26 }}>청</div>
          <h1 style={{ margin: "8px 0 0", fontSize: 22, fontWeight: 800, color: "var(--indigo-600)" }}>청원시스템</h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>성공회대학교 학생 인증 후 이용</p>
        </div>

        {deepLink && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--indigo-50)", borderRadius: "var(--radius-md)", padding: "10px 12px", marginBottom: 18, fontSize: 12.5, color: "var(--indigo-700)", fontWeight: 600 }}>
            <Icon name="heart" size={15} color="var(--coral-500)" /> 로그인하면 바로 <b>&nbsp;공감&nbsp;</b>할 수 있어요
          </div>
        )}

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="학번" name="sid" placeholder="202214139" prefix={<Icon name="user" size={16} />} defaultValue="202214139" required />
          <Input label="비밀번호" name="password" type="password" placeholder="••••••••" prefix={<Icon name="lock" size={16} />} defaultValue="password" required />
          <Button type="submit" variant="primary" size="lg" block style={{ marginTop: 4 }}>로그인</Button>
        </form>
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 18, lineHeight: 1.6 }}>
          종합정보시스템 계정으로 로그인합니다.<br />개인정보는 인증에만 사용되며 청원은 익명 처리됩니다.
        </p>
      </div>
    </div>
  );
}
