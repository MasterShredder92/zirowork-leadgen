"use client";

import { useState } from "react";
import { useBookings } from "@/hooks/tables";
import { supabase } from "@/lib/supabase/client";

const STATUS_TOKENS: Record<string, string> = {
  scheduled: "--color-status-scheduled",
  requested: "--color-status-requested",
  completed: "--color-status-completed",
  no_show:   "--color-status-no_show",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  requested: "Requested",
  completed: "Completed",
  no_show:   "No-Show",
};

const PROGRAM_TOKENS: Record<string, string> = {
  Piano:  "--color-program-piano",
  Guitar: "--color-program-guitar",
  Voice:  "--color-program-voice",
  Drums:  "--color-program-drums",
};

const FALLBACK_TOKEN = "--color-status-completed";

function statusVar(s: string | null | undefined): string {
  return `var(${STATUS_TOKENS[s ?? ""] ?? FALLBACK_TOKEN})`;
}

function programVar(p: string | null | undefined): string {
  return `var(${PROGRAM_TOKENS[p ?? ""] ?? FALLBACK_TOKEN})`;
}

const HEADERS = [
  { label: "Parent / Student", align: "left"  as const },
  { label: "Client",           align: "left"  as const },
  { label: "Program",          align: "left"  as const },
  { label: "Status",           align: "left"  as const },
  { label: "Date",             align: "left"  as const },
  { label: "Time",             align: "left"  as const },
  { label: "Teacher",          align: "left"  as const },
  { label: "",                 align: "right" as const },
];

export default function BookingsView() {
  const { data: rawData } = useBookings();
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, string>>({});

  const rows = (rawData ?? []).map((b) =>
    optimisticStatus[b.id] ? { ...b, status: optimisticStatus[b.id] } : b
  );

  async function markBooking(id: string, status: string) {
    setOptimisticStatus((prev) => ({ ...prev, [id]: status }));
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) {
      setOptimisticStatus((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  const cell: React.CSSProperties = {
    padding: "11px 16px", fontSize: 14, color: "var(--color-text-2)",
    borderBottom: "1px solid var(--color-border)", textAlign: "left",
  };
  const firstCell: React.CSSProperties = { ...cell, paddingLeft: 0 };
  const lastCell:  React.CSSProperties = { ...cell, paddingRight: 0 };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>

      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
        <h1 style={{ fontSize: 25, fontWeight: 700, color: "var(--color-text-1)", letterSpacing: "-0.4px", margin: "0 0 4px 0" }}>
          Bookings
        </h1>
        <div style={{ fontSize: 13, color: "var(--color-text-3)" }}>
          What has ZiroWork scheduled and is the lead enrolled?
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {HEADERS.map((h, i) => (
                <th
                  key={i}
                  style={{
                    ...(i === 0 ? firstCell : i === HEADERS.length - 1 ? lastCell : cell),
                    color: "var(--color-text-4)", fontWeight: 700, fontSize: 11,
                    textTransform: "uppercase", letterSpacing: "0.07em", textAlign: h.align,
                  }}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr
                key={b.id}
                onMouseEnter={(e) => Array.from(e.currentTarget.cells).forEach((td) => { td.style.background = "var(--color-row-hover)"; })}
                onMouseLeave={(e) => Array.from(e.currentTarget.cells).forEach((td) => { td.style.background = "transparent"; })}
              >
                <td style={firstCell}>
                  <div style={{ fontWeight: 500, color: "var(--color-text-1)" }}>{b.parent_name}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-4)" }}>{b.student_name}</div>
                </td>
                <td style={cell}>{b.client_name}</td>
                <td style={cell}>
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: programVar(b.program),
                    background: `color-mix(in srgb, ${programVar(b.program)} 10%, transparent)`,
                    padding: "2px 7px", borderRadius: 20,
                  }}>
                    {b.program}
                  </span>
                </td>
                <td style={cell}>
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: statusVar(b.status),
                    background: `color-mix(in srgb, ${statusVar(b.status)} 10%, transparent)`,
                    padding: "2px 8px", borderRadius: 20,
                  }}>
                    {STATUS_LABELS[b.status ?? ""] ?? "—"}
                  </span>
                </td>
                <td style={cell}>{b.date || <span style={{ color: "var(--color-text-4)" }}>—</span>}</td>
                <td style={cell}>{b.time || <span style={{ color: "var(--color-text-4)" }}>—</span>}</td>
                <td style={cell}>{b.teacher || <span style={{ color: "var(--color-text-4)" }}>—</span>}</td>
                <td style={lastCell}>
                  {b.status !== "completed" && b.status !== "no_show" && (
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button
                        onClick={() => markBooking(b.id, "completed")}
                        style={{
                          padding: "3px 10px",
                          border: "1px solid color-mix(in srgb, var(--color-status-scheduled) 25%, transparent)",
                          borderRadius: 6,
                          background: "color-mix(in srgb, var(--color-status-scheduled) 5%, transparent)",
                          fontSize: 12, color: "var(--color-status-scheduled)", cursor: "pointer",
                        }}
                      >
                        Completed
                      </button>
                      <button
                        onClick={() => markBooking(b.id, "no_show")}
                        style={{
                          padding: "3px 10px",
                          border: "1px solid var(--color-border)",
                          borderRadius: 6, background: "none",
                          fontSize: 12, color: "var(--color-text-3)", cursor: "pointer",
                        }}
                      >
                        No-Show
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
