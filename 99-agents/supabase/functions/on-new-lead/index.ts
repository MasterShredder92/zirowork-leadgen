import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { scoreAndSend } from '../_shared/score-and-send.ts';
import type { WebhookPayload } from '../_shared/types.ts';

const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET')!;
const PLATFORM_URL = Deno.env.get('SUPABASE_URL')!;
const PLATFORM_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Returns true if current Central time is between 9 AM and 9 PM (inclusive of 9, exclusive of 21)
function isInWindow(): boolean {
  const hour = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
    10
  );
  return hour >= 9 && hour < 21;
}

// Returns ISO UTC timestamp for the next 9 AM Central
function nextNineAMCentralUTC(): string {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  });

  const parts: Record<string, string> = {};
  fmt.formatToParts(now).forEach(({ type, value }) => { parts[type] = value; });
  const centralHour = parseInt(parts.hour);

  // If past 9 AM, advance to tomorrow
  const target = centralHour >= 9 ? new Date(now.getTime() + 86_400_000) : now;
  const tp: Record<string, string> = {};
  fmt.formatToParts(target).forEach(({ type, value }) => { tp[type] = value; });

  // Approximate DST: CDT (UTC-5) March–November = 14:00 UTC, CST (UTC-6) = 15:00 UTC
  const month = parseInt(tp.month);
  const utcHour = month >= 3 && month <= 11 ? 14 : 15;

  return `${tp.year}-${tp.month}-${tp.day}T${String(utcHour).padStart(2, '0')}:00:00.000Z`;
}

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

  if (isInWindow()) {
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
    // Off-hours — queue for 9 AM Central
    const sendAt = nextNineAMCentralUTC();
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
