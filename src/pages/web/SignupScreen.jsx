/* 회원가입 (ROADMAP Phase 5-1). LoginScreen 과 같은 패턴(그라디언트 전면 배경 + 흰 카드,
   WebLayout 밖). 학부는 여기서만 받는다 — 로그인 폼은 그대로 학번·비밀번호만 쓴다. */

import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useSession } from "../../stores/session";
import * as api from "../../api";
import { Button, Icon, Input, Select } from "../../components/ui";

export default function SignupScreen() {
  const authed = useSession((s) => s.authed);
  const signup = useSession((s) => s.signup);
  const [departments, setDepartments] = useState([]);
  const [dept, setDept] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.listDepartments().then(setDepartments);
  }, []);

  if (authed) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const sid = String(form.get("sid") ?? "").trim();
    const name = String(form.get("name") ?? "").trim();
    const password = String(form.get("password") ?? "").trim();
    const passwordConfirm = String(form.get("passwordConfirm") ?? "").trim();
    setError("");
    if (!sid || !name || !password) {
      setError("학번·이름·비밀번호를 입력해 주세요.");
      return;
    }
    if (!dept) {
      setError("소속 학부를 선택해 주세요.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 서로 다릅니다.");
      return;
    }
    setSaving(true);
    try {
      await signup({ sid, name, dept, password });
    } catch {
      setError("회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--gradient-hero)", padding: 20 }}>
      <div style={{ width: 400, maxWidth: "100%", background: "#fff", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: 36 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginBottom: 24 }}>
          <img src="/logo.png" alt="" width={52} height={52} style={{ borderRadius: 14, display: "block" }} />
          <h1 style={{ margin: "8px 0 0", fontSize: 22, fontWeight: 800, color: "var(--indigo-600)" }}>회원가입</h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>성공회대학교 학생만 가입할 수 있어요</p>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="학번" name="sid" placeholder="학번을 입력하세요" prefix={<Icon name="user" size={16} />} required />
          <Input label="이름" name="name" placeholder="이름을 입력하세요" required />
          <Select label="소속 학부" options={departments} value={dept} onChange={(e) => setDept(e.target.value)} placeholder="학부를 선택하세요" />
          <Input label="비밀번호" name="password" type="password" placeholder="••••••••" prefix={<Icon name="lock" size={16} />} required />
          <Input label="비밀번호 확인" name="passwordConfirm" type="password" placeholder="••••••••" prefix={<Icon name="lock" size={16} />} required />
          {error && (
            <p role="alert" style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--danger-500)" }}>{error}</p>
          )}
          <Button type="submit" variant="primary" size="lg" block disabled={saving} style={{ marginTop: 4 }}>회원가입</Button>
        </form>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 18, fontSize: 13 }}>
          <Link to="/login" style={{ color: "var(--indigo-600)", fontWeight: 600 }}>로그인으로 돌아가기</Link>
          <span style={{ color: "var(--border-strong)" }}>|</span>
          <a href="https://skhu.ac.kr" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-muted)", fontWeight: 600 }}>계정을 모르시나요?</a>
        </div>
      </div>
    </div>
  );
}
