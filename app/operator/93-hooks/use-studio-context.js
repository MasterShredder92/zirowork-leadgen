// useOperatorContext() — ZiroWork Operator CRM context
// Replaces the old single-studio Supabase context.
// Phase 1: returns hardcoded operator. Swap for real auth when backend is wired.

function useOperatorContext() {
  return {
    operatorId: 'zirowork-operator',
    operatorName: 'ZiroWork',
    isAuthenticated: true,
    error: null,
  };
}

// Legacy alias — old views used useStudioContext; kept as no-op stub so nothing crashes.
function useStudioContext() {
  return { studioId: null, isAuthenticated: true, error: null };
}

Object.assign(window, { useOperatorContext, useStudioContext });
