# STAGE: Phase 2 — Wave C (use-local-data → typed modules)

Gate: `_migration/epic/GATES/verify-phase-2-waveC.sh`. Follow the RUN-A-STAGE loop in
`../00-RUNBOOK.md`. Do NOT edit any gate to pass (RUBRIC = BLOCK). Zach commits.

## WHAT THIS DOES
Port the live half of `93-hooks/use-local-data.js` to typed `src/` modules. The engine
`_useTable` becomes one typed hook; the 8 live table hooks are thin wrappers; the 3 pure
derive fns + 2 composer hooks + 2 constants move as-is. The 4 dead hooks are NOT ported.
Facts in `_migration/phase-2/derived-wave-c.md`. Nothing renders yet (views are Phase 3).

## FILE MAP (create in this order — leaf-first)
```
src/lib/derive/types.ts        row + result types (touched fields only)
src/lib/derive/rollups.ts      deriveRollups + EMPTY_CLIENT_ROLLUP + EMPTY_CAMPAIGN_ROLLUP
src/lib/derive/integrations.ts deriveIntegrations
src/lib/derive/pageFunnel.ts   parseLeadPage + derivePageFunnel
src/hooks/useRealtimeTable.ts  the engine (realtime + tick refetch)
src/hooks/tables.ts            8 live hooks (incl. useAgentTenants safe-cols)
src/hooks/useRollups.ts        composer
src/hooks/usePageFunnel.ts     composer
```
Dropped (0 consumers, Phase-0 dead list): useConversations, useOperatorTasks, useClientReports,
useIntegrations, SEED_DATA. They go with the dead-code sweep, not here.

## TWO CONFIG EDITS FIRST (required, with reason)
The derive test (`GATES/waveC.derive.test.ts`) is run by `node --experimental-strip-types`, so it
imports with explicit `.ts` extensions — which `tsc` rejects (no `allowImportingTsExtensions`). It's
harness scaffolding, not app code, so scope tooling away from `_migration/`:
1. `tsconfig.json` → add `"_migration"` to `exclude`.
2. `eslint.config.mjs` → add `"_migration/**"` to the `globalIgnores([...])` list.
This widens an exclude → the red-check below MUST prove `src/` coverage is still intact.

## FILE CONTENTS (verified: derive code + test already agree, exit 0)

### src/lib/derive/types.ts
```ts
export type Lead = { id: string; client_id?: string | null; campaign_id?: string | null; created_at?: string | null; page_url?: string | null };
export type Booking = { lead_id?: string | null; created_at?: string | null };
export type Enrollment = { lead_id?: string | null; client_id?: string | null; outcome?: string | null; created_at?: string | null };
export type Campaign = { id: string; client_id?: string | null; status?: string | null };
export type Escalation = { tenant_id?: string | null; resolved_at?: string | null };
export type Client = { id: string; name?: string | null; school_name?: string | null; lead_form_webhook?: string | null };
export type AgentTenant = { tenant_id?: string | null; config?: { openphone_number_id?: string | null } | null; square_customer_id?: string | null; square_card_id?: string | null; per_enrollment_fee_cents?: number | null; intake_api_key?: string | null };
export type PageEvent = { type?: string | null; slug?: string | null; instrument?: string | null; created_at?: string | null };
export type ClientPage = { id: string; client_id?: string | null; school_name?: string | null; instrument: string; slug: string; status?: string | null; is_active?: boolean | null };
export type ClientRollup = { leads_30d: number; trials_30d: number; enrollments_30d: number; active_campaigns: number; open_escalations: number };
export type CampaignRollup = { leads: number; trials: number; enrolled: number };
export type IntegrationRow = { client_id: string; client_name: string; service: string; label: string; status: string; detail: string };
export type FunnelRow = { id: string; client_id?: string | null; client_name: string; instrument: string; rawSlug: string; rawInstrument: string; status: string; slug: string; views: number; clicks: number; leads: number; trials: number; enrolled: number };
```
Types are DERIVED from fields the derive fns touch — not the full 24-table schema. Phase 3 view
ports extend these or swap for generated DB types.

