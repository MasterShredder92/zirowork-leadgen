// billing — ZiroWork payment center (Stripe card-on-file, charge-per-enrollment).
// ⚠️ UNTESTED SCAFFOLDING: built before STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY exist as
// function secrets — nothing here has run against live Stripe or live data. Requires migration
// 016_create_billing_events.sql. Portal actions ('status' | 'setup-intent' | 'confirm-pm')
// authenticate the logged-in client user (JWT → client_users → tenant). 'charge-handoff' is
// internal-only (x-service-key = service role key) and is NOT yet wired to enrollment-handoff —
// call it when an enrollments row gets handed_off_at set.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const STRIPE_PUBLISHABLE_KEY = Deno.env.get('STRIPE_PUBLISHABLE_KEY') ?? '';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-service-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

// Plain-fetch Stripe client — form-encoded bodies, no SDK.
async function stripe(
  path: string,
  params?: Record<string, string>,
  method: 'GET' | 'POST' = 'POST',
  // deno-lint-ignore no-explicit-any
): Promise<any> {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: method === 'POST' && params ? new URLSearchParams(params).toString() : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `stripe_error_${res.status}`);
  return data;
}

// Verify the caller's user JWT against Supabase auth, then confirm a client_users row
// links that user to the requested tenant. Returns an error string, or null if OK.
// deno-lint-ignore no-explicit-any
async function authTenant(req: Request, tenantId: string, db: any): Promise<string | null> {
  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!jwt) return 'missing_authorization';
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'Authorization': `Bearer ${jwt}`, 'apikey': SUPABASE_ANON_KEY },
  });
  if (!res.ok) return 'invalid_token';
  const user = await res.json();
  if (!user?.id) return 'invalid_token';
  const { data: cu } = await db
    .from('client_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (!cu) return 'tenant_mismatch';
  return null;
}

// deno-lint-ignore no-explicit-any
async function getTenant(db: any, tenantId: string) {
  const { data } = await db
    .from('agent_tenants')
    .select('name, stripe_customer_id, stripe_default_pm, per_enrollment_fee_cents')
    .eq('tenant_id', tenantId)
    .single();
  return data;
}

