"use client";

import { useState, useEffect, useMemo } from "react";
import { useClients, useLeads, useEnrollments } from "@/hooks/tables";
import { supabase } from "@/lib/supabase/client";

type MsgRow = { direction?: string | null; recipient_phone?: string | null; sent_at?: string | null; created_at?: string | null };

type MsgMetrics = {
  inboundPhones: Set<string>;
  firstOutboundByPhone: Record<string, string>;
};

export default function ReportingView() {
  const { data: allClients } = useClients();
  const { data: allLeads } = useLeads();
  const { data: allEnrollments } = useEnrollments();

  const clients = (allClients ?? []).filter((c) => c.status === "live");
  const leads = allLeads ?? [];
  const enrollments = allEnrollments ?? [];

  const [msgMetrics, setMsgMetrics] = useState<MsgMetrics | null>(null);
  const [msgLoading, setMsgLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("ziro_message_log")
      .select("direction, recipient_phone, sent_at, created_at")
      .then(({ data: rows }) => {
        if (!rows) { setMsgLoading(false); return; }
        const inboundPhones = new Set<string>();
        const firstOutboundByPhone: Record<string, string> = {};
        (rows as MsgRow[]).forEach((r) => {
          const phone = r.recipient_phone;
          if (!phone) return;
          if (r.direction === "inbound") {
            inboundPhones.add(phone);
          } else if (r.direction === "outbound") {
            const ts = r.sent_at ?? r.created_at;
            if (ts && (!firstOutboundByPhone[phone] || ts < firstOutboundByPhone[phone])) {
              firstOutboundByPhone[phone] = ts;
            }
          }
        });
        setMsgMetrics({ inboundPhones, firstOutboundByPhone });
        setMsgLoading(false);
      }, () => { setMsgLoading(false); });
  }, []);

  const monthStart = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  }, []);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
        <h1 style={{ fontSize: 25, fontWeight: 700, color: "var(--color-text-1)", letterSpacing: "-0.4px", margin: "0 0 4px 0" }}>
          Reporting
        </h1>
        <div style={{ fontSize: 13, color: "var(--color-text-3)" }}>
          Why should each client keep paying ZiroWork?
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {clients.map((client) => {
          const clientLeads = leads.filter(
            (l) => l.client_id === client.id && l.created_at && l.created_at >= monthStart
          ).length;

          const enrolledCount = enrollments.filter(
            (e) =>
              e.client_id === client.id &&
              e.outcome === "enrolled" &&
              e.created_at &&
              e.created_at >= monthStart
          ).length;

          const activeEnrolled = enrollments.filter(
            (e) => e.client_id === client.id && e.outcome === "enrolled" && e.weekly_rate_cents
          );
          const revenueCents = activeEnrolled.reduce(
            (sum, e) => sum + ((e.weekly_rate_cents ?? 0) * 4),
            0
          );
          const revenueStr = revenueCents > 0 ? "$" + (revenueCents / 100).toFixed(0) : null;

          const mrrCents = client.mrr_cents ?? 0;
          const roiMultiple =
            mrrCents > 0 && revenueCents > 0
              ? (revenueCents / mrrCents).toFixed(1) + "x"
              : mrrCents > 0 && enrolledCount > 0
              ? ((enrolledCount * 12000) / mrrCents).toFixed(1) + "x"
              : "—";

          let avgResp: string = msgLoading ? "…" : "—";
          let smsRespRate: string = msgLoading ? "…" : "—";

          if (!msgLoading && msgMetrics) {
            const clientPhones = leads
              .filter((l) => l.client_id === client.id && l.phone)
              .map((l) => ({ phone: l.phone as string, created_at: l.created_at }));

            const totalLeads = clientPhones.length;

            if (totalLeads > 0) {
              const replied = clientPhones.filter((lp) =>
                msgMetrics.inboundPhones.has(lp.phone)
              ).length;
              smsRespRate = Math.round((replied / totalLeads) * 100) + "%";
            }

            const responseTimes = clientPhones
              .filter((lp) => msgMetrics.firstOutboundByPhone[lp.phone] && lp.created_at)
              .map((lp) => {
                const diff =
                  (new Date(msgMetrics.firstOutboundByPhone[lp.phone]).getTime() -
                    new Date(lp.created_at as string).getTime()) /
                  1000;
                return diff;
              })
              .filter((diff) => diff > 0);

            if (responseTimes.length > 0) {
              const avgSec = Math.round(
                responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
              );
              avgResp = avgSec < 60 ? avgSec + "s" : Math.round(avgSec / 60) + "m";
            }
          }

          const stats: { label: string; value: string; sub?: string | null; accent?: boolean }[] = [
            { label: "Leads (mo)", value: String(clientLeads) },
            { label: "Avg Response", value: avgResp },
            { label: "Enrolled (mo)", value: String(enrolledCount) },
            { label: "SMS Reply Rate", value: smsRespRate },
            {
              label: "Revenue / ROI",
              value: roiMultiple,
              sub: revenueStr ? revenueStr + " est. monthly" : null,
              accent: true,
            },
          ];

          return (
            <div key={client.id} style={{ paddingTop: 4, marginBottom: 32 }}>
              {/* Client heading */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  paddingBottom: 8,
                  borderBottom: "1px solid var(--color-border)",
                  marginBottom: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-1)" }}>
                    {client.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-4)" }}>{client.city}</div>
                </div>
              </div>

              {/* Inline stat band */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 28,
                }}
              >
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--color-text-3)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: 6,
                      }}
                    >
                      {stat.label}
                    </div>
                    <div
                      style={{
                        fontSize: 29,
                        fontWeight: 700,
                        color: stat.accent ? "var(--color-roi-accent)" : "var(--color-text-1)",
                        letterSpacing: "-0.6px",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {stat.value}
                    </div>
                    {stat.sub && (
                      <div style={{ fontSize: 12, color: "var(--color-text-4)", marginTop: 3 }}>
                        {stat.sub}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