### src/lib/derive/rollups.ts
```ts
import type { Lead, Booking, Enrollment, Campaign, Escalation, ClientRollup, CampaignRollup } from "./types";

export const EMPTY_CLIENT_ROLLUP: ClientRollup = { leads_30d: 0, trials_30d: 0, enrollments_30d: 0, active_campaigns: 0, open_escalations: 0 };
export const EMPTY_CAMPAIGN_ROLLUP: CampaignRollup = { leads: 0, trials: 0, enrolled: 0 };

const ROLLUP_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

// SSOT: counts derived from live source rows, never read from stored *_30d columns (they drift).
export function deriveRollups(
  sources: { leads: Lead[]; bookings: Booking[]; enrollments: Enrollment[]; campaigns: Campaign[]; escalations: Escalation[] },
  nowMs: number,
): { byClient: Record<string, ClientRollup>; byCampaign: Record<string, CampaignRollup> } {
  const { leads, bookings, enrollments, campaigns, escalations } = sources;
  const since = new Date(nowMs - ROLLUP_WINDOW_MS).toISOString();
  const leadById: Record<string, Lead> = {};
  leads.forEach((l) => { leadById[l.id] = l; });
  const byClient: Record<string, ClientRollup> = {};
  const ensureClient = (id: string) => (byClient[id] ??= { ...EMPTY_CLIENT_ROLLUP });
  const byCampaign: Record<string, CampaignRollup> = {};
  const ensureCampaign = (id: string) => (byCampaign[id] ??= { ...EMPTY_CAMPAIGN_ROLLUP });
  leads.forEach((l) => {
    if (l.campaign_id) ensureCampaign(l.campaign_id).leads += 1;
    if (l.client_id && l.created_at && l.created_at >= since) ensureClient(l.client_id).leads_30d += 1;
  });
  bookings.forEach((b) => {
    const lead = b.lead_id ? leadById[b.lead_id] : null;
    if (!lead) return;
    if (lead.campaign_id) ensureCampaign(lead.campaign_id).trials += 1;
    if (lead.client_id && b.created_at && b.created_at >= since) ensureClient(lead.client_id).trials_30d += 1;
  });
  enrollments.forEach((e) => {
    if (e.outcome !== "enrolled") return;
    const lead = e.lead_id ? leadById[e.lead_id] : null;
    if (lead && lead.campaign_id) ensureCampaign(lead.campaign_id).enrolled += 1;
    if (e.client_id && e.created_at && e.created_at >= since) ensureClient(e.client_id).enrollments_30d += 1;
  });
  campaigns.forEach((c) => { if (c.client_id && c.status === "active") ensureClient(c.client_id).active_campaigns += 1; });
  escalations.forEach((e) => { if (e.tenant_id && !e.resolved_at) ensureClient(e.tenant_id).open_escalations += 1; });
  return { byClient, byCampaign };
}
```

### src/lib/derive/integrations.ts
```ts
import type { Client, AgentTenant, IntegrationRow } from "./types";

export function deriveIntegrations(clients: Client[], tenants: AgentTenant[]): IntegrationRow[] {
  const tenantByClient: Record<string, AgentTenant> = {};
  (tenants || []).forEach((t) => { if (t.tenant_id) tenantByClient[t.tenant_id] = t; });
  const rows: IntegrationRow[] = [];
  (clients || []).forEach((c) => {
    const t = tenantByClient[c.id] || ({} as AgentTenant);
    const name = c.name || c.school_name || "—";
    const phoneId = t.config && t.config.openphone_number_id;
    const phoneOk = typeof phoneId === "string" && phoneId.length > 0;
    rows.push({ client_id: c.id, client_name: name, service: "openphone", label: "OpenPhone / SMS", status: phoneOk ? "connected" : "missing", detail: phoneOk ? "Number set" : "No OpenPhone number set" });
    const hasCustomer = !!t.square_customer_id;
    const hasCard = !!t.square_card_id;
    const fee = t.per_enrollment_fee_cents ?? 0;       // null-safe; legacy treated missing fee as 0
    const hasFee = fee > 0;
    let sqStatus: string, sqDetail: string;
    if (hasCustomer && hasCard && hasFee) { sqStatus = "connected"; sqDetail = `Card on file · $${(fee / 100).toFixed(2)}/enrollment`; }
    else if (hasCustomer) { sqStatus = "incomplete"; sqDetail = !hasCard ? "Customer created, no card on file" : "No enrollment fee set"; }
    else { sqStatus = "missing"; sqDetail = "No Square customer"; }
    rows.push({ client_id: c.id, client_name: name, service: "square", label: "Square / Billing", status: sqStatus, detail: sqDetail });
    const hasWebhook = typeof c.lead_form_webhook === "string" && c.lead_form_webhook.length > 0;
    const hasKey = typeof t.intake_api_key === "string" && t.intake_api_key.length > 0;
    let lwStatus: string, lwDetail: string;
    if (hasWebhook && hasKey) { lwStatus = "connected"; lwDetail = "Webhook + API key set"; }
    else if (hasWebhook) { lwStatus = "incomplete"; lwDetail = "Webhook set, no intake API key"; }
    else { lwStatus = "missing"; lwDetail = "No lead webhook set"; }
    rows.push({ client_id: c.id, client_name: name, service: "lead_webhook", label: "Lead Webhook", status: lwStatus, detail: lwDetail });
  });
  return rows;
}
```

