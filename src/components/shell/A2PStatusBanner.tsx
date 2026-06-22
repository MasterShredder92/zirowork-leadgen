"use client";


export default function A2PStatusBanner({ status }: { status: "Pending" | "Approved" | "Rejected" | null }) {
  if (!status || status === "Approved") return null;

  const isPending = status === "Pending";

  return (
    <div style={{
      width: "100%",
      padding: "10px 16px",
      background: isPending ? "var(--color-a2p-pending-bg)" : "var(--color-a2p-error-bg)",
      borderBottom: `1px solid ${isPending ? "var(--color-a2p-pending-border)" : "var(--color-a2p-error-border)"}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
    }}>
      <div style={{
        fontSize: "13px",
        color: isPending ? "var(--color-a2p-pending-text)" : "var(--color-a2p-error-text)",
        fontWeight: 600,
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}>
        {isPending
          ? "⚠️ SMS Registration Pending: Your A2P 10DLC business profile is under review by carriers. Automated texting is paused until approved (usually 5-10 days)."
          : "🚨 SMS Registration Rejected: Your A2P 10DLC business profile was rejected. Please contact support to correct your tax information."}
      </div>
    </div>
  );
}
