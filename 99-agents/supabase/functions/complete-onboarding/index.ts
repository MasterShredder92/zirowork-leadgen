// complete-onboarding — self-serve onboarding's privileged step.
// The browser (onboard.html) creates the clients / agent_tenants / client_pages
// rows itself (anon key, RLS-allowed). This function does ONLY the two things the
// browser cannot do safely: create the school's portal auth user (email
// pre-confirmed, for INSTANT access) and insert the client_users link the
// dashboard login requires. Public endpoint (verify_jwt=false) — uses the
// service role internally, like scrape-school / intake-form.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let body: { email?: string; password?: string; tenant_id?: string; full_name?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }

  const { email, password, tenant_id, full_name } = body;
  if (!email || !password || !tenant_id) return json({ error: 'missing_fields' }, 400);
  if (password.length < 8) return json({ error: 'weak_password' }, 400);

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1) Create the portal login. email_confirm:true => session works immediately.
  const { data: created, error: createErr } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name || null, tenant_id },
  });

  if (createErr) {
    const msg = (createErr.message || '').toLowerCase();
    if (msg.includes('already') || msg.includes('registered') || msg.includes('exist')) {
      return json({ error: 'email_exists' }, 409);
    }
    return json({ error: 'create_user_failed', detail: createErr.message }, 500);
  }

  const userId = created.user?.id;
  if (!userId) return json({ error: 'no_user_id' }, 500);

  // 2) Link the user to their tenant so the dashboard login resolves.
  const { error: linkErr } = await db
    .from('client_users')
    .insert({ user_id: userId, tenant_id });

  if (linkErr) {
    return json({ error: 'link_failed', detail: linkErr.message }, 500);
  }

  return json({ success: true, user_id: userId, tenant_id });
});
