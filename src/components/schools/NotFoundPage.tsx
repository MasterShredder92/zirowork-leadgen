export default function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: 'var(--color-school-white)', color: 'var(--color-school-ink)', textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 65, marginBottom: 8 }}>🎵</div>
      <h1 style={{ fontSize: 33, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Page not found</h1>
      <p style={{ fontSize: 17, color: 'var(--color-school-text-5)', margin: 0, maxWidth: 400, lineHeight: 1.6 }}>
        This page doesn&apos;t exist or isn&apos;t active yet. Check your link and try again.
      </p>
    </div>
  );
}
