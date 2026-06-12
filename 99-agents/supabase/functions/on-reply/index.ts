import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendSMS } from '../_shared/openphone.ts';
import { callClaude } from '../_shared/claude.ts';
import { MESSAGING_SYSTEM_PROMPT } from '../_shared/prompts.ts';
import { loadHistory } from '../_shared/conversation.ts';

const PLATFORM_URL = Deno.env.get('SUPABASE_URL')!;
const PLATFORM_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// deno-lint-ignore no-explicit-any
async function logOutbound(db: any, tenantId: string, phone: string, body: string): Promise<void> {
  await db.from('ziro_message_log').insert({
    tenant_id: tenantId,
    from_agent: 'ZIRO_MESSAGING',
    channel: 'sms',
    direction: 'outbound',
    recipient_phone: phone,
    message_body: body,
    status: 'sent',
    sent_at: new Date().toISOString(),
  });
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();

    if (payload.type !== 'message.received') {
      return new Response('OK', { status: 200 });
    }

    const msg = payload.data.object;
    const fromPhone: string = msg.from;
    const phoneNumberId: string = msg.phoneNumberId;
    const body: string = msg.body;

    const db = createClient(PLATFORM_URL, PLATFORM_SERVICE_KEY);

    const { data: tenant } = await db
      .from('agent_tenants')
      .select('tenant_id, name, config')
      .filter("config->>'openphone_number_id'", 'eq', phoneNumberId)
      .maybeSingle();

    if (!tenant) {
      return new Response('OK', { status: 200 });
    }

    const tenantId: string = tenant.tenant_id;

    await db.from('ziro_message_log').insert({
      tenant_id: tenantId,
      from_agent: 'HUMAN',
      channel: 'sms',
      direction: 'inbound',
      recipient_phone: fromPhone,
      message_body: body,
      status: 'received',
      sent_at: new Date().toISOString(),
    });

    const norm = body.trim().toLowerCase().replace(/[.!?]+$/, '');
    const OPT_OUT_WORDS = ['stop', 'stopall', 'stop all', 'unsubscribe', 'cancel', 'end', 'quit'];
    const OPT_IN_WORDS = ['start', 'unstop'];
    const HELP_WORDS = ['help', 'info'];

    if (OPT_OUT_WORDS.includes(norm) || /\b(stop|unsubscribe)\b/.test(norm)) {
      await db
        .from('leads')
        .update({ opted_out: true, followup_paused: true })
        .eq('phone', fromPhone)
        .eq('client_id', tenantId);
      const confirmMsg = 'You have successfully been unsubscribed. You will not receive any more messages from this number. Reply START to resubscribe.';
      await sendSMS(fromPhone, confirmMsg);
      await logOutbound(db, tenantId, fromPhone, confirmMsg);
      return new Response('OK', { status: 200 });
    }

    if (OPT_IN_WORDS.includes(norm)) {
      await db
        .from('leads')
        .update({ opted_out: false, followup_paused: false, sms_consent: true, sms_consent_at: new Date().toISOString() })
        .eq('phone', fromPhone)
        .eq('client_id', tenantId);
      const optInMsg = `${tenant.name}: You're now opted in to receive automated messages about your lesson inquiry. Msg frequency varies, up to 8 msgs per inquiry. Msg & data rates may apply. Reply HELP for help or STOP to cancel anytime.`;
      await sendSMS(fromPhone, optInMsg);
      await logOutbound(db, tenantId, fromPhone, optInMsg);
      return new Response('OK', { status: 200 });
    }

    if (HELP_WORDS.includes(norm)) {
      const helpMsg = `ZiroWork on behalf of ${tenant.name}: You're receiving messages about your lesson inquiry. For help, email hello@zirowork.com. Msg frequency varies. Msg & data rates may apply. Reply STOP to cancel.`;
      await sendSMS(fromPhone, helpMsg);
      await logOutbound(db, tenantId, fromPhone, helpMsg);
      return new Response('OK', { status: 200 });
    }

    const { data: optedOut } = await db
      .from('leads')
      .select('id')
      .eq('phone', fromPhone)
      .eq('client_id', tenantId)
      .eq('opted_out', true)
      .limit(1);
    if (optedOut?.length) {
      return new Response('OK', { status: 200 });
    }

    try {
      await db
        .from('leads')
        .update({ followup_paused: true })
        .eq('phone', fromPhone)
        .eq('client_id', tenantId);
    } catch (_) {
      // non-fatal
    }

    const history = await loadHistory(db, tenantId, fromPhone);
    const userMessage = `Conversation history:\n${history}\n\nNew reply from lead: ${body}\n\nRespond to this reply in Brooke's voice. Reply with only ESCALATE (nothing else) if: the lead asks about pricing/payment/contracts, asks to speak to a human, or you are unsure how to respond.`;

    const response = await callClaude(MESSAGING_SYSTEM_PROMPT, userMessage);
    const responseText = response.trim();

    if (responseText === 'ESCALATE') {
      await db.from('ziro_messaging_escalations').insert({
        tenant_id: tenantId,
        contact_phone: fromPhone,
        contact_name: fromPhone,
        trigger_reason: 'lead_reply',
        original_message: body,
        ziro_response: responseText,
      });
      return new Response('OK', { status: 200 });
    }

    await sendSMS(fromPhone, responseText);

    await db.from('ziro_message_log').insert({
      tenant_id: tenantId,
      from_agent: 'ZIRO_MESSAGING',
      channel: 'sms',
      direction: 'outbound',
      recipient_phone: fromPhone,
      message_body: responseText,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return new Response('OK', { status: 200 });
  } catch (err) {
    return new Response(`Error: ${String(err)}`, { status: 500 });
  }
});
