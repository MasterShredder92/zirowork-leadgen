// billing — ZiroWork payment center on SQUARE (card-on-file + per-enrollment charge).
// Replaces the earlier Stripe scaffolding. Card data NEVER touches us: the portal tokenizes
// the card with Square's Web Payments SDK and we store only opaque Square IDs
// (square_customer_id / square_card_id on agent_tenants). The Square access token lives ONLY
// as a function secret. billing_events is RLS-locked (service role only) — all reads go
// through this function.
//
// Actions:
//   PORTAL (client user JWT, tenant-scoped via client_users):
//     'status'   → { configured, environment, application_id, location_id, card, fee, events }
//     'add-card' → store a Square card-on-file from a Web Payments SDK token (source_id)
//   OPERATOR (operator JWT, app_metadata.role === 'operator'):
//     'charge'   → charge a tenant's card-on-file the per-enrollment fee (idempotent)
//     'charges'  → list enrollment charges (to show charged/unpaid state in the CRM)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const SQUARE_ACCESS_TOKEN = Deno.env.get('SQUARE_ACCESS_TOKEN') ?? '';
const SQUARE_APPLICATION_ID = Deno.env.get('SQUARE_APPLICATION_ID') ?? '';
const SQUARE_LOCATION_ID = Deno.env.get('SQUARE_LOCATION_ID') ?? '';
const SQUARE_ENVIRONMENT = (Deno.env.get('SQUARE_ENVIRONMENT') ?? 'sandbox').toLowerCase();
const SQUARE_BASE = SQUARE_ENVIRONMENT === 'production'
  ? 'https://connect.squareup.com'
  : 'https://connect.squareupsandbox.com';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

