"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

type Metrics = {
  totalLeads: number;
  contacted: number;
  replied: number;
  replyRate: number;
  messagesSent: number;
  last30Days: number;
  lastActivity: string;
};

type MessageRow = {
  direction: string | null;
  recipient_phone: string | null;
  sent_at: string | null;
  status: string | null;
};

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function PortalOverview({ tenantId }: { tenantId: string }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (tenantId === "preview") {
        setMetrics({
          totalLeads: 47,
          contacted: 47,
          replied: 19,
          replyRate: 40,
          messagesSent: 213,
          last30Days: 31,
          lastActivity: "2h ago",
        });
        setLoading(false);
        return;
      }

      const { data: msgs } = await supabase
        .from("ziro_message_log")
        .select("direction, recipient_phone, sent_at, status")
        .eq("tenant_id", tenantId)
        .order("sent_at", { ascending: false });

      if (!msgs) { setLoading(false); return; }

      const rows = msgs as MessageRow[];
      const phones = new Set(rows.map(m => m.recipient_phone));
      const outbound = rows.filter(m => m.direction === "outbound");
      const inbound = rows.filter(m => m.direction === "inbound");
      const repliedPhones = new Set(inbound.map(m => m.recipient_phone));

      // 30-day window
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const recent = rows.filter(m => (m.sent_at ?? "") >= cutoff);
      const recentPhones = new Set(recent.map(m => m.recipient_phone));

      const lastMsg = rows[0];
      const lastActivity = lastMsg && lastMsg.sent_at
        ? formatRelative(lastMsg.sent_at)
        : "No activity yet";

      setMetrics({
        totalLeads: phones.size,
        contacted: outbound.length > 0 ? phones.size : 0,
        replied: repliedPhones.size,
        replyRate: phones.size > 0 ? Math.round((repliedPhones.size / phones.size) * 100) : 0,
        messagesSent: outbound.length,
        last30Days: recentPhones.size,
        lastActivity,
      });
      setLoading(false);
    }
    load();
  }, [tenantId]);

  const s: Record<string, React.CSSProperties> = {
    page: { overflowY: "auto", height: "100%", animation: "fadeIn 0.2s ease" },
    band: {
      padding: "20px 24px", borderBottom: "1px solid var(--border)",
    },
    content: { padding: "20px 24px" },
    heading: { fontSize: 23, fontWeight: 700, letterSpacing: "-0.4px", color: "var(--t1)", marginBottom: 4 },
    sub: { fontSize: 14, color: "var(--t3)" },
    grid: {
      display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
      borderBottom: "1px solid var(--border)", paddingBottom: 24, marginBottom: 24,
    },
    stat: { paddingRight: 24 },
    label: { fontSize: 12, fontWeight: 700, color: "var(--t3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 },
    value: { fontSize: 29, fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums" },
    meta: { fontSize: 13, color: "var(--t3)", marginTop: 6 },
    activityRow: {
      display: "flex", alignItems: "center", gap: 12,
      paddingTop: 4,
    },
    dot: {
      width: 8, height: 8, borderRadius: "50%",
      background: "#10B981", flexShrink: 0,
      boxShadow: "0 0 0 3px rgba(16,185,129,0.15)",
    },
    activityText: { fontSize: 14, color: "var(--t2)" },
    activityBold: { fontWeight: 600, color: "var(--t1)" },
  };

  if (loading) return (
    <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "var(--t3)", fontSize: 14 }}>Loading your data…</div>
    </div>
  );

  if (!metrics) return (
    <div style={s.page}>
      <div style={s.band}>
        <div style={s.heading}>Overview</div>
        <div style={s.sub}>Your pipeline at a glance</div>
      </div>
      <div style={s.content}>
        <div style={{ color: "var(--t3)", fontSize: 14 }}>No data yet. Leads will appear here once your campaign is live.</div>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.band}>
        <div style={s.heading}>Overview</div>
        <div style={s.sub}>Your pipeline at a glance</div>
      </div>

      <div style={s.content}>
        <div style={s.grid}>
          <div style={s.stat}>
            <div style={s.label}>Total Leads</div>
            <div style={s.value}>{metrics.totalLeads}</div>
            <div style={s.meta}>{metrics.last30Days} last 30 days</div>
          </div>
          <div style={s.stat}>
            <div style={s.label}>Replied</div>
            <div style={s.value}>{metrics.replied}</div>
            <div style={s.meta}>{metrics.replyRate}% response rate</div>
          </div>
          <div style={s.stat}>
            <div style={s.label}>Messages Sent</div>
            <div style={s.value}>{metrics.messagesSent}</div>
            <div style={s.meta}>by ZiroWork</div>
          </div>
        </div>

        <div style={s.activityRow}>
          <div style={s.dot} />
          <div style={s.activityText}>
            System active —{" "}
            <span style={s.activityBold}>last outreach {metrics.lastActivity}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
