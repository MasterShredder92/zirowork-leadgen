import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { scoreAndSend } from '../_shared/score-and-send.ts';
import { resolveSettings, isInWindow, nextWindowOpenUTC } from '../_shared/settings.ts';
import type { WebhookPayload } from '../_shared/types.ts';

const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET')!;
const PLATFORM_URL = Deno.env.get('SUPABASE_URL')!;
const PLATFORM_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Auth: shared webhook secret
  if (req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (payload.type !== 'INSERT' || !payload.record) {
    return new Response('Not an INSERT — ignored', { status: 200 });
  }

  const lead = payload.record;

  // Rows scoreAndSend itself syncs into `leads` carry source='webhook' —
  // ignore them or the leads-table DB webhook would loop.
  if (lead.source === 'webhook') {
    return new Response('CRM sync row — ignored', { status: 200 });
  }

  // Tenant ID: explicit URL path segment (/on-new-lead/{tenantId}) wins;
  // otherwise derived from the record's client_id (leads-table DB webhook —
  // one static webhook serves every tenant).
  const url = new URL(req.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const pathTenant = segments[segments.length - 1];
  const tenantId = (pathTenant && pathTenant !== 'on-new-lead')
    ? pathTenant
    : String(lead.client_id ?? '');

  if (!tenantId) {
    return new Response('Missing tenant_id (URL path or record.client_id)', { status: 400 });
  }

  const db = createClient(PLATFORM_URL, PLATFORM_SERVICE_KEY);

  // Per-tenant settings (send window, etc.) — defaults when unset.
  const { data: tenantRow } = await db
    .from('agent_tenants')
    .select('config')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  const settings = resolveSettings(tenantRow?.config);

  // Kill-switch: if the operator paused the "New Lead — Instant Reply" automation rule,
  // don't message and don't queue. The lead still lives in the CRM. A rule scoped to
  // THIS client (client_id = tenantId) wins; otherwise the global rule (client_id IS NULL)
  // applies as a fallback.
  const { data: outreachRules } = await db
    .from('automation_rules')
    .select('status, client_id')
    .eq('key', 'new_lead_outreach')
    .or(`client_id.eq.${tenantId},client_id.is.null`);
  const outreachRule = (outreachRules || []).find((r) => r.client_id === tenantId)
    ?? (outreachRules || []).find((r) => r.client_id === null);
  if (outreachRule && outreachRule.status !== 'active') {
    await db.from('ziro_events').insert({
      event_id: crypto.randomUUID(),
      tenant_id: tenantId,
      event_type: 'new_lead_skipped',
      agent_assigned: 'ZIRO_LEADS',
      input_summary: JSON.stringify({ lead_id: lead.id, reason: 'outreach_rule_paused' }),
      status: 'complete',
    });
    return new Response('AI outreach paused for tenant', { status: 200 });
  }

  if (isInWindow(settings)) {
    try {
      await scoreAndSend(lead, tenantId);
      await db.from('ziro_events').insert({
        event_id: crypto.randomUUID(),
        tenant_id: tenantId,
        event_type: 'new_lead_processed',
        agent_assigned: 'ZIRO_LEADS',
        input_summary: JSON.stringify(lead),
        status: 'complete',
      });
    } catch (err) {
      await db.from('ziro_events').insert({
        event_id: crypto.randomUUID(),
        tenant_id: tenantId,
        event_type: 'new_lead_processed',
        agent_assigned: 'ZIRO_LEADS',
        input_summary: JSON.stringify(lead),
        status: 'failed',
        error_message: String(err),
      });
      return new Response(String(err), { status: 500 });
    }
  } else {
    // Off-hours — queue for the next window open
    const sendAt = nextWindowOpenUTC(settings);
    await db.from('pending_leads').insert({
      tenant_id: tenantId,
      lead_id: String(lead.id ?? crypto.randomUUID()),
      lead_data: lead,
      send_at: sendAt,
    });
    await db.from('ziro_events').insert({
      event_id: crypto.randomUUID(),
      tenant_id: tenantId,
      event_type: 'new_lead_queued',
      agent_assigned: 'ZIRO_LEADS',
      input_summary: JSON.stringify({ lead_id: lead.id, send_at: sendAt }),
      status: 'complete',
    });
  }

  return new Response('OK', { status: 200 });
});
