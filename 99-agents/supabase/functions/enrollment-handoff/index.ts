import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendSMS } from '../_shared/twilio.ts';

const PLATFORM_URL = Deno.env.get('SUPABASE_URL')!;
const PLATFORM_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.headers.get('authorization') !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { enrollment_id, client_id } = await req.json();

  if (!enrollment_id || !client_id) {
    return new Response('Missing enrollment_id or client_id', { status: 400 });
  }

  const db = createClient(PLATFORM_URL, PLATFORM_SERVICE_KEY);

  const { data: enrollment } = await db
    .from('enrollments')
    .select('*')
    .eq('id', enrollment_id)
    .single();

  if (!enrollment) {
    return new Response('Enrollment not found', { status: 404 });
  }

  const { data: client } = await db
    .from('clients')
    .select('name, studio_phone')
    .eq('id', client_id)
    .single();

  let notified = false;

  if (client?.studio_phone) {
    const message =
      `New student enrolled at ${client.name}:\n` +
      `Student: ${enrollment.student_name}\n` +
      `Program: ${enrollment.program}\n` +
      `Rate: $${Math.round((enrollment.weekly_rate_cents || 0) / 100)}/week\n` +
      `Enrolled: ${new Date().toLocaleDateString()}\n` +
      `Ready to start — student will be in touch.`;

    await sendSMS(client.studio_phone, message);
    notified = true;
  }

  await db
    .from('enrollments')
    .update({ stage: 'enrolled', handoff_sent_at: new Date().toISOString() })
    .eq('id', enrollment_id)
    .catch(() => null);

  await db
    .from('leads')
    .update({ stage: 'enrolled' })
    .eq('client_id', client_id)
    .eq('student_name', enrollment.student_name)
    .catch(() => null);

  await db
    .from('ziro_events')
    .insert({
      tenant_id: client_id,
      event_type: 'enrollment_handoff',
      payload: {
        enrollment_id,
        student_name: enrollment.student_name,
        program: enrollment.program,
      },
      created_at: new Date().toISOString(),
    })
    .catch(() => null);

  return new Response(
    JSON.stringify({ success: true, notified }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
