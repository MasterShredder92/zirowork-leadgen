import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendSMS, SMS_ENABLED } from '../_shared/twilio.ts';
import { callClaude } from '../_shared/claude.ts';
import { MESSAGING_SYSTEM_PROMPT } from '../_shared/prompts.ts';
import { loadHistory } from '../_shared/conversation.ts';

const PLATFORM_URL = Deno.env.get('SUPABASE_URL')!;
const PLATFORM_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.headers.get('authorization') !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const db = createClient(PLATFORM_URL, PLATFORM_SERVICE_KEY);

  const { data: leads, error } = await db
    .from('leads')
    .select('*, agent_tenants!inner(config, name)')
    .eq('stage', 'new')
    .eq('followup_paused', false)
    .eq('opted_out', false)
    .lt('followup_count', 3)
    .or(
      'last_contact_at.is.null,last_contact_at.lt.' +
        new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    )
    .limit(50);

  if (error) {
    return new Response(`DB error: ${error.message}`, { status: 500 });
  }

  if (!leads || leads.length === 0) {
    return new Response(JSON.stringify({ processed: 0, failed: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let processed = 0;
  let failed = 0;

  for (const lead of leads) {
    try {
      const config = lead.agent_tenants?.config || {};
      const phone: string = lead.phone ?? lead.recipient_phone;

      if (!phone) {
        throw new Error(`Lead ${lead.id} has no phone number`);
      }

      const history = await loadHistory(db, lead.client_id, phone);

      const dayLabel =
        lead.followup_count === 0
          ? 'Day 2 follow-up — gentle check-in'
          : lead.followup_count === 1
          ? 'Day 4 follow-up — add value, mention a specific benefit'
          : 'Day 7 follow-up — final attempt, no pressure, leave door open';

      const userMessage = `You are following up with a lead who hasn't responded.

Tenant: ${config.location_name || lead.agent_tenants?.name}
Director: ${config.director_name || 'the team'}
Lead name: ${lead.student_name || lead.first_name || 'there'}
Instrument: ${lead.program || 'music lessons'}
Follow-up number: ${lead.followup_count + 1} of 3
${dayLabel}

Conversation history:
${history || '(no prior messages logged)'}

Write a brief, natural follow-up SMS. Match Andrea's voice. No more than 2 sentences.`;

      const message = await callClaude(MESSAGING_SYSTEM_PROMPT, userMessage);

      await sendSMS(phone, message);

      await db.from('ziro_message_log').insert({
        tenant_id: lead.client_id,
        from_agent: 'ZIRO_MESSAGING',
        channel: 'sms',
        direction: 'outbound',
        recipient_phone: phone,
        recipient_name: lead.student_name || lead.first_name,
        message_body: message,
        status: 'sent',
        sent_at: new Date().toISOString(),
        sms_enabled: SMS_ENABLED,
        requires_approval: false,
      });

      await db
        .from('leads')
        .update({
          followup_count: lead.followup_count + 1,
          last_contact_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      processed++;
    } catch (err) {
      console.error(`Failed lead ${lead.id}:`, err);
      failed++;
    }
  }

  return new Response(JSON.stringify({ processed, failed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
