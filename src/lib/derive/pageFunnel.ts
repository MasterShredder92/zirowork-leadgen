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
