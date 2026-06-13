// send-operator-reply — operator-composed outbound SMS (manual takeover + escalation forward).
// The browser CANNOT hold the OpenPhone secret, so the CRM calls this to ACTUALLY send.
// A logged ziro_message_log row must mean a real send happened (send first, log after) —
// the hollow-feature lesson: never write status='sent' for a text that never left.
//
// Callers:
//   06-conversations  → operator manual reply to a lead   (from_agent: 'OPERATOR')
//   07-escalations    → forward an escalation to the studio (from_agent: 'OPERATOR_FORWARD')
//
// Responses are ALWAYS HTTP 200 with { ok, error?, row? } so the browser's
// functions.invoke() gets a structured result it can show (opt-out, send failure, success).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendSMS } from '../_shared/openphone.ts';

const PLATFORM_URL = Deno.env.get('SUPABASE_URL')!;
const PLATFORM_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' });

  // deno-lint-ignore no-explicit-any
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: 'bad_json' });
  }

  const tenant_id = String(payload.tenant_id || '').trim();
  const phone = String(payload.phone || '').trim();
  const body = String(payload.body || '').trim();
  const name = payload.name ? String(payload.name) : null;
  const from_agent = String(payload.from_agent || 'OPERATOR');

  if (!tenant_id || !phone || !body) return json({ ok: false, error: 'missing_fields' });

  const db = createClient(PLATFORM_URL, PLATFORM_SERVICE_KEY);

  // Compliance gate (A2P/TCPA): never text a lead who replied STOP. Studio phones have no
  // leads row, so escalation forwards are naturally unaffected by this check.
  const { data: optedOut } = await db
    .from('leads')
    .select('id')
    .eq('phone', phone)
    .eq('client_id', tenant_id)
    .eq('opted_out', true)
    .limit(1);
  if (optedOut?.length) return json({ ok: false, error: 'opted_out' });

  // Send FIRST. If OpenPhone rejects, nothing is logged and the operator sees the failure.
  try {
    await sendSMS(phone, body);
  } catch (err) {
    return json({ ok: false, error: 'send_failed', detail: String(err) });
  }

  // Log only after a real send.
  const { data: row } = await db
    .from('ziro_message_log')
    .insert({
      tenant_id,
      channel: 'sms',
      direction: 'outbound',
      recipient_phone: phone,
      recipient_name: name,
      message_body: body,
      status: 'sent',
      sent_at: new Date().toISOString(),
      from_agent,
      requires_approval: false,
    })
    .select('id, direction, message_body, sent_at, from_agent')
    .single();

  // Best-effort: stamp last_contact_at so automated follow-up timing accounts for this manual
  // touch. No-op for studio forwards (no matching leads row).
  await db
    .from('leads')
    .update({ last_contact_at: new Date().toISOString() })
    .eq('phone', phone)
    .eq('client_id', tenant_id);

  return json({ ok: true, row: row || null });
});
