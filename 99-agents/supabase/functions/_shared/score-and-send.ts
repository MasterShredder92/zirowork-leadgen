import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callClaude } from './claude.ts';
import { sendSMS, SMS_ENABLED } from './twilio.ts';
import { LEADS_SYSTEM_PROMPT, MESSAGING_SYSTEM_PROMPT } from './prompts.ts';
import type { LeadRecord, ScoringResult, TenantConfig } from './types.ts';

const PLATFORM_URL = Deno.env.get('SUPABASE_URL')!;
const PLATFORM_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function getPlatformClient() {
  return createClient(PLATFORM_URL, PLATFORM_SERVICE_KEY);
}

function getFirstName(lead: LeadRecord): string {
  if (lead.first_name) return lead.first_name;
  if (lead.name) return String(lead.name).split(' ')[0];
  return 'there';
}

function getPhone(lead: LeadRecord): string | null {
  return (lead.phone ?? lead.recipient_phone ?? null) as string | null;
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

  // TCPA/A2P gate: never text a lead without recorded SMS consent
  if (lead.sms_consent !== true) {
    await db.from('ziro_message_log').insert({
      tenant_id: tenantId,
      from_agent: 'ZIRO_MESSAGING',
      channel: 'sms',
      direction: 'outbound',
      recipient_phone: phone,
      recipient_name: getFirstName(lead),
      message_body: '[not sent — lead has no recorded SMS consent]',
      status: 'skipped_no_consent',
      sent_at: new Date().toISOString(),
      sms_enabled: SMS_ENABLED,
      requires_approval: false,
    });
    return;
  }

  // Score lead via ZIRO_LEADS
  const leadsUserMsg = [
    `Tenant: ${cfg.location_name}`,
    `Director: ${cfg.director_name}, ${cfg.director_title}`,
    '',
    'Lead data:',
    JSON.stringify(lead, null, 2),
  ].join('\n');

  const scoringRaw = await callClaude(LEADS_SYSTEM_PROMPT, leadsUserMsg);

  let scoring: ScoringResult;
  try {
    const match = scoringRaw.match(/\{[\s\S]*\}/);
    scoring = JSON.parse(match?.[0] ?? scoringRaw);
  } catch {
    throw new Error(`ZIRO_LEADS response not parseable: ${scoringRaw}`);
  }

  // Polish message via ZIRO_MESSAGING
  const finalMsg = await callClaude(MESSAGING_SYSTEM_PROMPT, scoring.message_draft);

  if (finalMsg.trim() === 'ESCALATE') {
    await db.from('ziro_messaging_escalations').insert({
      tenant_id: tenantId,
      contact_phone: phone,
      contact_name: getFirstName(lead),
      trigger_reason: 'unresolved_variable_in_draft',
      original_message: scoring.message_draft,
      ziro_response: finalMsg,
    });
    return;
  }

  // Send SMS
  await sendSMS(phone, finalMsg);

  // Sync lead into platform CRM so operators can see it in the Leads page
  await db.from('leads').insert({
    client_id: tenantId,
    student_name: [getFirstName(lead), lead.last_name].filter(Boolean).join(' '),
    parent_name: (lead.parent_name as string) ?? null,
    program: (lead.instrument as string) ?? 'Unknown',
    stage: 'new',
    source: 'webhook',
    phone: phone,
    email: (lead.email as string) ?? null,
    notes: [scoring.why, scoring.hook].filter(Boolean).join(' | '),
    priority: scoring.priority,
    sms_consent: lead.sms_consent === true,
    sms_consent_at: (lead.sms_consent_at as string) ?? null,
    utm: (lead.utm as object) ?? null,
    page_url: (lead.page_url as string) ?? null,
    created_at: new Date().toISOString(),
  }); // non-fatal — errors returned in {error} field, SMS already sent

  // Log to ziro_message_log
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
}