// deno-lint-ignore no-explicit-any
async function logEvent(db: any, row: Record<string, unknown>) {
  await db.from('billing_events').insert(row);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // deno-lint-ignore no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }

  const action = String(body.action || '');
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // ── INTERNAL: charge the school when an enrolled student is handed off ──
    if (action === 'charge-handoff') {
      if (req.headers.get('x-service-key') !== SUPABASE_SERVICE_ROLE_KEY) {
        return json({ error: 'unauthorized' }, 401);
      }
      const { tenant_id, enrollment_id } = body;
      if (!tenant_id || !enrollment_id) return json({ error: 'missing_fields' }, 400);

      const tenant = await getTenant(db, tenant_id);
      if (!tenant) return json({ error: 'tenant_not_found' }, 404);

      const fee = tenant.per_enrollment_fee_cents;
      const description = body.description || `Enrollment handoff — ${tenant.name || tenant_id}`;

      const skipReason = !STRIPE_SECRET_KEY ? 'stripe_not_configured'
        : (!fee || fee <= 0) ? 'no_fee_configured'
        : (!tenant.stripe_customer_id || !tenant.stripe_default_pm) ? 'no_card_on_file'
        : null;

      if (skipReason) {
        await logEvent(db, {
          tenant_id, enrollment_id,
          type: 'enrollment_charge',
          amount_cents: fee || 0,
          status: 'skipped',
          description: `${description} (${skipReason})`,
        });
        return json({ charged: false, skipped: true, reason: skipReason });
      }

      try {
        const pi = await stripe('/payment_intents', {
          amount: String(fee),
          currency: 'usd',
          customer: tenant.stripe_customer_id,
          payment_method: tenant.stripe_default_pm,
          off_session: 'true',
          confirm: 'true',
          description,
          'metadata[tenant_id]': tenant_id,
          'metadata[enrollment_id]': enrollment_id,
        });
        const status = pi.status === 'succeeded' ? 'succeeded' : 'pending';
        await logEvent(db, {
          tenant_id, enrollment_id,
          type: 'enrollment_charge',
          amount_cents: fee,
          stripe_payment_intent_id: pi.id,
          status,
          description,
        });
        return json({ charged: status === 'succeeded', status, payment_intent: pi.id });
      } catch (err) {
        await logEvent(db, {
          tenant_id, enrollment_id,
          type: 'enrollment_charge',
          amount_cents: fee,
          status: 'failed',
          description: `${description} — ${String(err instanceof Error ? err.message : err)}`,
        });
        return json({ charged: false, status: 'failed', error: String(err instanceof Error ? err.message : err) }, 402);
      }
    }

    // ── PORTAL ACTIONS: require user JWT linked to the tenant ──
    const tenantId = String(body.tenant_id || '');
    if (!tenantId) return json({ error: 'missing_tenant_id' }, 400);
    const authErr = await authTenant(req, tenantId, db);
    if (authErr) return json({ error: authErr }, 401);

    const tenant = await getTenant(db, tenantId);
    if (!tenant) return json({ error: 'tenant_not_found' }, 404);

    if (action === 'status') {
      const configured = !!STRIPE_SECRET_KEY;
      let card = null;
      if (configured && tenant.stripe_customer_id) {
        try {
          const customer = await stripe(`/customers/${tenant.stripe_customer_id}`, undefined, 'GET');
          const pmId = customer?.invoice_settings?.default_payment_method || tenant.stripe_default_pm;
          if (pmId) {
            const pm = await stripe(`/payment_methods/${pmId}`, undefined, 'GET');
            if (pm?.card) {
              card = { brand: pm.card.brand, last4: pm.card.last4, exp_month: pm.card.exp_month, exp_year: pm.card.exp_year };
            }
          }
        } catch { card = null; }
      }
      const { data: events } = await db
        .from('billing_events')
        .select('id, type, amount_cents, currency, status, description, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(20);
      return json({
        configured,
        publishable_key: STRIPE_PUBLISHABLE_KEY || null,
        card,
        per_enrollment_fee_cents: tenant.per_enrollment_fee_cents ?? null,
        events: events || [],
      });
    }

    if (action === 'setup-intent') {
      if (!STRIPE_SECRET_KEY) return json({ error: 'stripe_not_configured' }, 503);
      let customerId = tenant.stripe_customer_id;
      if (!customerId) {
        const customer = await stripe('/customers', {
          name: tenant.name || tenantId,
          'metadata[tenant_id]': tenantId,
        });
        customerId = customer.id;
        await db.from('agent_tenants').update({ stripe_customer_id: customerId }).eq('tenant_id', tenantId);
      }
      const si = await stripe('/setup_intents', {
        customer: customerId,
        usage: 'off_session',
      });
      return json({ client_secret: si.client_secret, publishable_key: STRIPE_PUBLISHABLE_KEY || null });
    }

    if (action === 'confirm-pm') {
      if (!STRIPE_SECRET_KEY) return json({ error: 'stripe_not_configured' }, 503);
      const pmId = String(body.payment_method || '');
      if (!pmId) return json({ error: 'missing_payment_method' }, 400);
      if (!tenant.stripe_customer_id) return json({ error: 'no_stripe_customer' }, 400);
      // confirmCardSetup already attached the PM to the customer; make it the default.
      await stripe(`/customers/${tenant.stripe_customer_id}`, {
        'invoice_settings[default_payment_method]': pmId,
      });
      await db.from('agent_tenants').update({ stripe_default_pm: pmId }).eq('tenant_id', tenantId);
      return json({ ok: true });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (err) {
    return json({ error: String(err instanceof Error ? err.message : err) }, 500);
  }
});
