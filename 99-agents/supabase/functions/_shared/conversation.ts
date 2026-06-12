import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function loadHistory(
  db: SupabaseClient,
  tenantId: string,
  recipientPhone: string
): Promise<string> {
  const { data } = await db
    .from('ziro_message_log')
    .select('message_body, direction, sent_at')
    .eq('tenant_id', tenantId)
    .eq('recipient_phone', recipientPhone)
    .order('sent_at', { ascending: true })
    .limit(20);

  if (!data || data.length === 0) return '';

  return data
    .map((row) => {
      const speaker = row.direction === 'outbound' ? 'Brooke' : 'Lead';
      return `${speaker}: ${row.message_body}`;
    })
    .join('\n');
}
