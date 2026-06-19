# Handoff

VERIFIED: verify-phase-2.sh exits 0 (tsc + eslint + build + 2.1 token parity + 2.3 serve gate) — green with usePages added.

CHANGED:
  - src/hooks/usePages.ts — added (Wave B); .then()-in-useEffect pattern, tick-based refetch; tsc + eslint + build pass
  - _migration/progress.md — Wave A + Wave B marked DONE; NEXT updated to Wave C derive pass

BROKEN: nothing

NEXT BEST STEP: 2.4 Wave C — derive pass on use-local-data.js before porting
  - 14 exports: useClients, useCampaigns, useLeads, useConversations, useEscalations, useBookings, useEnrollments, useOperatorTasks, useClientReports, useAutomationRules, useIntegrations, useAgentTenants, useRollups, usePageFunnel
  - Has realtime subscriptions (window.sb.channel) + seed fallback (_useTable pattern) + derived rollups (deriveRollups, derivePageFunnel)
  - Realtime and derived hooks need separate treatment from simple table reads
  - Run a derive pass (like phase-2/derived.md) to capture signatures + dependencies before writing any src/ file
