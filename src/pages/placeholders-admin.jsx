/* Phase 0 의 Admin 라우트 플레이스홀더. Phase 2 가 화면별 파일로 교체하고 이 파일을 지운다. */

import { usePetitions } from "../stores/petitions";

const adminPage = { padding: "26px 30px", overflowY: "auto", flex: 1 };
const heading = { margin: 0, fontSize: 24, fontWeight: 800, color: "var(--text-strong)" };

export function AdminDashboard() {
  const petitions = usePetitions((s) => s.petitions);
  return (
    <div style={adminPage}>
      <h1 style={heading}>대시보드</h1>
      <p>전체 청원 {petitions.length}건</p>
    </div>
  );
}

export function AdminManage() {
  return (
    <div style={adminPage}>
      <h1 style={heading}>청원 관리</h1>
    </div>
  );
}

export function AdminOwners() {
  const owners = usePetitions((s) => s.owners);
  return (
    <div style={adminPage}>
      <h1 style={heading}>카테고리 담당자 {owners.length}명</h1>
    </div>
  );
}

export function AdminLogs() {
  const logs = usePetitions((s) => s.notifLogs);
  return (
    <div style={adminPage}>
      <h1 style={heading}>알림 로그 {logs.length}건</h1>
    </div>
  );
}
