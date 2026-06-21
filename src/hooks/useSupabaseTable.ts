import { useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

// Generic one-off table read. Named hooks live in use-local-data.
export function useSupabaseTable<T = Record<string, unknown>>(
  table: string,
  filters?: Record<string, unknown>,
): { data: T[]; loading: boolean; error: PostgrestError | null } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);
  const filterKey = filters ? JSON.stringify(filters) : "";
  useEffect(() => {
    let q = supabase.from(table).select("*").order("created_at", { ascending: false });
    if (filters) Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v); });
    q.then(({ data: rows, error: err }) => {
      setData((rows as T[]) ?? []);
      setError(err);
      setLoading(false);
    });
    // filterKey is the stable proxy for `filters` (object identity churns each render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filterKey]);
  return { data, loading, error };
}
