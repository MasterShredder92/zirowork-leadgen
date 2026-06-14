import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendSMS, SMS_ENABLED } from '../_shared/twilio.ts';
import { callClaude } from '../_shared/claude.ts';
import { MESSAGING_SYSTEM_PROMPT } from '../_shared/prompts.ts';
import { loadHistory } from '../_shared/conversation.ts';
import { resolveSettings, isInWindow, SETTINGS_DEFAULTS } from '../_shared/settings.ts';

const PLATFORM_URL = Deno.env.get('SUPABASE_URL')!;
const PLATFORM_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.headers.get('authorization') !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // The send window + cadence are now per-tenant (resolved inside the loop). The cron runs
  // hourly; leads whose tenant is currently off-hours are skipped individually.
  const db = createClient(PLATFORM_URL, PLATFORM_SERVICE_KEY);

  // Kill-switch: operator can pause the follow-up drip via the "No Reply — 24h Follow-up"
  // automation rule. The GLOBAL rule (client_id IS NULL) bails the whole run; per-client
  // rules are re-checked inside the loop below so one client's pause doesn't stop everyone.
  const { data: globalDripRule } = await db
    .from('automation_rules')
    .select('status')
    .eq('key', 'followup_drip')
    .is('client_id', null)
    .maybeSingle();
  if (globalDripRule && globalDripRule.status !== 'active') {
    return new Response(JSON.stringify({ processed: 0, failed: 0, skipped: 'followup_drip_paused' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Outer query uses default caps as a floor; precise per-tenant limits are applied per lead.
  const maxOffsetDays = Math.max(...SETTINGS_DEFAULTS.followupDayOffsets, 2);
  const { data: leads, error } = await db
    .from('leads')
    .select('*, agent_tenants!inner(config, name)')
    .eq('stage', 'new')
    .eq('followup_paused', false)
    .eq('opted_out', false)
    .eq('sms_consent', true)
    .lt('followup_count', SETTINGS_DEFAULTS.maxFollowups)
    // Only follow up leads we have ACTUALLY contacted. A null last_contact_at
    // means the initial outreach hasn't gone out yet (e.g. queued overnight in
    // pending_leads) — following up then would land before the first message.
    .not('last_contact_at', 'is', null)
    .lt('last_contact_at', new Date(Date.now() - SETTINGS_DEFAULTS.followupDayOffsets[0] * 24 * 60 * 60 * 1000).toISOString())
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

      // Per-client kill-switch: a followup_drip rule scoped to THIS client overrides
      // the global default. Paused → skip this lead's follow-up.
      const { data: clientDripRule } = await db
        .from('automation_rules')
        .select('status')
        .eq('key', 'followup_drip')
        .eq('client_id', lead.client_id)
        .maybeSingle();
      if (clientDripRule && clientDripRule.status !== 'active') continue;

      // Per-tenant gates the outer query can't express.
      const settings = resolveSettings(config);
      if (!isInWindow(settings)) continue;                          // off-hours for this tenant
      if (lead.followup_count >= settings.maxFollowups) continue;   // tenant cap
      const dueOffset = settings.followupDayOffsets[lead.followup_count];
      if (dueOffset == null) continue;                              // no more scheduled follow-ups
      if (Date.now() - new Date(lead.last_contact_at).getTime() < dueOffset * 86_400_000) continue; // not due yet

      const history = await loadHistory(db, lead.client_id, phone);

      const guidance =
        lead.followup_count === 0 ? 'gentle check-in'
        : lead.followup_count === 1 ? 'add value, mention a specific benefit'
        : 'final attempt, no pressure, leave door open';
      const dayLabel = `Day ${dueOffset} follow-up — ${guidance}`;

      const userMessage = `You are following up with a lead who hasn't responded.

Tenant: ${config.location_name || lead.agent_tenants?.name}
Director: ${config.director_name || 'the team'}
Lead name: ${lead.student_name || lead.first_name || 'there'}
Instrument: ${lead.program || 'music lessons'}
Follow-up number: ${lead.followup_count + 1} of 3
${dayLabel}

Conversation history:
${history || '(no prior messages logged)'}

Write a brief, natural follow-up SMS. Match Brooke's voice. No more than 2 sentences.`;

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
      console.error(`Failed lead ${lead.id}:`, err); // log only — nosemgrep: javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
      failed++;
    }
  }

  return new Response(JSON.stringify({ processed, failed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
