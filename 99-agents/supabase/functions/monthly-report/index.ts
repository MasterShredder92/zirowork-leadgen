import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PLATFORM_URL = Deno.env.get('SUPABASE_URL')!;
const PLATFORM_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.headers.get('authorization') !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const db = createClient(PLATFORM_URL, PLATFORM_SERVICE_KEY);

  const { data: tenants, error } = await db
    .from('agent_tenants')
    .select('tenant_id, name, config')
    .eq('active', true);

  if (error) {
    return new Response(`DB error: ${error.message}`, { status: 500 });
  }

  if (!tenants || tenants.length === 0) {
    return new Response(JSON.stringify({ processed: 0, failed: 0, month: '' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  let processed = 0;
  let failed = 0;

  for (const tenant of tenants) {
    try {
      const { count: leadsCount } = await db
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', tenant.tenant_id)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd);

      const { count: enrollmentsCount } = await db
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', tenant.tenant_id)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd);

      const { data: enrolledRows } = await db
        .from('enrollments')
        .select('weekly_rate_cents')
        .eq('client_id', tenant.tenant_id)
        .eq('stage', 'enrolled');

      const monthlyRevenueCents = (enrolledRows ?? []).reduce(
        (sum, row) => sum + (row.weekly_rate_cents ?? 0) * 4,
        0
      );

      const { data: responders } = await db
        .from('ziro_message_log')
        .select('recipient_phone')
        .eq('tenant_id', tenant.tenant_id)
        .eq('direction', 'inbound')
        .gte('sent_at', monthStart)
        .lte('sent_at', monthEnd);

      const uniqueResponders = new Set(responders?.map((r) => r.recipient_phone) ?? []).size;

      const responseRate =
        (leadsCount ?? 0) > 0 ? Math.round((uniqueResponders / leadsCount!) * 100) : 0;

      await db.from('client_reports').insert({
        client_id: tenant.tenant_id,
        period_start: monthStart,
        period_end: monthEnd,
        leads_count: leadsCount ?? 0,
        enrollments_count: enrollmentsCount ?? 0,
        response_rate_pct: responseRate,
        monthly_revenue_cents: monthlyRevenueCents,
        report_data: {
          unique_responders: uniqueResponders,
          tenant_name: tenant.name,
        },
        created_at: new Date().toISOString(),
      });

      processed++;
    } catch (err) {
      console.error(`monthly-report: tenant ${tenant.tenant_id} failed:`, err);
      failed++;
    }
  }

  return new Response(
    JSON.stringify({ processed, failed, month: monthStart.slice(0, 7) }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
