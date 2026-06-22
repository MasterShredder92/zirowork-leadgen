"use client";

// Closed button only. Dropdown (My Profile, Settings, Logout) deferred to Phase-3 shell debt.
export default function UserMenu() {
  return (
    <button
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "6px 12px",
        background: "var(--color-hover)", border: "1px solid var(--color-border)",
        borderRadius: 8, cursor: "pointer",
        fontFamily: "inherit", fontSize: 13, color: "var(--color-text-1)",
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: "linear-gradient(135deg, var(--color-mc-grad-from), var(--color-mc-grad-to))",
        color: "var(--color-on-accent)", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700,
      }}>
        MC
      </div>
      <span>▼</span>
    </button>
  );
}
