function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: '#fff', color: '#1a1a1a', textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 64, marginBottom: 8 }}>🎵</div>
      <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Page not found</h1>
      <p style={{ fontSize: 16, color: '#777', margin: 0, maxWidth: 400, lineHeight: 1.6 }}>
        This page doesn't exist or isn't active yet. Check your link and try again.
      </p>
    </div>
  );
}
window.NotFoundPage = NotFoundPage;
