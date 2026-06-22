"use client";

import { useState, Fragment } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { usePages, type PageRow } from "@/hooks/usePages";
import { supabase } from "@/lib/supabase/client";

// status: live=#22C55E(--color-status-scheduled), draft=#F59E0B(--color-pending-dot), broken=#EF4444(--color-status-no_show)
const STATUS_VAR: Record<string, string> = {
  live: "--color-status-scheduled",
  draft: "--color-pending-dot",
  broken: "--color-status-no_show",
};

// program: Piano=#818CF8, Guitar=#F59E0B, Voice=#EC4899, Drums=#F97316 — all pre-existing tokens
const PROGRAM_VAR: Record<string, string> = {
  Piano: "--color-program-piano",
  Guitar: "--color-program-guitar",
  Voice: "--color-program-voice",
  Drums: "--color-program-drums",
};

const STATUS_LABEL: Record<string, string> = { live: "Live", draft: "Draft", broken: "Broken" };
const STATUSES = ["all", "live", "draft", "broken"];

function cv(map: Record<string, string>, key: string) {
  return `var(${map[key] ?? "--color-insight-5"})`;
}

const CELL: React.CSSProperties = {
  padding: "11px 16px",
  fontSize: 14,
  color: "var(--color-text-2)",
  borderBottom: "1px solid var(--color-border)",
  textAlign: "left",
};
const FIRST_CELL: React.CSSProperties = { ...CELL, paddingLeft: 0 };
const LAST_CELL: React.CSSProperties = { ...CELL, paddingRight: 0 };

const HEADERS = [
  { label: "Program", align: "left" as const },
  { label: "Type", align: "left" as const },
  { label: "Status", align: "left" as const },
  { label: "Slug", align: "left" as const },
  { label: "Updated", align: "left" as const },
  { label: "", align: "right" as const },
];

export default function PagesView() {
  const { data: pages } = usePages();
  const [filter, setFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [statusOverride, setStatusOverride] = useState<Record<string, string>>({});

  const togglePublish = async (page: PageRow) => {
    const newStatus = page.status === "live" ? "draft" : "live";
    setStatusOverride((o) => ({ ...o, [page.id]: newStatus }));
    await supabase.from("client_pages").update({ status: newStatus }).eq("id", page.id);
  };

  const clientNames = [...new Set((pages || []).map((p) => p.client_name))].sort((a, b) =>
    a.localeCompare(b)
  );

  const filtered = (pages || [])
    .map((p) => (statusOverride[p.id] ? { ...p, status: statusOverride[p.id] } : p))
    .filter(
      (p) =>
        (filter === "all" || p.status === filter) &&
        (clientFilter === "all" || p.client_name === clientFilter)
    );

  const groups = filtered.reduce<Record<string, PageRow[]>>((m, p) => {
    (m[p.client_name] = m[p.client_name] || []).push(p);
    return m;
  }, {});
  const groupList = Object.keys(groups).sort((a, b) => a.localeCompare(b));
  const toggleClient = (name: string) => setCollapsed((c) => ({ ...c, [name]: !c[name] }));

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>
      {/* Header */}
      <div
        style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid var(--color-border)", flexShrink: 0,
        }}
      >
        <div>
          <h1 style={{ fontSize: 25, fontWeight: 700, color: "var(--color-text-1)", letterSpacing: "-0.4px", margin: "0 0 4px 0" }}>
            Pages
          </h1>
          <div style={{ fontSize: 13, color: "var(--color-text-3)" }}>
            Which landing pages and signup pages are draft, ready, live, or broken?
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {/* Filters: status pills + client dropdown */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {STATUSES.map((s) => {
              const active = filter === s;
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  style={{
                    padding: "5px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500,
                    cursor: "pointer",
                    border: active ? "none" : "1px solid var(--color-border)",
                    background: active ? "var(--color-accent)" : "transparent",
                    color: active ? "var(--color-on-accent)" : "var(--color-text-3)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {s === "all" ? "All" : STATUS_LABEL[s] ?? s}
                </button>
              );
            })}
          </div>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            style={{
              padding: "6px 12px", borderRadius: 7, border: "1px solid var(--color-border)",
              background: "var(--color-bg)", color: "var(--color-text-2)",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none",
            }}
          >
            <option value="all">All clients</option>
            {clientNames.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {groupList.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "var(--color-text-4)", fontSize: 14 }}>
            No pages match these filters.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {HEADERS.map((h, i, arr) => (
                  <th
                    key={h.label || i}
                    style={{
                      ...(i === 0 ? FIRST_CELL : i === arr.length - 1 ? LAST_CELL : CELL),
                      color: "var(--color-text-4)",
                      fontWeight: 700,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      textAlign: h.align,
                    }}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupList.map((name) => {
                const pgs = groups[name];
                const isCollapsed = !!collapsed[name];
                const Chevron = isCollapsed ? ChevronRight : ChevronDown;
                return (
                  <Fragment key={name}>
                    {/* Client group header */}
                    <tr onClick={() => toggleClient(name)} style={{ cursor: "pointer" }}>
                      <td colSpan={6} style={{ padding: "16px 0 8px", borderBottom: "1px solid var(--color-border)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Chevron size={15} color="var(--color-text-4)" strokeWidth={2} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-1)" }}>{name}</span>
                          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-4)" }}>
                            {pgs.length} page{pgs.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {/* Pages under this client */}
                    {!isCollapsed &&
                      pgs.map((pg) => (
                        <tr
                          key={pg.id}
                          onMouseEnter={(e) => {
                            [...e.currentTarget.cells].forEach(
                              (td) => (td.style.background = "var(--color-row-hover)")
                            );
                          }}
                          onMouseLeave={(e) => {
                            [...e.currentTarget.cells].forEach(
                              (td) => (td.style.background = "transparent")
                            );
                          }}
                        >
                          <td style={FIRST_CELL}>
                            <span
                              style={{
                                fontSize: 12, fontWeight: 600,
                                color: cv(PROGRAM_VAR, pg.program),
                                background: `color-mix(in srgb, ${cv(PROGRAM_VAR, pg.program)} 10%, transparent)`,
                                padding: "2px 8px", borderRadius: 20,
                              }}
                            >
                              {pg.program}
                            </span>
                          </td>
                          <td style={CELL}>
                            <span style={{ fontSize: 12, color: "var(--color-text-3)" }}>{pg.type}</span>
                          </td>
                          <td style={CELL}>
                            <span
                              style={{
                                fontSize: 12, fontWeight: 600,
                                color: cv(STATUS_VAR, pg.status),
                                background: `color-mix(in srgb, ${cv(STATUS_VAR, pg.status)} 10%, transparent)`,
                                padding: "2px 8px", borderRadius: 20,
                              }}
                            >
                              {STATUS_LABEL[pg.status] ?? pg.status}
                            </span>
                          </td>
                          <td style={CELL}>
                            <code style={{ fontSize: 12, color: "var(--color-text-3)" }}>{pg.slug}</code>
                          </td>
                          <td style={CELL}>{pg.last_updated}</td>
                          <td style={{ ...LAST_CELL, textAlign: "right" }}>
                            {(pg.status === "live" || pg.status === "draft") && (
                              <button
                                onClick={() => togglePublish(pg)}
                                style={{
                                  padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                                  cursor: "pointer", border: "1px solid var(--color-border)",
                                  background: "transparent", color: "var(--color-text-3)",
                                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                                }}
                              >
                                {pg.status === "live" ? "Unpublish" : "Publish"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
