// Behavior/parity channel for Wave C. Runs the PURE derive functions against fixtures
// and asserts exact counts — the SSOT logic that tsc/lint can't see. Zero deps:
// `node --experimental-strip-types`. Pure fns only (no react/supabase imported here).
import assert from "node:assert/strict";
import { deriveRollups } from "../../../src/lib/derive/rollups.ts";
import { deriveIntegrations } from "../../../src/lib/derive/integrations.ts";
import { derivePageFunnel } from "../../../src/lib/derive/pageFunnel.ts";

const nowMs = Date.parse("2026-06-01T00:00:00.000Z");
const sinceMs = nowMs - 30 * 24 * 60 * 60 * 1000;
const inWin = "2026-05-20T00:00:00.000Z";
const outWin = "2026-01-01T00:00:00.000Z";

// ── deriveRollups ────────────────────────────────────────────────────────────
{
  const r = deriveRollups(
    {
      leads: [
        { id: "L1", client_id: "C1", campaign_id: "K1", created_at: inWin },
        { id: "L2", client_id: "C1", campaign_id: "K1", created_at: outWin },
        { id: "L3", client_id: "C2", campaign_id: null, created_at: inWin },
      ],
      bookings: [
        { lead_id: "L1", created_at: inWin },
        { lead_id: "L2", created_at: inWin },
        { lead_id: "L3", created_at: outWin },
      ],
      enrollments: [
        { lead_id: "L1", client_id: "C1", outcome: "enrolled", created_at: inWin },
        { lead_id: "L2", client_id: "C1", outcome: "lost", created_at: inWin },
        { lead_id: "L3", client_id: "C2", outcome: "enrolled", created_at: outWin },
      ],
      campaigns: [
        { id: "K1", client_id: "C1", status: "active" },
        { id: "K2", client_id: "C2", status: "paused" },
      ],
      escalations: [
        { tenant_id: "C1", resolved_at: null },
        { tenant_id: "C2", resolved_at: "2026-05-01T00:00:00.000Z" },
        { tenant_id: "C1", resolved_at: null },
      ],
    },
    nowMs,
  );
  assert.deepEqual(r.byClient.C1, {
    leads_30d: 1, trials_30d: 2, enrollments_30d: 1, active_campaigns: 1, open_escalations: 2,
  }, "rollups byClient.C1");
  assert.deepEqual(r.byClient.C2, {
    leads_30d: 1, trials_30d: 0, enrollments_30d: 0, active_campaigns: 0, open_escalations: 0,
  }, "rollups byClient.C2");
  assert.deepEqual(r.byCampaign.K1, { leads: 2, trials: 2, enrolled: 1 }, "rollups byCampaign.K1");
  assert.equal(r.byCampaign.K2, undefined, "K2 never ensured (no leads, not active path)");
}

// ── deriveIntegrations ───────────────────────────────────────────────────────
{
  const rows = deriveIntegrations(
    [
      { id: "C1", name: "Studio One", lead_form_webhook: "https://hook" },
      { id: "C2", school_name: "Studio Two" },
    ],
    [
      { tenant_id: "C1", config: { openphone_number_id: "PN123" }, square_customer_id: "cus", square_card_id: "card", per_enrollment_fee_cents: 5000, intake_api_key: "key" },
      { tenant_id: "C2", config: {}, square_customer_id: "cus2" },
    ],
  );
  const find = (cid: string, svc: string) => rows.find((r) => r.client_id === cid && r.service === svc);
  assert.equal(rows.length, 6, "3 rows per client x 2 clients");
  assert.equal(find("C1", "openphone")!.status, "connected");
  assert.equal(find("C1", "square")!.status, "connected");
  assert.equal(find("C1", "square")!.detail, "Card on file · $50.00/enrollment");
  assert.equal(find("C1", "lead_webhook")!.status, "connected");
  assert.equal(find("C2", "openphone")!.status, "missing");
  assert.equal(find("C2", "square")!.status, "incomplete");
  assert.equal(find("C2", "square")!.detail, "Customer created, no card on file");
  assert.equal(find("C2", "lead_webhook")!.status, "missing");
  assert.equal(find("C2", "openphone")!.client_name, "Studio Two", "falls back to school_name");
}

// ── derivePageFunnel ─────────────────────────────────────────────────────────
{
  const rows = derivePageFunnel(
    {
      pageEvents: [
        { type: "view", slug: "studio-one", instrument: "piano", created_at: inWin },
        { type: "view", slug: "studio-one", instrument: "piano", created_at: inWin },
        { type: "signup_view", slug: "studio-one", instrument: "piano", created_at: inWin },
      ],
      clientPages: [
        { id: "P1", client_id: "C1", school_name: "Studio One", instrument: "piano", slug: "studio-one", status: "live" },
      ],
      leads: [
        { id: "L1", page_url: "https://x/schools/studio-one?instrument=Piano", created_at: inWin },
      ],
      bookings: [{ lead_id: "L1", created_at: inWin }],
      enrollments: [{ lead_id: "L1", outcome: "enrolled", created_at: inWin }],
    },
    sinceMs,
  );
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], {
    id: "P1", client_id: "C1", client_name: "Studio One", instrument: "Piano",
    rawSlug: "studio-one", rawInstrument: "piano", status: "live", slug: "studio-one/piano",
    views: 2, clicks: 1, leads: 1, trials: 1, enrolled: 1,
  }, "pageFunnel P1 row");
}

console.log("WAVE C DERIVE TESTS: PASS");
