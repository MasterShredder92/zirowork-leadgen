"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useClients, useAgentTenants } from "@/hooks/tables";
import { deriveIntegrations } from "@/lib/derive/integrations";
import type { IntegrationRow } from "@/lib/derive/types";
import { supabase } from "@/lib/supabase/client";

// status: connected=#22C55E → --color-insight-1 · incomplete=#F97316 → --color-program-drums · missing=#F59E0B → --color-insight-3 · default=#6B7280 → --color-insight-5
const STATUS_VAR: Record<string, string> = {
  connected: "--color-insight-1",
  incomplete: "--color-program-drums",
  missing: "--color-insight-3",
};
const STATUS_LABEL: Record<string, string> = {
  connected: "Connected",
  incomplete: "Incomplete",
  missing: "Missing",
};

export default function IntegrationsView() {
  const router = useRouter();
  const { data: clients } = useClients();
  const { data: tenants } = useAgentTenants();
  const rows: IntegrationRow[] = useMemo(() => deriveIntegrations(clients ?? [], tenants ?? []), [clients, tenants]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [timestamps, setTimestamps] = useState<{ twilio: string | null; square: string | null; webhook: string | null }>({
    twilio: null,
    square: null,
    webhook: null,
  });

  useEffect(() => {
    const fetchTs = () => {
      Promise.all([
        supabase.from("ziro_message_log").select("created_at").order("created_at", { ascending: false }).limit(1),
        supabase.from("billing_events").select("created_at").eq("status", "succeeded").order("created_at", { ascending: false }).limit(1),
        supabase.from("leads").select("created_at").order("created_at", { ascending: false }).limit(1),
      ]).then(([tw, sq, wh]) =>
        setTimestamps({
          twilio: tw.data?.[0]?.created_at ?? null,
          square: sq.data?.[0]?.created_at ?? null,
          webhook: wh.data?.[0]?.created_at ?? null,
        })
      ).catch(() => {});
    };
    fetchTs();
    window.addEventListener("focus", fetchTs);
    return () => window.removeEventListener("focus", fetchTs);
  }, []);

  function relativeTime(isoStr: string): string {
    // eslint-disable-next-line react-hooks/purity
    const diffMs = Date.now() - new Date(isoStr).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
  }

  function activityLabel(ts: string | null, prefix: string): string | null {
    if (!ts) return null;
    // eslint-disable-next-line react-hooks/purity
    const diffHr = (Date.now() - new Date(ts).getTime()) / 3600000;
    if (diffHr > 24) return "No recent activity";
    return `${prefix}: ${relativeTime(ts)}`;
  }

  const incomplete = rows.filter((r) => r.status === "incomplete").length;
  const missing = rows.filter((r) => r.status === "missing").length;

  const byClient: { client_id: string; client_name: string; items: IntegrationRow[] }[] = [];
  const idx: Record<string, number> = {};
  rows.forEach((r) => {
    if (idx[r.client_id] == null) {
      idx[r.client_id] = byClient.length;
      byClient.push({ client_id: r.client_id, client_name: r.client_name, items: [] });
    }
    byClient[idx[r.client_id]].items.push(r);
  });

  function copyWebhook(r: IntegrationRow) {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/on-new-lead/${r.client_id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(r.client_id + ":" + r.service);
    setTimeout(() => setCopiedId((c) => (c === r.client_id + ":" + r.service ? null : c)), 2000);
  }

  const btnStyle = {
    padding: "4px 10px",
    border: "1px solid var(--color-border)",
    borderRadius: 6,
    background: "none",
    fontSize: 12,
    color: "var(--color-text-3)",
    cursor: "pointer",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  } as const;

  function actionFor(r: IntegrationRow) {
    if (r.status === "connected") return null;
    if (r.service === "openphone") {
      return <button onClick={() => router.push("/clients")} style={btnStyle}>Set number</button>;
    }
    if (r.service === "square") {
      return <button onClick={() => window.open("https://squareup.com/dashboard", "_blank")} style={btnStyle}>Set up billing</button>;
    }
    if (r.service === "lead_webhook") {
      const copied = copiedId === r.client_id + ":" + r.service;
      return <button onClick={() => copyWebhook(r)} style={btnStyle}>{copied ? "Copied" : "Copy webhook URL"}</button>;
    }
    return null;
  }

  const cell = { padding: "12px 0", fontSize: 14, color: "var(--color-text-2)", borderBottom: "1px solid var(--color-border)" } as const;

  const twilioActivity = activityLabel(timestamps.twilio, "Last reply");
  const squareActivity = activityLabel(timestamps.square, "Last charge");
  const webhookActivity = activityLabel(timestamps.webhook, "Last lead");

  const platformServices = [
    { name: "Twilio SMS", detail: "Active (platform-managed)", activity: twilioActivity },
    { name: "Square Billing", detail: "Platform-managed", activity: squareActivity },
    { name: "Lead Webhook", detail: "Platform-managed", activity: webhookActivity },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
        <h1 style={{ fontSize: 25, fontWeight: 700, color: "var(--color-text-1)", letterSpacing: "-0.4px", margin: "0 0 4px 0" }}>Integrations</h1>
        <div style={{ fontSize: 13, color: "var(--color-text-3)" }}>Which forms, phone numbers, SMS, payment links, calendars, and email routes are connected or broken?</div>
      </div>

      {/* Summary band — inline stats, no boxes */}
      {(incomplete > 0 || missing > 0) && (
        <div style={{ display: "flex", gap: 40, padding: "16px 24px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
          {incomplete > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-3)", marginBottom: 4 }}>Incomplete</div>
              <div style={{ fontSize: 23, fontWeight: 700, color: "var(--color-program-drums)", fontVariantNumeric: "tabular-nums" }}>{incomplete}</div>
            </div>
          )}
          {missing > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-3)", marginBottom: 4 }}>Missing</div>
              <div style={{ fontSize: 23, fontWeight: 700, color: "var(--color-insight-3)", fontVariantNumeric: "tabular-nums" }}>{missing}</div>
            </div>
          )}
        </div>
      )}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

        {/* Platform Services — live timestamps from Supabase */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-4)", marginBottom: 10 }}>Platform Services</div>
          {platformServices.map((s) => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-1)" }}>{s.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {s.activity && (
                  <span style={{
                    fontSize: 12,
                    color: s.activity === "No recent activity" ? "var(--color-text-4)" : "var(--color-text-3)",
                    fontStyle: s.activity === "No recent activity" ? "italic" : "normal",
                  }}>
                    {s.activity}
                  </span>
                )}
                <span style={{ fontSize: 12, color: "var(--color-insight-1)", fontWeight: 600 }}>{s.detail}</span>
              </div>
            </div>
          ))}
          <div style={{ fontSize: 12, color: "var(--color-text-4)", marginTop: 8 }}>Managed via Supabase Edge Function secrets.</div>
        </div>

        {/* Per-client integrations — derived rows grouped by client */}
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-4)", marginBottom: 10 }}>Per-client integrations</div>
        {byClient.map((group) => (
          <div key={group.client_id} style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-1)", marginBottom: 4 }}>{group.client_name}</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {group.items.map((r) => {
                  const rowKey = r.client_id + ":" + r.service;
                  const statusVar = STATUS_VAR[r.status] ?? "--color-insight-5";
                  const hovered = hoverKey === rowKey;
                  return (
                    <tr
                      key={r.service}
                      onMouseEnter={() => setHoverKey(rowKey)}
                      onMouseLeave={() => setHoverKey(null)}
                    >
                      <td style={{ ...cell, width: "22%", background: hovered ? "var(--color-row-hover)" : "transparent" }}>
                        <span style={{ fontSize: 13, color: "var(--color-text-2)" }}>{r.label}</span>
                      </td>
                      <td style={{ ...cell, background: hovered ? "var(--color-row-hover)" : "transparent" }}>
                        <span style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: `var(${statusVar})`,
                          background: `color-mix(in srgb, var(${statusVar}) 10%, transparent)`,
                          padding: "2px 8px",
                          borderRadius: 20,
                        }}>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </td>
                      <td style={{ ...cell, background: hovered ? "var(--color-row-hover)" : "transparent" }}>
                        <span style={{ fontSize: 13, color: "var(--color-text-3)" }}>{r.detail}</span>
                      </td>
                      <td style={{ ...cell, textAlign: "right", background: hovered ? "var(--color-row-hover)" : "transparent" }}>
                        {actionFor(r)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
