"use client";
// Minimal layout that just renders children.
// The DashboardShell (client component) lives in page.tsx and manages its own full-screen layout.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