### src/lib/derive/pageFunnel.ts
```ts
import type { PageEvent, ClientPage, Lead, Booking, Enrollment, FunnelRow } from "./types";

const INST_LABEL: Record<string, string> = { piano: "Piano", guitar: "Guitar", vocals: "Voice", drums: "Drums" };

export function parseLeadPage(url: string | null | undefined): { slug: string; instrument: string } | null {
  if (!url) return null;
  try {
    const u = new URL(url, "https://x");
    const parts = u.pathname.split("/").filter(Boolean);
    const i = parts.indexOf("schools");
    const slug = i >= 0 ? parts[i + 1] : null;
    const instrument = u.searchParams.get("instrument");
    if (!slug || !instrument) return null;
    return { slug, instrument: instrument.toLowerCase() };
  } catch { return null; }
}

export function derivePageFunnel(
  sources: { pageEvents: PageEvent[]; clientPages: ClientPage[]; leads: Lead[]; bookings: Booking[]; enrollments: Enrollment[] },
  sinceMs?: number | null,
): FunnelRow[] {
  const { pageEvents, clientPages, leads, bookings, enrollments } = sources;
  const keyOf = (slug: string, inst: string | null | undefined) => `${slug}|${(inst || "").toLowerCase()}`;
  const since = sinceMs ? new Date(sinceMs).toISOString() : null;
  const inWin = (ts: string | null | undefined) => !since || (!!ts && ts >= since);
  const ev: Record<string, { views: number; clicks: number }> = {};
  const ensureEv = (k: string) => (ev[k] ??= { views: 0, clicks: 0 });
  pageEvents.forEach((e) => {
    if (!inWin(e.created_at)) return;
    const k = keyOf(e.slug || "", e.instrument);
    if (e.type === "view") ensureEv(k).views += 1;
    else if (e.type === "signup_view") ensureEv(k).clicks += 1;
  });
  const fn: Record<string, { leads: number; trials: number; enrolled: number }> = {};
  const ensureFn = (k: string) => (fn[k] ??= { leads: 0, trials: 0, enrolled: 0 });
  const leadPageKey: Record<string, string> = {};
  leads.forEach((l) => {
    const p = parseLeadPage(l.page_url);
    if (!p) return;
    const k = keyOf(p.slug, p.instrument);
    leadPageKey[l.id] = k;                 // attribution map: ALL leads, unwindowed
    if (inWin(l.created_at)) ensureFn(k).leads += 1;
  });
  bookings.forEach((b) => {
    if (!inWin(b.created_at)) return;
    const k = b.lead_id ? leadPageKey[b.lead_id] : null;
    if (k) ensureFn(k).trials += 1;
  });
  enrollments.forEach((e) => {
    if (e.outcome !== "enrolled" || !inWin(e.created_at)) return;
    const k = e.lead_id ? leadPageKey[e.lead_id] : null;
    if (k) ensureFn(k).enrolled += 1;
  });
  return clientPages.map((p) => {
    const k = keyOf(p.slug, p.instrument);
    const e = ev[k] || { views: 0, clicks: 0 };
    const f = fn[k] || { leads: 0, trials: 0, enrolled: 0 };
    return {
      id: p.id, client_id: p.client_id, client_name: p.school_name || "—",
      instrument: INST_LABEL[p.instrument] || p.instrument,
      rawSlug: p.slug, rawInstrument: p.instrument,
      status: p.status || (p.is_active ? "live" : "draft"),
      slug: `${p.slug}/${p.instrument}`,
      views: e.views, clicks: e.clicks, leads: f.leads, trials: f.trials, enrolled: f.enrolled,
    };
  });
}
```

