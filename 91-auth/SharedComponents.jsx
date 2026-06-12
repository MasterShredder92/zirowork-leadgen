// ─── Auth shared styles ──────────────────────────────────────
const authInput = {
  width: '100%', padding: '10px 12px', fontSize: 15,
  background: 'var(--surface)', border: '1px solid var(--border-med)',
  borderRadius: 8, color: 'var(--text)', outline: 'none', fontFamily: 'inherit',
};
const authLabel = { fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, display: 'block' };
const authBtn   = (loading) => ({
  width: '100%', padding: '11px 0', fontSize: 15, fontWeight: 600,
  background: 'var(--accent)', color: '#fff', border: 'none',
  borderRadius: 8, fontFamily: 'inherit', marginTop: 4,
  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
});
function AuthWrap({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 360, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src="bolt-white.png" alt="ZiroWork" style={{ height: 30, marginBottom: 10 }} />
          <div style={{ fontSize: 13, color: 'var(--text-4)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Enrollment OS</div>
        </div>
        {children}
      </div>
    </div>
  );
}
function AuthError({ msg }) {
  if (!msg) return null;
  return <div style={{ fontSize: 14, color: '#ef4444', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)' }}>{msg}</div>;
}
// Expose utilities and wrappers globally for auth sub-views
window.authInput = authInput;
window.authLabel = authLabel;
window.authBtn = authBtn;
window.AuthWrap = AuthWrap;
window.AuthError = AuthError;