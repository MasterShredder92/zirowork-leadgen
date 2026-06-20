import type { Client, AgentTenant, IntegrationRow } from "./types";

export function deriveIntegrations(clients: Client[], tenants: AgentTenant[]): IntegrationRow[] {
  const tenantByClient: Record<string, AgentTenant> = {};
  (tenants || []).forEach((t) => { if (t.tenant_id) tenantByClient[t.tenant_id] = t; });
  const rows: IntegrationRow[] = [];
  (clients || []).forEach((c) => {
    const t = tenantByClient[c.id] || ({} as AgentTenant);
    const name = c.name || c.school_name || "—";
    const phoneId = t.config && t.config.openphone_number_id;
    const phoneOk = typeof phoneId === "string" && phoneId.length > 0;
    rows.push({ client_id: c.id, client_name: name, service: "openphone", label: "OpenPhone / SMS", status: phoneOk ? "connected" : "missing", detail: phoneOk ? "Number set" : "No OpenPhone number set" });
    const hasCustomer = !!t.square_customer_id;
    const hasCard = !!t.square_card_id;
    const fee = t.per_enrollment_fee_cents ?? 0;       // null-safe; legacy treated missing fee as 0
    const hasFee = fee > 0;
    let sqStatus: string, sqDetail: string;
    if (hasCustomer && hasCard && hasFee) { sqStatus = "connected"; sqDetail = `Card on file · $${(fee / 100).toFixed(2)}/enrollment`; }
    else if (hasCustomer) { sqStatus = "incomplete"; sqDetail = !hasCard ? "Customer created, no card on file" : "No enrollment fee set"; }
    else { sqStatus = "missing"; sqDetail = "No Square customer"; }
    rows.push({ client_id: c.id, client_name: name, service: "square", label: "Square / Billing", status: sqStatus, detail: sqDetail });
    const hasWebhook = typeof c.lead_form_webhook === "string" && c.lead_form_webhook.length > 0;
    const hasKey = typeof t.intake_api_key === "string" && t.intake_api_key.length > 0;
    let lwStatus: string, lwDetail: string;
    if (hasWebhook && hasKey) { lwStatus = "connected"; lwDetail = "Webhook + API key set"; }
    else if (hasWebhook) { lwStatus = "incomplete"; lwDetail = "Webhook set, no intake API key"; }
    else { lwStatus = "missing"; lwDetail = "No lead webhook set"; }
    rows.push({ client_id: c.id, client_name: name, service: "lead_webhook", label: "Lead Webhook", status: lwStatus, detail: lwDetail });
  });
  return rows;
}