### src/hooks/useRealtimeTable.ts
```ts
import { useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

// Realtime table read: fetch on mount + on any postgres change (via tick), ordered created_at desc.
// .then()+tick (not async-in-effect) to satisfy react-hooks/set-state-in-effect — same as usePages.
// chanKey gives composer hooks a distinct channel so they don't collide with a page's own sub.
export function useRealtimeTable<T = Record<string, unknown>>(
  table: string,
  filters?: Record<string, unknown>,
  chanKey?: string,
): { data: T[]; loading: boolean; error: PostgrestError | null; refetch: () => void } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [tick, setTick] = useState(0);
  const filterKey = filters ? JSON.stringify(filters) : "";

  useEffect(() => {
    let q = supabase.from(table).select("*").order("created_at", { ascending: false });
    if (filters) Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v); });
    q.then(({ data: rows, error: err }) => {
      setData((rows as T[]) ?? []);
      setError(err);
      setLoading(false);
    });
    // filterKey is the stable proxy for filters; tick forces refetch on realtime/manual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filterKey, tick]);

  useEffect(() => {
    const channel = supabase
      .channel(`rt-${table}${chanKey ? `-${chanKey}` : ""}${filterKey ? `-${filterKey}` : ""}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => setTick((t) => t + 1))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filterKey, chanKey]);

  return { data, loading, error, refetch: () => setTick((t) => t + 1) };
}
```
If `.on("postgres_changes", …)` fights tsc, that's the one spot to nudge — keep the call shape,
it is standard @supabase/supabase-js v2 usage. Do NOT change the gate; fix the typing.

### src/hooks/tables.ts
```ts
import { useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { useRealtimeTable } from "./useRealtimeTable";
import type { Lead, Booking, Enrollment, Campaign, Escalation, AgentTenant } from "@/lib/derive/types";

type Filters = Record<string, unknown>;

export const useClients         = (f?: Filters) => useRealtimeTable("clients", f);
export const useCampaigns       = (f?: Filters) => useRealtimeTable<Campaign>("campaigns", f);
export const useLeads           = (f?: Filters) => useRealtimeTable<Lead>("leads", f);
export const useEscalations     = (f?: Filters) => useRealtimeTable<Escalation>("escalations", f);
export const useBookings        = (f?: Filters) => useRealtimeTable<Booking>("bookings", f);
export const useEnrollments     = (f?: Filters) => useRealtimeTable<Enrollment>("enrollments", f);
export const useAutomationRules = (f?: Filters) => useRealtimeTable("automation_rules", f);

// agent_tenants: EXPLICIT safe-col select — never pull supabase_service_key/url to the browser.
const TENANT_SAFE_COLS = "id, tenant_id, name, plan_tier, status, config, square_customer_id, square_card_id, per_enrollment_fee_cents, intake_api_key, integrations_enabled";

export function useAgentTenants(): { data: AgentTenant[]; loading: boolean; error: PostgrestError | null; refetch: () => void } {
  const [data, setData] = useState<AgentTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    supabase.from("agent_tenants").select(TENANT_SAFE_COLS).then(({ data: rows, error: err }) => {
      setData((rows as AgentTenant[]) ?? []);
      setError(err);
      setLoading(false);
    });
  }, [tick]);
  useEffect(() => {
    const channel = supabase
      .channel("rt-agent_tenants")
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_tenants" }, () => setTick((t) => t + 1))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);
  return { data, loading, error, refetch: () => setTick((t) => t + 1) };
}
```

### src/hooks/useRollups.ts
```ts
import { useMemo } from "react";
import { useRealtimeTable } from "./useRealtimeTable";
import { deriveRollups } from "@/lib/derive/rollups";
import type { Lead, Booking, Enrollment, Campaign, Escalation } from "@/lib/derive/types";

// Distinct channel key 'roll' so it never collides with a page's own subscriptions.
// TRAP: open escalations come from ziro_messaging_escalations (the table the Escalations page
// treats as truth), NOT the 'escalations' table. Do not collapse the two.
export function useRollups() {
  const leads       = useRealtimeTable<Lead>("leads", undefined, "roll").data;
  const bookings    = useRealtimeTable<Booking>("bookings", undefined, "roll").data;
  const enrollments = useRealtimeTable<Enrollment>("enrollments", undefined, "roll").data;
  const campaigns   = useRealtimeTable<Campaign>("campaigns", undefined, "roll").data;
  const escalations = useRealtimeTable<Escalation>("ziro_messaging_escalations", undefined, "roll").data;
  return useMemo(
    () => deriveRollups({ leads, bookings, enrollments, campaigns, escalations }, Date.now()),
    [leads, bookings, enrollments, campaigns, escalations],
  );
}
```

### src/hooks/usePageFunnel.ts
```ts
import { useMemo } from "react";
import { useRealtimeTable } from "./useRealtimeTable";
import { derivePageFunnel } from "@/lib/derive/pageFunnel";
import type { PageEvent, ClientPage, Lead, Booking, Enrollment } from "@/lib/derive/types";

export function usePageFunnel(sinceMs?: number | null) {
  const pageEvents  = useRealtimeTable<PageEvent>("page_events", undefined, "fnl").data;
  const clientPages = useRealtimeTable<ClientPage>("client_pages", undefined, "fnl").data;
  const leads       = useRealtimeTable<Lead>("leads", undefined, "fnl").data;
  const bookings    = useRealtimeTable<Booking>("bookings", undefined, "fnl").data;
  const enrollments = useRealtimeTable<Enrollment>("enrollments", undefined, "fnl").data;
  return useMemo(
    () => derivePageFunnel({ pageEvents, clientPages, leads, bookings, enrollments }, sinceMs),
    [pageEvents, clientPages, leads, bookings, enrollments, sinceMs],
  );
}
```

## RUN / GATE / RED-CHECK / ENDER
1. Make the 2 config edits + create the 8 files above.
2. `bash _migration/epic/GATES/verify-phase-2-waveC.sh` → must end `PHASE 2 WAVE C: PASS`, exit 0.
   - if a channel is red, fix the WORK and re-run. 3 fails on one channel → STOP, surface (BLOCK).
3. RED-CHECK (Rule 15, because we widened an exclude): temporarily put a type error in
   `src/lib/derive/rollups.ts` (e.g. `leads_30d: "x"` in EMPTY_CLIENT_ROLLUP), rerun the gate →
   it MUST fail on tsc. Then `git checkout src/lib/derive/rollups.ts` and rerun → green. This proves
   `src/` is still type-checked despite excluding `_migration`.
4. `bash _migration/epic/GATES/gate-integrity.sh` → must print GATE INTEGRITY: PASS.
5. Write `_migration/epic/CHECKPOINTS/phase-2-waveC.md` using `../RUBRIC.md` schema (DID / GATE
   OUTPUT / DEVIATIONS / DID NOT VERIFY / GAMING DISCLOSURE). GAMING DISCLOSURE must be "none".
6. Update `_migration/progress.md` (Wave C DONE; NEXT = Phase 3, build render-diff gate first) and
   `_migration/session-handoff.md`. Leave tree clean.
7. STOP. Report exit codes + paste the ender. Zach reviews and commits.

## DEFINITION OF DONE (this stage)
verify-phase-2-waveC.sh exit 0 + gate-integrity exit 0 + ender complete + GAMING DISCLOSURE none.
That closes Phase 2. Phase 3 begins by BUILDING its render-diff gate (no view ports before it).
