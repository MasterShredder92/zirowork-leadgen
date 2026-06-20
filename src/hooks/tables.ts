import { useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { useRealtimeTable } from "./useRealtimeTable";
import type { Lead, Booking, Enrollment, Campaign, Escalation, AgentTenant } from "@/lib/derive/types";

type Filters = Record<string, unknown>;

export const useClients         = (f?: Filters) => useRealtimeTable("clients", f);
export const useCampaigns       = (f?: Filters) => useRealtimeTable<Campaign>("campaigns", f);
export const useLeads           = (f?: Filters) => useRealtimeTable<Lead>("leads", f);
export const useEscalations     = (f?: Filters) => useRealtimeTable<Escalation>("escalations", f);
export const useBookings        = (f?: Filters) => useRealtimeTable<Booking>("bookings", f);
export const useEnrollments     = (f?: Filters) => useRealtimeTable<Enrollment>("enrollments", f);
export const useAutomationRules = (f?: Filters) => useRealtimeTable("automation_rules", f);

// agent_tenants: EXPLICIT safe-col select — never pull supabase_service_key/url to the browser.
const TENANT_SAFE_COLS = "id, tenant_id, name, plan_tier, status, config, square_customer_id, square_card_id, per_enrollment_fee_cents, intake_api_key, integrations_enabled";

export function useAgentTenants(): { data: AgentTenant[]; loading: boolean; error: PostgrestError | null; refetch: () => void } {
  const [data, setData] = useState<AgentTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    supabase.from("agent_tenants").select(TENANT_SAFE_COLS).then(({ data: rows, error: err }) => {
      setData((rows as AgentTenant[]) ?? []);
      setError(err);
      setLoading(false);
    });
  }, [tick]);
  useEffect(() => {
    const channel = supabase
      .channel("rt-agent_tenants")
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_tenants" }, () => setTick((t) => t + 1))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);
  return { data, loading, error, refetch: () => setTick((t) => t + 1) };
}
