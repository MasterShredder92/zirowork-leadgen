"use client";

import { useState, useMemo, useEffect } from "react";
import type { CSSProperties } from "react";
import { usePageFunnel } from "@/hooks/usePageFunnel";
import type { FunnelRow } from "@/lib/derive/types";
import { supabase } from "@/lib/supabase/client";
import { X } from "lucide-react";

const RANGE_DAYS: Record<string, number | null> = { "7": 7, "30": 30, "90": 90, all: null };
const PROGRAM_VAR: Record<string, string> = {
  Piano: "var(--color-program-piano)",
  Guitar: "var(--color-program-guitar)",
  Voice: "var(--color-program-voice)",
  Drums: "var(--color-program-drums)",
};
const programColor = (p: string) => PROGRAM_VAR[p] ?? "var(--color-insight-5)";
const statusColor = (s: string) =>
  ({ live: "var(--color-insight-1)", active: "var(--color-insight-1)", paused: "var(--color-insight-3)", draft: "var(--color-insight-5)", ended: "var(--color-insight-5)" } as Record<string, string>)[s] ?? "var(--color-insight-5)";
const statusLabel = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—");

function FunnelBars({ page, color }: { page: FunnelRow; color: string }) {
  const stages = [
    { label: "Views", value: page.views },
    { label: "Clicks", value: page.clicks },
    { label: "Leads", value: page.leads },
    { label: "Trials", value: page.trials },
    { label: "Enrolled", value: page.enrolled },
  ];
  const max = Math.max(page.views, 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {stages.map((s, i) => {
        const prev = i > 0 ? stages[i - 1].value : null;
        const drop = prev != null ? (prev > 0 ? Math.round((s.value / prev) * 100) + "%" : "—") : null;
        const w = s.value > 0 ? Math.max((s.value / max) * 100, 2) : 0;
        return (
          <div key={s.label}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.label}</span>
              <span style={{ fontSize: 13, color: "var(--color-text-4)" }}>
                {drop != null && <span style={{ marginRight: 10 }}>{drop} of prev</span>}
                <span style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-1)", fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 5, background: "var(--color-hover)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: w + "%", borderRadius: 5, background: color, transition: "width .3s" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ConversionDonut({ page, color }: { page: FunnelRow; color: string }) {
  const pct = page.views > 0 ? Math.round((page.enrolled / page.views) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <div style={{ width: 116, height: 116, borderRadius: "50%", background: `conic-gradient(${color} ${pct * 3.6}deg, var(--color-hover) 0deg)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <div style={{ width: 82, height: 82, borderRadius: "50%", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text-1)", fontVariantNumeric: "tabular-nums" }}>{pct}%</div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--color-text-1)" }}>{page.enrolled}</strong> enrolled from <strong style={{ color: "var(--color-text-1)" }}>{page.views}</strong> views
        </div>
        <div style={{ fontSize: 12, color: "var(--color-text-4)", marginTop: 4 }}>End-to-end conversion</div>
      </div>
    </div>
  );
}

function TrendChart({ page, color }: { page: FunnelRow; color: string }) {
  const [events, setEvents] = useState<{ type?: string | null; created_at?: string | null }[] | null>(null);

  useEffect(() => {
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    supabase
      .from("page_events")
      .select("type,created_at")
      .eq("slug", page.rawSlug)
      .eq("instrument", page.rawInstrument)
      .gte("created_at", since)
      .then(
        ({ data }) => setEvents(data ?? []),
        () => setEvents([])
      );
  }, [page.rawSlug, page.rawInstrument]);

  if (events === null) return <div style={{ fontSize: 13, color: "var(--color-text-4)" }}>Loading…</div>;

  const days = 30;
  // eslint-disable-next-line react-hooks/purity
  const startDay = new Date(Date.now() - (days - 1) * 864e5);
  startDay.setHours(0, 0, 0, 0);
  const views = new Array(days).fill(0) as number[];
  const clicks = new Array(days).fill(0) as number[];
  events.forEach((e) => {
    const idx = Math.floor((new Date(e.created_at ?? "").getTime() - startDay.getTime()) / 864e5);
    if (idx < 0 || idx >= days) return;
    if (e.type === "view") views[idx]++;
    else if (e.type === "signup_view") clicks[idx]++;
  });
  const totalV = views.reduce((a, b) => a + b, 0);
  const totalC = clicks.reduce((a, b) => a + b, 0);
  const max = Math.max(...views, ...clicks, 1);
  const W = 300, H = 70, step = W / (days - 1);
  const line = (arr: number[]) => arr.map((v, i) => `${(i * step).toFixed(1)},${(H - (v / max) * H).toFixed(1)}`).join(" ");

  if (totalV === 0 && totalC === 0) {
    return <div style={{ fontSize: 13, color: "var(--color-text-4)" }}>No traffic in the last 30 days yet.</div>;
  }
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: "block" }}>
        <polyline points={line(views)} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <polyline points={line(clicks)} fill="none" stroke="var(--color-text-4)" strokeWidth="1.5" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      </svg>
      <div style={{ display: "flex", gap: 18, marginTop: 10, fontSize: 12, color: "var(--color-text-3)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 2, background: color, display: "inline-block" }} />
          Views ({totalV})
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, borderTop: "2px dashed var(--color-text-4)", display: "inline-block" }} />
          Clicks ({totalC})
        </span>
      </div>
    </div>
  );
}

function CampaignPanel({ page }: { page: FunnelRow }) {
  const color = programColor(page.instrument);
  const section: CSSProperties = { padding: "20px 24px", borderBottom: "1px solid var(--color-border)" };
  const sectionLabel: CSSProperties = { fontSize: 11, fontWeight: 700, color: "var(--color-text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 };
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={section}><div style={sectionLabel}>Conversion</div><ConversionDonut page={page} color={color} /></div>
      <div style={section}><div style={sectionLabel}>Funnel</div><FunnelBars page={page} color={color} /></div>
      <div style={section}><div style={sectionLabel}>Last 30 days</div><TrendChart page={page} color={color} /></div>
    </div>
  );
}

export default function CampaignsView() {
  const [range, setRange] = useState("30");
  const [clientFilter, setClientFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<FunnelRow | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/purity
  const sinceMs = useMemo(() => { const d = RANGE_DAYS[range]; return d !== null ? Date.now() - d * 864e5 : null; }, [range]);
  const allRows: FunnelRow[] = usePageFunnel(sinceMs);

  const clientOpts = useMemo(() => {
    const m: Record<string, string> = {};
    allRows.forEach((r) => { if (r.client_id) m[r.client_id] = r.client_name; });
    return Object.entries(m).map(([id, name]) => ({ id, name }));
  }, [allRows]);
  const programOpts = useMemo(() => [...new Set(allRows.map((r) => r.instrument))], [allRows]);
  const statusOpts = useMemo(() => [...new Set(allRows.map((r) => r.status))], [allRows]);

  const rows = allRows.filter((r) =>
    (clientFilter === "all" || r.client_id === clientFilter) &&
    (programFilter === "all" || r.instrument === programFilter) &&
    (statusFilter === "all" || r.status === statusFilter)
  );

  const tot = rows.reduce(
    (a, r) => ({ views: a.views + r.views, clicks: a.clicks + r.clicks, leads: a.leads + r.leads, trials: a.trials + r.trials, enrolled: a.enrolled + r.enrolled }),
    { views: 0, clicks: 0, leads: 0, trials: 0, enrolled: 0 }
  );
  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) + "%" : "—");

  const live = selected ? (allRows.find((r) => r.id === selected.id) ?? selected) : null;

  const cell: CSSProperties = { padding: "11px 16px", fontSize: 14, color: "var(--color-text-2)", borderBottom: "1px solid var(--color-border)", textAlign: "left" };
  const firstCell: CSSProperties = { ...cell, paddingLeft: 0 };
  const lastCell: CSSProperties = { ...cell, paddingRight: 0, textAlign: "right", fontVariantNumeric: "tabular-nums" };
  const numCell: CSSProperties = { ...cell, textAlign: "right", fontVariantNumeric: "tabular-nums" };
  const selectStyle: CSSProperties = { background: "var(--color-surface)", color: "var(--color-text-2)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "7px 10px", fontSize: 13, cursor: "pointer", outline: "none" };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 25, fontWeight: 700, color: "var(--color-text-1)", letterSpacing: "-0.4px", margin: "0 0 4px 0" }}>Campaigns</h1>
          <div style={{ fontSize: 13, color: "var(--color-text-3)" }}>Every landing page, from traffic to enrolled — which ones are producing?</div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {/* Filter bar */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} style={selectStyle}>
            <option value="all">All clients</option>
            {clientOpts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} style={selectStyle}>
            <option value="all">All programs</option>
            {programOpts.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="all">All statuses</option>
            {statusOpts.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
          <select value={range} onChange={(e) => setRange(e.target.value)} style={selectStyle}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        {/* Summary metric band */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 24, paddingBottom: 20, marginBottom: 8, borderBottom: "1px solid var(--color-border)" }}>
          {[
            { label: "Views", value: tot.views },
            { label: "Clicks", value: tot.clicks },
            { label: "CTR", value: pct(tot.clicks, tot.views) },
            { label: "Leads", value: tot.leads },
            { label: "Trials", value: tot.trials },
            { label: "Enrolled", value: tot.enrolled },
            { label: "Conv", value: pct(tot.enrolled, tot.leads) },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "var(--color-text-1)", letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {[
                { label: "Client", align: "left" },
                { label: "Program", align: "left" },
                { label: "Status", align: "left" },
                { label: "Views", align: "right" },
                { label: "Clicks", align: "right" },
                { label: "CTR", align: "right" },
                { label: "Leads", align: "right" },
                { label: "Trials", align: "right" },
                { label: "Enrolled", align: "right" },
                { label: "Conv", align: "right" },
              ].map((h, i, arr) => (
                <th
                  key={h.label}
                  style={{
                    ...(i === 0 ? firstCell : i === arr.length - 1 ? lastCell : cell),
                    color: "var(--color-text-4)",
                    fontWeight: 700,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    textAlign: h.align as "left" | "right",
                  }}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const rowBg = hoverId === p.id ? "var(--color-row-hover)" : "transparent";
              return (
                <tr
                  key={p.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelected(p)}
                  onMouseEnter={() => setHoverId(p.id)}
                  onMouseLeave={() => setHoverId(null)}
                >
                  <td style={{ ...firstCell, background: rowBg }}>
                    <div style={{ fontWeight: 500, color: "var(--color-text-1)" }}>{p.client_name}</div>
                  </td>
                  <td style={{ ...cell, background: rowBg }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: programColor(p.instrument), background: `color-mix(in srgb, ${programColor(p.instrument)} 10%, transparent)`, padding: "2px 8px", borderRadius: 20 }}>
                      {p.instrument}
                    </span>
                  </td>
                  <td style={{ ...cell, background: rowBg }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: statusColor(p.status), background: `color-mix(in srgb, ${statusColor(p.status)} 10%, transparent)`, padding: "2px 8px", borderRadius: 20 }}>
                      {statusLabel(p.status)}
                    </span>
                  </td>
                  <td style={{ ...numCell, background: rowBg }}>{p.views}</td>
                  <td style={{ ...numCell, background: rowBg }}>{p.clicks}</td>
                  <td style={{ ...numCell, background: rowBg }}>{pct(p.clicks, p.views)}</td>
                  <td style={{ ...numCell, background: rowBg }}>{p.leads}</td>
                  <td style={{ ...numCell, background: rowBg }}>{p.trials}</td>
                  <td style={{ ...numCell, background: rowBg }}>{p.enrolled}</td>
                  <td style={{ ...lastCell, background: rowBg }}>{pct(p.enrolled, p.leads)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} style={{ padding: "40px 0", textAlign: "center", color: "var(--color-text-4)", fontSize: 14 }}>No landing pages match these filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {live && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "var(--color-scrim)", zIndex: 100 }} onClick={() => setSelected(null)} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 560, background: "var(--color-bg)", borderLeft: "1px solid var(--color-border)", zIndex: 101, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-1)", letterSpacing: "-0.2px" }}>{live.client_name}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-4)", marginTop: 1 }}>{live.instrument} · /schools/{live.slug}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", color: "var(--color-text-3)", cursor: "pointer", padding: 4, lineHeight: 0 }}>
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>
            <CampaignPanel key={live.id} page={live} />
          </div>
        </>
      )}
    </div>
  );
}
