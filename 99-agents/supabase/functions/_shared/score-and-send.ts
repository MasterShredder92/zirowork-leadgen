import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callClaude } from './claude.ts';
import { sendSMS, SMS_ENABLED } from './openphone.ts';
import { LEADS_SYSTEM_PROMPT, MESSAGING_SYSTEM_PROMPT } from './prompts.ts';
import type { LeadRecord, ScoringResult, TenantConfig } from './types.ts';

const PLATFORM_URL = Deno.env.get('SUPABASE_URL')!;
const PLATFORM_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function getPlatformClient() {
  return createClient(PLATFORM_URL, PLATFORM_SERVICE_KEY);
}

function getFirstName(lead: LeadRecord): string {
  if (lead.first_name) return String(lead.first_name).split(' ')[0];
  if (lead.name) return String(lead.name).split(' ')[0];
  if (lead.parent_name) return String(lead.parent_name).split(' ')[0];
  if (lead.student_name) return String(lead.student_name).split(' ')[0];
  return 'there';
}

function getPhone(lead: LeadRecord): string | null {
  const raw = (lead.phone ?? lead.recipient_phone ?? null) as string | null;
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  return '+' + digits;
}

export async function scoreAndSend(lead: LeadRecord, tenantId: string): Promise<void> {
  const db = getPlatformClient();

  // Load tenant config
  const { data: tenant, error: tenantError } = await db
    .from('agent_tenants')
    .select('name, config')
    .eq('tenant_id', tenantId)
    .single();

  if (tenantError || !tenant) {
    throw new Error(`Tenant not found: ${tenantId} — ${tenantError?.message}`);
  }

  const cfg: TenantConfig = {
    director_name: tenant.config?.director_name ?? 'the team',
    director_title: tenant.config?.director_title ?? 'Director',
    location_name: tenant.config?.location_name ?? tenant.name,
    registration_link: tenant.config?.registration_link ?? '',
    monthly_price_standard: tenant.config?.monthly_price_standard ?? 160,
    monthly_price_military: tenant.config?.monthly_price_military ?? 140,
    openphone_number_id: tenant.config?.openphone_number_id,
  };

  const phone = getPhone(lead);
  if (!phone) throw new Error('Lead has no phone number');

  // TCPA/A2P: consent gates the TEXT, never the lead's existence — every lead
  // is still scored and synced to the operator CRM below.
  const consented = lead.sms_consent === true;

  // Score lead via ZIRO_LEADS (consent fields stripped — constants add no signal)
  const { sms_consent: _sc, sms_consent_at: _sca, ...leadForPrompt } = lead;
  const leadsUserMsg = [
    `Tenant: ${cfg.location_name}`,
    `Director: ${cfg.director_name}, ${cfg.director_title}`,
    '',
    'Lead data:',
    JSON.stringify(leadForPrompt, null, 2),
  ].join('\n');

  const scoringRaw = await callClaude(LEADS_SYSTEM_PROMPT, leadsUserMsg);

  let scoring: ScoringResult;
  try {
    const match = scoringRaw.match(/\{[\s\S]*\}/);
    scoring = JSON.parse(match?.[0] ?? scoringRaw);
  } catch {
    throw new Error(`ZIRO_LEADS response not parseable: ${scoringRaw}`);
  }

  // Sync lead into platform CRM — always, before the send.
  // Match on either the normalized phone OR raw digits so a lead stored
  // before normalization is found and updated rather than duplicated.
  const phoneDigits = phone.replace(/\D/g, '');
  const { data: existing } = await db
    .from('leads')
    .select('id')
    .eq('client_id', tenantId)
    .or(`phone.eq.${phone},phone.eq.${phoneDigits}`)
    .limit(1);

  if (existing?.length) {
    await db.from('leads').update({
      phone,  // normalize to E.164 if stored without country code
      notes: [scoring.why, scoring.hook].filter(Boolean).join(' | '),
      priority: scoring.priority,
    }).eq('id', existing[0].id);
  } else {
    await db.from('leads').insert({
      client_id: tenantId,
      student_name: (lead.student_name as string) ?? [getFirstName(lead), lead.last_name].filter(Boolean).join(' '),
      parent_name: (lead.parent_name as string) ?? null,
      program: (lead.program as string) ?? (lead.instrument as string) ?? 'Unknown',
      stage: 'new',
      source: 'webhook',
      phone,
      email: (lead.email as string) ?? null,
      notes: [scoring.why, scoring.hook].filter(Boolean).join(' | '),
      priority: scoring.priority,
      sms_consent: consented,
      sms_consent_at: (lead.sms_consent_at as string) ?? null,
      utm: (lead.utm as object) ?? null,
      page_url: (lead.page_url as string) ?? null,
      created_at: new Date().toISOString(),
    });
  }

  // Polish + send only with recorded consent
  let smsSent = false;
  let finalMsg = '';
  if (consented) {
    finalMsg = await callClaude(MESSAGING_SYSTEM_PROMPT, scoring.message_draft);
    if (finalMsg.trim() === 'ESCALATE') {
      await db.from('ziro_messaging_escalations').insert({
        tenant_id: tenantId,
        contact_phone: phone,
        contact_name: getFirstName(lead),
        trigger_reason: 'unresolved_variable_in_draft',
        original_message: scoring.message_draft,
        ziro_response: finalMsg,
      });
    } else {
      await sendSMS(phone, finalMsg);
      smsSent = true;
    }
  }

  // Log to ziro_message_log only when a real SMS went out — consumers
  // (conversations, reporting, Claude history) treat outbound rows as sent.
  if (smsSent) {
    await db.from('ziro_message_log').insert({
      tenant_id: tenantId,
      from_agent: 'ZIRO_MESSAGING',
      channel: 'sms',
      direction: 'outbound',
      recipient_phone: phone,
      recipient_name: getFirstName(lead),
      message_body: finalMsg,
      status: 'sent',
      sent_at: new Date().toISOString(),
      sms_enabled: SMS_ENABLED,
      requires_approval: false,
    });

    // Stamp last_contact_at so the follow-up drip is anchored to the ACTUAL
    // first outreach. Without this, last_contact_at stays null after the
    // initial send and send-followup fires a follow-up before/right after it.
    await db
      .from('leads')
      .update({ last_contact_at: new Date().toISOString() })
      .eq('client_id', tenantId)
      .eq('phone', phone);
  }
}
