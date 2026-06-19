// PLACEHOLDER AUTH — ported verbatim from use-studio-context.js. The old app has
// no real session; these return hardcoded values. Real @supabase/ssr cookie auth
// is a SEPARATE tracked change (flagged 2.0), NOT this spine port.
export function useOperatorContext(): {
  operatorId: string;
  operatorName: string;
  isAuthenticated: boolean;
  error: null;
} {
  return { operatorId: "zirowork-operator", operatorName: "ZiroWork", isAuthenticated: true, error: null };
}

// Legacy alias — old views called useStudioContext; no-op stub so nothing crashes.
export function useStudioContext(): { studioId: null; isAuthenticated: boolean; error: null } {
  return { studioId: null, isAuthenticated: true, error: null };
}
