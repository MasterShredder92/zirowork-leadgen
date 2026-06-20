import { useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

// Realtime table read: fetch on mount + on any postgres change (via tick), ordered created_at desc.
// .then()+tick (not async-in-effect) to satisfy react-hooks/set-state-in-effect — same as usePages.
// chanKey gives composer hooks a distinct channel so they don't collide with a page's own sub.
export function useRealtimeTable<T = Record<string, unknown>>(
  table: string,
  filters?: Record<string, unknown>,
  chanKey?: string,
): { data: T[]; loading: boolean; error: PostgrestError | null; refetch: () => void } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [tick, setTick] = useState(0);
  const filterKey = filters ? JSON.stringify(filters) : "";

  useEffect(() => {
    let q = supabase.from(table).select("*").order("created_at", { ascending: false });
    if (filters) Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v); });
    q.then(({ data: rows, error: err }) => {
      setData((rows as T[]) ?? []);
      setError(err);
      setLoading(false);
    });
    // filterKey is the stable proxy for filters; tick forces refetch on realtime/manual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filterKey, tick]);

  useEffect(() => {
    const channel = supabase
      .channel(`rt-${table}${chanKey ? `-${chanKey}` : ""}${filterKey ? `-${filterKey}` : ""}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => setTick((t) => t + 1))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [table, filterKey, chanKey]);

  return { data, loading, error, refetch: () => setTick((t) => t + 1) };
}
