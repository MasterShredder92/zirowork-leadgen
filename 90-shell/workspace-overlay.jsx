// ── Workspace Overlay Surface ────────────────────────────────────────────────────────
// Presentation shell that isolates a focused view workflow directly over the workspace layer.

function WorkspaceOverlay({ T, title, subtitle, open, onClose, children, actions = [], onBackdropClick = null }) {
  if (!open) return null;

  const handleBackdropClick = onBackdropClick !== null ? onBackdropClick : onClose;

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.bg,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: '24px',
          width: '100%',
          maxWidth: 500,
          maxHeight: 'calc(100dvh - 32px)',
          overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: T.t1, margin: '0 0 4px 0' }}>
              {title}
            </h2>
            {subtitle && <p style={{ fontSize: 13, color: T.t3, margin: 0 }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: T.t3,
              cursor: 'pointer',
              fontSize: 21,
              lineHeight: 1,
              padding: '4px 8px',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Body Fragment */}
        <div style={{ marginBottom: 24 }}>
          {children}
        </div>

        {/* Contextual Actions */}
        {actions.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                disabled={action.disabled}
                style={{
                  padding: '7px 16px',
                  borderRadius: 7,
                  border: action.variant === 'primary' ? 'none' : `1px solid ${T.border}`,
                  background: action.variant === 'primary'
                    ? T.isDark ? '#818CF8' : '#4F46E5'
                    : 'transparent',
                  color: action.variant === 'primary' ? '#fff' : T.t2,
                  cursor: action.disabled ? 'default' : 'pointer',
                  fontSize: 13,
                  fontWeight: action.variant === 'primary' ? 600 : 500,
                  fontFamily: 'inherit',
                  opacity: action.disabled ? 0.7 : 1,
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

window.WorkspaceOverlay = WorkspaceOverlay;
