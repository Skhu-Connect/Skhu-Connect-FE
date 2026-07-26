/* Admin 4화면 공통 머리말. 원본 admin-app-v4.jsx 185–192행. */

export default function PageHead({ title, desc }) {
  return (
    <>
      <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: "var(--text-strong)" }}>{title}</h1>
      <p style={{ margin: "0 0 22px", color: "var(--text-muted)", fontSize: 14 }}>{desc}</p>
    </>
  );
}
