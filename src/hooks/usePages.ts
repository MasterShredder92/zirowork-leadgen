import { useCallback, useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

// instrument code → display label, verbatim from legacy use-pages.js (note: vocals → "Voice").
const INSTRUMENT_LABEL: Record<string, string> = {
  piano: "Piano",
  guitar: "Guitar",
  vocals: "Voice",
  drums: "Drums",
};

// Only the client_pages columns this hook touches. id typed string (Supabase uuid
// default) — if that column is a bigint, this is the single field to fix when Phase 3
// brings in generated DB types. Not inventing the rest of the schema.
type ClientPageRaw = {
  id: string;
  school_name: string | null;
  instrument: string;
  status: string | null;
  slug: string;
  updated_at: string | null;
};

// Row shape the view consumes. All strings by construction (the map coerces every field).
export type PageRow = {
  id: string;
  client_name: string;
  program: string;
  type: "Landing Page";
  status: string;
  slug: string;
  last_updated: string;
};

export function usePages(): {
  data: PageRow[];
  loading: boolean;
  error: PostgrestError | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // Legacy null-guarded against absent client; module singleton always exists,
    // so that branch is unreachable — dropping it changes no behavior.
    supabase
      .from("client_pages")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data: rows, error: err }) => {
        setError(err);
        setData(
          ((rows as ClientPageRaw[] | null) ?? []).map((r) => ({
            id: r.id,
            client_name: r.school_name || "—",
            program: INSTRUMENT_LABEL[r.instrument] || r.instrument,
            type: "Landing Page",
            status: r.status || "live",
            slug: `${r.slug}/${r.instrument}`,
            last_updated: r.updated_at
              ? new Date(r.updated_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—",
          })),
        );
        setLoading(false);
      });
  }, [tick]);

  const refetch = useCallback(async () => {
    setTick((t) => t + 1);
  }, []);

  return { data, loading, error, refetch };
}
