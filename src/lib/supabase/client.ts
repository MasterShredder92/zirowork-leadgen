import { createClient } from "@supabase/supabase-js";

// Browser client singleton — mirrors the old `window.sb` (plain anon client, no
// session). Real cookie auth (@supabase/ssr) is a SEPARATE tracked change, not
// the spine port. Keys come from env, never literals.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anonKey);
