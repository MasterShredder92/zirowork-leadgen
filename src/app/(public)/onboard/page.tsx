import OnboardForm from "@/components/forms/OnboardForm";

// #root: min-height 100vh, flex column, align items center, padding 48px 16px
// .onboard-header: full-width up to 560px, ZiroWork wordmark in accent color
// CSS vars (--bg, --surface, --border, --accent, --text-*) come from globals.css

export default function OnboardPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "48px 16px",
        background: "var(--color-bg)",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        color: "var(--color-text-1)",
        WebkitFontSmoothing: "antialiased",
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-accent)",
          }}
        >
          ZiroWork
        </span>
      </div>
      <OnboardForm standalone />
    </div>
  );
}
