import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { scoreAndSend } from '../_shared/score-and-send.ts';

const PLATFORM_URL = Deno.env.get('SUPABASE_URL')!;
const PLATFORM_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.headers.get('authorization') !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const db = createClient(PLATFORM_URL, PLATFORM_SERVICE_KEY);

  const { data: pending, error } = await db
    .from('pending_leads')
    .select('*')
    .lte('send_at', new Date().toISOString())
    .is('processed_at', null)
    .lt('attempts', 3)
    .order('send_at', { ascending: true })
    .limit(20);

  if (error) {
    return new Response(`DB error: ${error.message}`, { status: 500 });
  }

  if (!pending || pending.length === 0) {
    return new Response('Nothing to process', { status: 200 });
  }

  const results = await Promise.allSettled(
    pending.map(async (row) => {
      try {
        await scoreAndSend(row.lead_data, row.tenant_id);
        await db
          .from('pending_leads')
          .update({ processed_at: new Date().toISOString() })
          .eq('id', row.id);
      } catch (err) {
        await db
          .from('pending_leads')
          .update({
            attempts: row.attempts + 1,
            last_error: String(err),
          })
          .eq('id', row.id);
        throw err;
      }
    })
  );

  const failed = results.filter((r) => r.status === 'rejected').length;
  const processed = pending.length - failed;

  return new Response(
    JSON.stringify({ processed, failed }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