// Plain-fetch Square client. Square-Version is intentionally omitted so the API uses the
// version pinned to the access token — these endpoints (customers/cards/payments) are stable.
// deno-lint-ignore no-explicit-any
async function square(path: string, body?: Record<string, unknown>, method: 'GET' | 'POST' = 'POST'): Promise<any> {
  const res = await fetch(`${SQUARE_BASE}/v2${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: method === 'POST' && body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const detail = data?.errors?.[0]?.detail || data?.errors?.[0]?.code || `square_error_${res.status}`;
    throw new Error(detail);
  }
  return data;
}

// Resolve the caller's Supabase user from their JWT. Returns the user object or null.
// deno-lint-ignore no-explicit-any
async function getUser(req: Request): Promise<any | null> {
  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!jwt) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'Authorization': `Bearer ${jwt}`, 'apikey': SUPABASE_ANON_KEY },
  });
  if (!res.ok) return null;
  const user = await res.json();
  return user?.id ? user : null;
}

// deno-lint-ignore no-explicit-any
async function getTenant(db: any, tenantId: string) {
  const { data } = await db
    .from('agent_tenants')
    .select('name, square_customer_id, square_card_id, per_enrollment_fee_cents')
    .eq('tenant_id', tenantId)
    .single();
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // deno-lint-ignore no-explicit-any
  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }

  const action = String(body.action || '');
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // ── OPERATOR ACTIONS — require app_metadata.role === 'operator' ──
    if (action === 'charge' || action === 'charges') {
      const user = await getUser(req);
      if (!user) return json({ error: 'unauthorized' }, 401);
      if (user.app_metadata?.role !== 'operator') return json({ error: 'not_operator' }, 403);

      if (action === 'charges') {
        // Surface which enrollments are already charged. Operator sees all tenants.
        const { data: events } = await db
          .from('billing_events')
          .select('id, tenant_id, enrollment_id, amount_cents, status, created_at')
          .eq('type', 'enrollment_charge')
          .order('created_at', { ascending: false })
          .limit(500);
        return json({ events: events || [] });
      }

      // action === 'charge'
      const tenant_id = String(body.tenant_id || '');
      const enrollment_id = String(body.enrollment_id || '');
      if (!tenant_id || !enrollment_id) return json({ error: 'missing_fields' }, 400);

      const tenant = await getTenant(db, tenant_id);
      if (!tenant) return json({ error: 'tenant_not_found' }, 404);
      const fee = tenant.per_enrollment_fee_cents;

      // Idempotency guard #1 — never double-charge an enrollment.
      const { data: existing } = await db
        .from('billing_events')
        .select('id, status')
        .eq('enrollment_id', enrollment_id)
        .eq('type', 'enrollment_charge')
        .in('status', ['succeeded', 'pending'])
        .limit(1);
      if (existing?.length) {
        return json({ ok: false, already_charged: true, status: existing[0].status });
      }

      const description = body.description || `Enrollment fee — ${tenant.name || tenant_id}`;
      const skipReason = !SQUARE_ACCESS_TOKEN ? 'square_not_configured'
        : (!fee || fee <= 0) ? 'no_fee_configured'
        : (!tenant.square_customer_id || !tenant.square_card_id) ? 'no_card_on_file'
        : null;

      if (skipReason) {
        await db.from('billing_events').insert({
          tenant_id, enrollment_id, type: 'enrollment_charge',
          amount_cents: fee || 0, status: 'skipped',
          description: `${description} (${skipReason})`,
        });
        return json({ ok: false, skipped: true, reason: skipReason });
      }

      try {
        // Idempotency guard #2 — deterministic key so a retry can't double-charge at Square.
        const payment = await square('/payments', {
          source_id: tenant.square_card_id,
          customer_id: tenant.square_customer_id,
          amount_money: { amount: fee, currency: 'USD' },
          location_id: SQUARE_LOCATION_ID || undefined,
          idempotency_key: `chg-${enrollment_id}`,
          note: description,
        });
        const sqStatus = payment?.payment?.status;
        const status = sqStatus === 'COMPLETED' || sqStatus === 'APPROVED' ? 'succeeded' : 'pending';
        await db.from('billing_events').insert({
          tenant_id, enrollment_id, type: 'enrollment_charge',
          amount_cents: fee, square_payment_id: payment?.payment?.id,
          status, description,
        });
        return json({ ok: status === 'succeeded', status, payment_id: payment?.payment?.id });
      } catch (err) {
        const msg = String(err instanceof Error ? err.message : err);
        await db.from('billing_events').insert({
          tenant_id, enrollment_id, type: 'enrollment_charge',
          amount_cents: fee, status: 'failed', description: `${description} — ${msg}`,
        });
        return json({ ok: false, status: 'failed', error: msg }, 402);
      }
    }

    // ── PORTAL ACTIONS — require a client user JWT linked to the tenant ──
    const tenantId = String(body.tenant_id || '');
    if (!tenantId) return json({ error: 'missing_tenant_id' }, 400);

    const user = await getUser(req);
    if (!user) return json({ error: 'unauthorized' }, 401);
    const { data: cu } = await db
      .from('client_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (!cu) return json({ error: 'tenant_mismatch' }, 403);

    const tenant = await getTenant(db, tenantId);
    if (!tenant) return json({ error: 'tenant_not_found' }, 404);

    if (action === 'status') {
      let card = null;
      if (SQUARE_ACCESS_TOKEN && tenant.square_card_id) {
        try {
          const c = await square(`/cards/${tenant.square_card_id}`, undefined, 'GET');
          const cd = c?.card;
          if (cd) card = { brand: cd.card_brand, last4: cd.last_4, exp_month: cd.exp_month, exp_year: cd.exp_year };
        } catch { card = null; }
      }
      const { data: events } = await db
        .from('billing_events')
        .select('id, type, amount_cents, currency, status, description, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(20);
      return json({
        configured: !!SQUARE_ACCESS_TOKEN,
        environment: SQUARE_ENVIRONMENT,
        application_id: SQUARE_APPLICATION_ID || null,
        location_id: SQUARE_LOCATION_ID || null,
        card,
        per_enrollment_fee_cents: tenant.per_enrollment_fee_cents ?? null,
        events: events || [],
      });
    }

    if (action === 'add-card') {
      if (!SQUARE_ACCESS_TOKEN) return json({ error: 'square_not_configured' }, 503);
      const sourceId = String(body.source_id || ''); // token from Web Payments SDK tokenize()
      if (!sourceId) return json({ error: 'missing_source_id' }, 400);

      let customerId = tenant.square_customer_id;
      if (!customerId) {
        const c = await square('/customers', { company_name: tenant.name || tenantId, reference_id: tenantId });
        customerId = c?.customer?.id;
        await db.from('agent_tenants').update({ square_customer_id: customerId }).eq('tenant_id', tenantId);
      }
      const created = await square('/cards', {
        idempotency_key: crypto.randomUUID(),
        source_id: sourceId,
        card: { customer_id: customerId },
      });
      const cd = created?.card;
      if (!cd?.id) return json({ error: 'card_create_failed' }, 502);
      await db.from('agent_tenants').update({ square_card_id: cd.id }).eq('tenant_id', tenantId);
      return json({ ok: true, card: { brand: cd.card_brand, last4: cd.last_4, exp_month: cd.exp_month, exp_year: cd.exp_year } });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (err) {
    return json({ error: String(err instanceof Error ? err.message : err) }, 500);
  }
});
