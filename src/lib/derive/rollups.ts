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
