/* 마이페이지 (ROADMAP Phase 5-2). WebLayout 안(인증 필요). 이름은 읽기 전용,
   소속 학부만 수정 가능하다 — 그 외 필드는 수정 대상이 아니다.
   학번·학년은 여기서는 표시하지 않는다 — 헤더 아바타 메뉴·환경설정 모달에는 그대로 남아 있다. */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../stores/session";
import * as api from "../../api";
import { Button, Card, Select } from "../../components/ui";
import { toast } from "../../components/Toast";

export default function MyPageScreen() {
  const user = useSession((s) => s.user);
  const updateProfile = useSession((s) => s.updateProfile);
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [dept, setDept] = useState(user.dept);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.listDepartments().then(setDepartments);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({ dept });
      toast("학부 정보가 수정되었습니다");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px var(--page-gutter) 90px" }}>
      <h1 style={{ margin: "0 0 20px", fontSize: 26, fontWeight: 800, color: "var(--text-strong)" }}>마이페이지</h1>

      <Card padding="var(--pad-card-lg)" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ font: "var(--text-label)", color: "var(--text-strong)" }}>이름</span>
          <span style={{ fontSize: 15, color: "var(--text-body)" }}>{user.name}</span>
        </div>
        <Select label="소속 학부" options={departments} value={dept} onChange={(e) => setDept(e.target.value)} placeholder="학부를 선택하세요" />

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="outline" onClick={() => navigate("/mine")}>내 건의 보기</Button>
          <Button variant="primary" disabled={!dept || saving} onClick={save}>저장</Button>
        </div>
      </Card>
    </div>
  );
}
