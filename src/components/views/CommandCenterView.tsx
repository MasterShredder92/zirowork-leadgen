"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useClients, useBookings, useLeads, useEnrollments } from "@/hooks/tables";
import { useRollups } from "@/hooks/useRollups";
import { EMPTY_CLIENT_ROLLUP } from "@/lib/derive/rollups";
import { supabase } from "@/lib/supabase/client";
import {
  Inbox, UserCheck, AlertTriangle, MessageSquare,
  Building2, CalendarCheck, ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// attention: escalations #EF4444→--color-insight-2 · at-risk #F59E0B→--color-insight-3 · trials #3B82F6→--color-status-requested
// health: healthy #22C55E→--color-insight-1 · at_risk #EF4444→--color-insight-2 · stuck #F59E0B→--color-insight-3 · default/onboarding #6B7280→--color-insight-5

type ClientFull = {
  id: string;
  name?: string | null;
  school_name?: string | null;
  health?: string | null;
  city?: string | null;
  state?: string | null;
  mrr_cents?: number | null;
};

const ICONS: Record<string, LucideIcon> = {
  Inbox, UserCheck, AlertTriangle, MessageSquare, Building2, CalendarCheck, ArrowRight,
};

const HEALTH_VAR: Record<string, string> = {
  healthy: "--color-insight-1",
  at_risk: "--color-insight-2",
  stuck:   "--color-insight-3",
};

function healthVar(h: string | null | undefined): string {
  return HEALTH_VAR[h ?? ""] ?? "--color-insight-5";
}

const HEALTH_LABEL: Record<string, string> = {
  healthy: "Healthy", at_risk: "At Risk", stuck: "Stuck", onboarding: "Onboarding",
};

export default function CommandCenterView() {
  const router = useRouter();
  const clients    = useClients().data as ClientFull[];
  const bookings   = useBookings().data   ?? [];
  const leads      = useLeads().data      ?? [];
  const enrollments = useEnrollments().data ?? [];
  const { byClient: rollups } = useRollups();

  const totalLeads       = leads.length;
  const totalTrials      = bookings.filter(b => b.status === "completed" || b.status === "scheduled").length;
  const totalEnrollments = enrollments.filter(e => e.outcome === "enrolled").length;
  const totalMRR         = (clients.reduce((s, c) => s + (c.mrr_cents || 0), 0) / 100).toFixed(0);
  const openEscalations  = Object.values(rollups).reduce((s, r) => s + (r.open_escalations || 0), 0);
  const atRiskClients    = clients.filter(c => c.health === "at_risk" || c.health === "stuck").length;
  const pendingBookings  = bookings.filter(b => b.status === "requested" || b.status === "scheduled").length;

  // suppress TS noUnusedLocals (not enabled) — these mirrors the legacy derives kept for parity
  void totalLeads; void totalTrials; void totalEnrollments; void totalMRR;

  const [kpiActiveLeads,     setKpiActiveLeads]     = useState<string | number>("—");
  const [kpiEnrolledMonth,   setKpiEnrolledMonth]   = useState<string | number>("—");
  const [kpiOpenEscalations, setKpiOpenEscalations] = useState<string | number>("—");
  const [kpiResponseRate,    setKpiResponseRate]    = useState<string>("—");

  useEffect(() => {
    supabase.from("leads").select("id", { count: "exact", head: true })
      .not("stage", "in", '("enrolled","lost")')
      .then(({ count }) => { if (count != null) setKpiActiveLeads(count); });

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    supabase.from("enrollments").select("id", { count: "exact", head: true })
      .gte("created_at", monthStart)
      .then(({ count }) => { if (count != null) setKpiEnrolledMonth(count); });

    supabase.from("ziro_messaging_escalations").select("id", { count: "exact", head: true })
      .is("resolved_at", null)
      .then(({ count }) => { if (count != null) setKpiOpenEscalations(count); });

    Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase.from("ziro_message_log").select("recipient_phone").eq("direction", "inbound"),
    ]).then(([leadsRes, msgRes]) => {
      const total = leadsRes.count || 0;
      if (total === 0) { setKpiResponseRate("0%"); return; }
      const replied = new Set(
        ((msgRes.data ?? []) as { recipient_phone?: string | null }[])
          .map(r => r.recipient_phone)
          .filter(Boolean)
      ).size;
      setKpiResponseRate(Math.round((replied / total) * 100) + "%");
    });
  }, []);

  const kpis = [
    { label: "Active Leads",     value: kpiActiveLeads,     icon: "Inbox",         nav: "leads" },
    { label: "Enrolled (mo)",    value: kpiEnrolledMonth,   icon: "UserCheck",     nav: "enrollments" },
    { label: "Open Escalations", value: kpiOpenEscalations, icon: "AlertTriangle", nav: "escalations" },
    { label: "Response Rate",    value: kpiResponseRate,    icon: "MessageSquare", nav: "conversations" },
  ];

  const attention: { icon: string; colorVar: string; label: string; nav: string }[] = [];
  if (openEscalations > 0) attention.push({ icon: "AlertTriangle", colorVar: "--color-insight-2",        label: `${openEscalations} open escalation${openEscalations > 1 ? "s" : ""} need human review`, nav: "escalations" });
  if (atRiskClients > 0)   attention.push({ icon: "Building2",     colorVar: "--color-insight-3",        label: `${atRiskClients} client${atRiskClients > 1 ? "s" : ""} at risk or stuck`,               nav: "clients" });
  if (pendingBookings > 0) attention.push({ icon: "CalendarCheck", colorVar: "--color-status-requested", label: `${pendingBookings} trial${pendingBookings > 1 ? "s" : ""} requested or scheduled`,       nav: "bookings" });

  const [hoverKpi,      setHoverKpi]      = useState<string | null>(null);
  const [hoverAttn,     setHoverAttn]     = useState<number | null>(null);
  const [hoverClientId, setHoverClientId] = useState<string | null>(null);

  const cell: CSSProperties      = { padding: "11px 16px", fontSize: 14, color: "var(--color-text-2)", borderBottom: "1px solid var(--color-border)", textAlign: "left" };
  const firstCell: CSSProperties = { ...cell, paddingLeft: 0 };
  const lastCell: CSSProperties  = { ...cell, paddingRight: 0 };
  const numCell: CSSProperties   = { ...cell, textAlign: "right", fontVariantNumeric: "tabular-nums" };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
        <h1 style={{ fontSize: 25, fontWeight: 700, color: "var(--color-text-1)", letterSpacing: "-0.4px", margin: "0 0 4px 0" }}>Command Center</h1>
        <div style={{ fontSize: 13, color: "var(--color-text-3)" }}>What needs attention right now across all clients</div>
      </div>

      {/* KPI band — inline stats, no boxes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 28, padding: "20px 24px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
        {kpis.map(k => {
          const Icon = ICONS[k.icon];
          return (
            <div
              key={k.label}
              onClick={() => router.push("/" + k.nav)}
              onMouseEnter={() => setHoverKpi(k.label)}
              onMouseLeave={() => setHoverKpi(null)}
              style={{ cursor: "pointer" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                {Icon && <Icon size={12} color="var(--color-text-4)" strokeWidth={1.75} />}
                <span style={{ fontSize: 11, color: "var(--color-text-3)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{k.label}</span>
              </div>
              <div style={{ fontSize: 29, fontWeight: 700, color: hoverKpi === k.label ? "var(--color-accent)" : "var(--color-text-1)", letterSpacing: "-0.6px", fontVariantNumeric: "tabular-nums", transition: "color 0.15s" }}>
                {k.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

        {/* Needs Attention — flat rows, hairline separated */}
        {attention.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-4)", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 8, borderBottom: "1px solid var(--color-border)", marginBottom: 2 }}>Needs Attention</div>
            {attention.map((a, i) => {
              const Icon = ICONS[a.icon];
              return (
                <div
                  key={i}
                  onClick={() => router.push("/" + a.nav)}
                  onMouseEnter={() => setHoverAttn(i)}
                  onMouseLeave={() => setHoverAttn(null)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 8px", margin: "0 -8px", borderBottom: "1px solid var(--color-border)", cursor: "pointer", borderRadius: 6, transition: "background 0.15s", background: hoverAttn === i ? "var(--color-hover)" : "transparent" }}
                >
                  {Icon && <Icon size={15} color={`var(${a.colorVar})`} strokeWidth={1.8} />}
                  <span style={{ fontSize: 14, color: "var(--color-text-1)" }}>{a.label}</span>
                  <ArrowRight size={13} color="var(--color-text-4)" style={{ marginLeft: "auto" }} />
                </div>
              );
            })}
          </div>
        )}

        {/* Client Overview — borderless table */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid var(--color-border)", marginBottom: 2 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Client Overview</div>
            <button
              onClick={() => router.push("/clients")}
              style={{ fontSize: 13, color: "var(--color-accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              View all →
            </button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {([
                  { label: "Client",       align: "left"  },
                  { label: "Status",       align: "left"  },
                  { label: "Leads 30d",    align: "right" },
                  { label: "Trials 30d",   align: "right" },
                  { label: "Enrolled 30d", align: "right" },
                  { label: "Escalations",  align: "right" },
                ] as { label: string; align: CSSProperties["textAlign"] }[]).map((h, i, arr) => (
                  <th key={h.label} style={{ ...(i === 0 ? firstCell : i === arr.length - 1 ? lastCell : cell), color: "var(--color-text-4)", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", textAlign: h.align }}>{h.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map(c => {
                const r = rollups[c.id] ?? EMPTY_CLIENT_ROLLUP;
                const hovered = hoverClientId === c.id;
                const tdBg = hovered ? "var(--color-row-hover)" : "transparent";
                return (
                  <tr
                    key={c.id}
                    onClick={() => router.push("/clients")}
                    onMouseEnter={() => setHoverClientId(c.id)}
                    onMouseLeave={() => setHoverClientId(null)}
                    style={{ cursor: "pointer" }}
                  >
                    <td style={{ ...firstCell, background: tdBg }}>
                      <div style={{ fontWeight: 500, color: "var(--color-text-1)" }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-4)" }}>{c.city}, {c.state}</div>
                    </td>
                    <td style={{ ...cell, background: tdBg }}>
                      {c.health ? (
                        <span style={{ fontSize: 12, fontWeight: 600, color: `var(${healthVar(c.health)})`, background: `color-mix(in srgb, var(${healthVar(c.health)}) 10%, transparent)`, padding: "2px 8px", borderRadius: 20 }}>
                          {HEALTH_LABEL[c.health] ?? c.health}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-insight-5)", background: "color-mix(in srgb, var(--color-insight-5) 12%, transparent)", padding: "2px 8px", borderRadius: 20 }}>
                          Onboarding
                        </span>
                      )}
                    </td>
                    <td style={{ ...numCell, background: tdBg }}>{r.leads_30d}</td>
                    <td style={{ ...numCell, background: tdBg }}>{r.trials_30d}</td>
                    <td style={{ ...numCell, background: tdBg }}>{r.enrollments_30d}</td>
                    <td style={{ ...lastCell, background: tdBg }}>
                      {r.open_escalations > 0
                        ? <span style={{ color: "var(--color-insight-2)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{r.open_escalations}</span>
                        : <span style={{ color: "var(--color-text-4)" }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
