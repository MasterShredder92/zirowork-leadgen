import { supabase } from '@/lib/supabase/client';

// Funnel tracking — one row per page view, deduped per session so a refresh
// doesn't double-count. Fire-and-forget: tracking must NEVER break the page.
// Runs client-side only (reads sessionStorage + window.location).
export async function logPageEvent(
  type: string,
  slug: string,
  instrument?: string | null,
): Promise<void> {
  try {
    const key = `pe_${type}_${slug}_${instrument || ''}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    await supabase
      .from('page_events')
      .insert([{ slug, instrument: instrument || null, type, page_url: window.location.href }]);
  } catch {
    /* no-op */
  }
}
