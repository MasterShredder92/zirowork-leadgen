import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';
import { sendSMS } from '../_shared/twilio.ts';
import { callClaude } from '../_shared/claude.ts';
import { MESSAGING_SYSTEM_PROMPT } from '../_shared/prompts.ts';
import { loadHistory } from '../_shared/conversation.ts';

const PLATFORM_URL = Deno.env.get('SUPABASE_URL')!;
const PLATFORM_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function validateTwilioSignature(req: Request, authToken: string): Promise<boolean> {
  const signature = req.headers.get('x-twilio-signature');
  if (!signature) return false;

  const url = req.url;
  const form = await req.clone().formData();

  // Sort params alphabetically and concatenate to URL
  const params = [...form.entries()].sort(([a], [b]) => a.localeCompare(b));
  let str = url;
  for (const [k, v] of params) str += k + v;

  // HMAC-SHA1
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(str));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));

  return expected === signature;
}

const TWIML_OK = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

Deno.serve(async (req) => {
  if (!await validateTwilioSignature(req, Deno.env.get('TWILIO_AUTH_TOKEN')!)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const form = await req.formData();
    const fromPhone = form.get('From') as string;
    const toPhone = form.get('To') as string;
    const body = form.get('Body') as string;

    const db = createClient(PLATFORM_URL, PLATFORM_SERVICE_KEY);

    // Tenant lookup by twilio_phone_number in config
    const { data: tenant } = await db
      .from('agent_tenants')
      .select('tenant_id, name, config')
      .filter("config->>'twilio_phone_number'", 'eq', toPhone)
      .maybeSingle();

    if (!tenant) {
      return new Response(TWIML_OK, { status: 200, headers: { 'Content-Type': 'text/xml' } });
    }

    const tenantId: string = tenant.tenant_id;

    // Log inbound message
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

    // Opt-out check
    const lowerBody = body.toLowerCase();
    if (lowerBody.includes('stop') || lowerBody.includes('unsubscribe') || lowerBody.includes('quit')) {
      await db
        .from('leads')
        .update({ opted_out: true })
        .eq('phone', fromPhone)
        .eq('client_id', tenantId);
      return new Response(TWIML_OK, { status: 200, headers: { 'Content-Type': 'text/xml' } });
    }

    // Pause follow-up sequences
    try {
      await db
        .from('leads')
        .update({ followup_paused: true })
        .eq('phone', fromPhone)
        .eq('client_id', tenantId);
    } catch (_) {
      // non-fatal
    }

    // Load conversation history
    const history = await loadHistory(db, tenantId, fromPhone);

    // Build user message for Claude
    const userMessage = `Conversation history:\n${history}\n\nNew reply from lead: ${body}\n\nRespond to this reply in Andrea's voice. Reply with only ESCALATE (nothing else) if: the lead asks about pricing/payment/contracts, asks to speak to a human, or you are unsure how to respond.`;

    // Call Claude
    const response = await callClaude(MESSAGING_SYSTEM_PROMPT, userMessage);
    const responseText = response.trim();

    // Escalate if needed
    if (responseText === 'ESCALATE') {
      await db.from('ziro_messaging_escalations').insert({
        tenant_id: tenantId,
        contact_phone: fromPhone,
        contact_name: fromPhone,
        trigger_reason: 'lead_reply',
        original_message: body,
        ziro_response: responseText,
      });
      return new Response(TWIML_OK, { status: 200, headers: { 'Content-Type': 'text/xml' } });
    }

    // Send SMS reply
    await sendSMS(fromPhone, responseText);

    // Log outbound message
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

    return new Response(TWIML_OK, { status: 200, headers: { 'Content-Type': 'text/xml' } });
  } catch (err) {
    return new Response(`Error: ${String(err)}`, { status: 500 });
  }
});
