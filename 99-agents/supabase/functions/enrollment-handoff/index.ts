// enrollment-handoff — the studio notification step of an enrollment.
// When a student confirms (schools/pages/confirm.jsx), the browser writes the
// enrollment row itself (anon key, RLS-allowed). This function does the one thing
// the browser cannot: text the school "new student enrolled" via Twilio, and log
// the handoff to ziro_events. Public endpoint (verify_jwt=false) — uses the
// service role internally, like complete-onboarding / scrape-school.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendSMS } from '../_shared/openphone.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let body: { enrollment_id?: string; client_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }

  const { enrollment_id, client_id } = body;
  if (!enrollment_id || !client_id) return json({ error: 'missing_fields' }, 400);

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: enrollment } = await db
    .from('enrollments')
    .select('*')
    .eq('id', enrollment_id)
    .single();

  if (!enrollment) return json({ error: 'enrollment_not_found' }, 404);

  const { data: client } = await db
    .from('clients')
    .select('name, studio_phone')
    .eq('id', client_id)
    .single();

  // Mark the enrollment handed off using the columns that actually exist
  // (outcome / handed_off_at). Idempotent with the confirm page.
  await db
    .from('enrollments')
    .update({ outcome: 'enrolled', handed_off_at: new Date().toISOString() })
    .eq('id', enrollment_id);

  // Text the school. This is the whole point of the function. A failure here is
  // recorded loudly to ziro_events below and returned as a non-200 — never silent.
  let notified = false;
  let smsError: string | null = null;

  if (client?.studio_phone) {
    const message =
      `New student enrolled at ${client.name}:\n` +
      `Student: ${enrollment.student_name}\n` +
      `Program: ${enrollment.program}\n` +
      `Rate: $${Math.round((enrollment.weekly_rate_cents || 0) / 100)}/week\n` +
      `Enrolled: ${new Date().toLocaleDateString()}\n` +
      `Ready to start — student will be in touch.`;
    try {
      await sendSMS(client.studio_phone, message);
      notified = true;
    } catch (e) {
      smsError = e instanceof Error ? e.message : String(e);
    }
  } else {
    smsError = 'no_studio_phone';
  }

  await db.from('ziro_events').insert({
    event_id: crypto.randomUUID(),
    tenant_id: client_id,
    event_type: 'enrollment_handoff',
    agent_assigned: 'ZIRO_ENROLL',
    input_summary: `${enrollment.student_name} → ${client?.name || client_id} (${enrollment.program})`,
    output_summary: notified ? 'studio notified by SMS' : `not notified: ${smsError}`,
    status: notified ? 'complete' : 'failed',
    error_message: smsError,
  });

  if (!notified) return json({ success: false, notified, error: smsError }, 502);
  return json({ success: true, notified });
});
