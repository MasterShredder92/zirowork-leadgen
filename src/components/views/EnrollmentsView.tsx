"use client";

import { useState, useEffect } from "react";
import { useEnrollments } from "@/hooks/tables";
import { supabase } from "@/lib/supabase/client";
import type { Enrollment } from "@/lib/derive/types";

// outcome: enrolled=#22C55E(status-scheduled), lost=#EF4444(status-no_show), follow_up=#F59E0B(pending-dot)
const OUTCOME_VAR: Record<string, string> = {
  enrolled: "--color-status-scheduled",
  lost: "--color-status-no_show",
  follow_up: "--color-pending-dot",
};
const OUTCOME_LABEL: Record<string, string> = {
  enrolled: "Enrolled", lost: "Lost", follow_up: "Follow-up", pending: "Pending",
};
const PROGRAM_VAR: Record<string, string> = {
  Piano: "--color-program-piano", Guitar: "--color-program-guitar",
  Voice: "--color-program-voice", Drums: "--color-program-drums",
};

function cv(map: Record<string, string>, key: string | null | undefined) {
  return `var(${map[key ?? ""] ?? "--color-insight-5"})`;
}

const CELL: React.CSSProperties = {
  padding: "11px 16px", fontSize: 14, color: "var(--color-text-2)",
  borderBottom: "1px solid var(--color-border)", textAlign: "left",
};
const FIRST_CELL: React.CSSProperties = { ...CELL, paddingLeft: 0 };
const LAST_CELL: React.CSSProperties = { ...CELL, paddingRight: 0, textAlign: "right" };

const HEADERS = ["Parent / Student", "Client", "Program", "Outcome", "Weekly Rate", "Date", ""];

// green = T.isDark ? '#4ADE80' : '#15803D' — exactly --color-roi-accent (dark / light themed)
const GREEN = "var(--color-roi-accent)";

export default function EnrollmentsView() {
  const { data: rawData } = useEnrollments();
  // Optimistic overrides: keyed by enrollment id — avoids syncing rawData into state via useEffect.
  const [overrides, setOverrides] = useState<Record<string, Partial<Enrollment>>>({});
  const enrollments = (rawData ?? []).map((e) =>
    overrides[e.id] ? { ...e, ...overrides[e.id] } : e
  );

  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [rateInput, setRateInput] = useState("");
  const [feeMap, setFeeMap] = useState<Record<string, number>>({});
  const [chargeMap, setChargeMap] = useState<Record<string, string>>({});
  const [charging, setCharging] = useState<Record<string, boolean>>({});
  const [chargeMsg, setChargeMsg] = useState<Record<string, string>>({});

  // Load per-client enrollment fee + existing charge statuses — setState inside .then(), not synchronously
  useEffect(() => {
    if (!rawData?.length) return;
    const clientIds = [...new Set(rawData.map((e) => e.client_id).filter(Boolean))] as string[];
    if (clientIds.length) {
      supabase
        .from("agent_tenants")
        .select("tenant_id, per_enrollment_fee_cents")
        .in("tenant_id", clientIds)
        .then(({ data }) => {
          if (data) {
            const m: Record<string, number> = {};
            (data as Array<{ tenant_id: string; per_enrollment_fee_cents: number | null }>).forEach((t) => {
              if (t.per_enrollment_fee_cents != null) m[t.tenant_id] = t.per_enrollment_fee_cents;
            });
            setFeeMap(m);
          }
        });
    }
    supabase.functions.invoke("billing", { body: { action: "charges" } }).then(({ data }) => {
      if (data && (data as Record<string, unknown>).events) {
        const m: Record<string, string> = {};
        (data.events as Array<{ enrollment_id: string; status: string }>).forEach((ev) => {
          if (ev.enrollment_id && !m[ev.enrollment_id]) m[ev.enrollment_id] = ev.status;
        });
        setChargeMap(m);
      }
    });
  }, [rawData]);

  async function confirmEnroll(en: Enrollment) {
    const weekly_rate_cents = Math.round(parseFloat(rateInput || "0") * 100);
    const enrolled_at = new Date().toISOString();
    const updates = { outcome: "enrolled" as const, enrolled_at, weekly_rate_cents };
    const { error } = await supabase.from("enrollments").update(updates).eq("id", en.id);
    if (!error) {
      setOverrides((prev) => ({ ...prev, [en.id]: { ...prev[en.id], ...updates } }));
      setEnrollingId(null);
      setRateInput("");
      if (en.lead_id) {
        await supabase.from("leads").update({ stage: "enrolled" }).eq("id", en.lead_id);
      }
    }
  }

  async function recordLost(en: Enrollment) {
    const { error } = await supabase.from("enrollments").update({ outcome: "lost" }).eq("id", en.id);
    if (!error) {
      setOverrides((prev) => ({ ...prev, [en.id]: { ...prev[en.id], outcome: "lost" } }));
      if (en.lead_id) {
        await supabase.from("leads").update({ stage: "lost" }).eq("id", en.lead_id);
      }
    }
  }

  async function chargeEnrollment(en: Enrollment) {
    setCharging((prev) => ({ ...prev, [en.id]: true }));
    setChargeMsg((prev) => ({ ...prev, [en.id]: "" }));
    const { data, error } = await supabase.functions.invoke("billing", {
      body: { action: "charge", tenant_id: en.client_id, enrollment_id: en.id },
    });
    setCharging((prev) => ({ ...prev, [en.id]: false }));
    if (error || !data) {
      setChargeMsg((prev) => ({ ...prev, [en.id]: "Charge failed. Try again." }));
      return;
    }
    const d = data as { ok?: boolean; already_charged?: boolean; status?: string; reason?: string; error?: string };
    if (d.ok || d.already_charged) {
      setChargeMap((prev) => ({ ...prev, [en.id]: d.status || "succeeded" }));
      return;
    }
    const REASON_MAP: Record<string, string> = {
      square_not_configured: "Square not connected yet.",
      no_fee_configured: "Set this client's per-enrollment fee first.",
      no_card_on_file: "School hasn't added a card yet.",
    };
    const reason = d.reason || d.error || "failed";
    setChargeMsg((prev) => ({
      ...prev,
      [en.id]: REASON_MAP[reason] || `Charge ${d.status || "failed"}${d.error ? ": " + d.error : ""}`,
    }));
  }

  const totalRevenue = enrollments
    .filter((e) => e.outcome === "enrolled")
    .reduce((s, e) => s + (e.weekly_rate_cents || 0), 0);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>
      {/* Header */}
      <div
        style={{
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid var(--color-border)", flexShrink: 0,
        }}
      >
        <div>
          <h1 style={{ fontSize: 25, fontWeight: 700, color: "var(--color-text-1)", letterSpacing: "-0.4px", margin: "0 0 4px 0" }}>
            Enrollments
          </h1>
          <div style={{ fontSize: 13, color: "var(--color-text-3)" }}>What became revenue and what was lost?</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Weekly Revenue Added
          </div>
          <div style={{ fontSize: 29, fontWeight: 700, color: GREEN, letterSpacing: "-0.6px", fontVariantNumeric: "tabular-nums" }}>
            ${(totalRevenue / 100).toFixed(0)}
            <span style={{ fontSize: 14, color: "var(--color-text-3)", fontWeight: 400 }}>/wk</span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 24px 20px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {HEADERS.map((h, i, arr) => (
                <th
                  key={h || i}
                  style={{
                    ...(i === 0 ? FIRST_CELL : i === arr.length - 1 ? LAST_CELL : CELL),
                    color: "var(--color-text-4)", fontWeight: 700, fontSize: 11,
                    textTransform: "uppercase", letterSpacing: "0.07em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => (
              <tr
                key={e.id}
                onMouseEnter={(r) => { [...r.currentTarget.cells].forEach((td) => (td.style.background = "var(--color-row-hover)")); }}
                onMouseLeave={(r) => { [...r.currentTarget.cells].forEach((td) => (td.style.background = "transparent")); }}
              >
                <td style={FIRST_CELL}>
                  <div style={{ fontWeight: 500, color: "var(--color-text-1)" }}>{e.parent_name}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-4)" }}>{e.student_name}</div>
                </td>
                <td style={CELL}>{e.client_name}</td>
                <td style={CELL}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: cv(PROGRAM_VAR, e.program), background: `color-mix(in srgb, ${cv(PROGRAM_VAR, e.program)} 10%, transparent)`, padding: "2px 7px", borderRadius: 20 }}>
                    {e.program}
                  </span>
                </td>
                <td style={CELL}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: cv(OUTCOME_VAR, e.outcome), background: `color-mix(in srgb, ${cv(OUTCOME_VAR, e.outcome)} 10%, transparent)`, padding: "2px 8px", borderRadius: 20 }}>
                    {OUTCOME_LABEL[e.outcome ?? ""] ?? e.outcome}
                  </span>
                </td>
                <td style={CELL}>
                  {e.weekly_rate_cents
                    ? `$${(e.weekly_rate_cents / 100).toFixed(0)}/wk`
                    : <span style={{ color: "var(--color-text-4)" }}>—</span>}
                </td>
                <td style={CELL}>
                  {e.enrolled_at || <span style={{ color: "var(--color-text-4)" }}>—</span>}
                </td>
                <td style={LAST_CELL}>
                  {/* Pending / follow-up: Enrolled + Lost action buttons */}
                  {(e.outcome === "pending" || e.outcome === "follow_up") && enrollingId !== e.id && (
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button
                        onClick={() => { setEnrollingId(e.id); setRateInput(""); }}
                        style={{ padding: "3px 10px", border: "1px solid color-mix(in srgb, var(--color-status-scheduled) 25%, transparent)", borderRadius: 6, background: "color-mix(in srgb, var(--color-status-scheduled) 5%, transparent)", fontSize: 12, color: "var(--color-status-scheduled)", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Enrolled
                      </button>
                      <button
                        onClick={() => recordLost(e)}
                        style={{ padding: "3px 10px", border: "1px solid color-mix(in srgb, var(--color-status-no_show) 25%, transparent)", borderRadius: 6, background: "color-mix(in srgb, var(--color-status-no_show) 5%, transparent)", fontSize: 12, color: "var(--color-status-no_show)", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Lost
                      </button>
                    </div>
                  )}
                  {/* Inline rate entry for confirming enrollment */}
                  {enrollingId === e.id && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-end" }}>
                      <input
                        type="number" min="0" step="1" placeholder="$/wk"
                        value={rateInput}
                        onChange={(ev) => setRateInput(ev.target.value)}
                        style={{ width: 70, padding: "3px 7px", borderRadius: 6, border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text-1)", fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      />
                      <button
                        onClick={() => confirmEnroll(e)}
                        style={{ padding: "3px 10px", border: "1px solid color-mix(in srgb, var(--color-status-scheduled) 25%, transparent)", borderRadius: 6, background: "color-mix(in srgb, var(--color-status-scheduled) 5%, transparent)", fontSize: 12, color: "var(--color-status-scheduled)", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => { setEnrollingId(null); setRateInput(""); }}
                        style={{ padding: "3px 10px", border: "1px solid var(--color-border)", borderRadius: 6, background: "transparent", fontSize: 12, color: "var(--color-text-3)", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {/* Enrolled: charge button or charged status */}
                  {e.outcome === "enrolled" && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      {chargeMap[e.id] === "succeeded" || chargeMap[e.id] === "pending" ? (
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-status-scheduled)" }}>
                          Charged{chargeMap[e.id] === "pending" ? " (pending)" : ""}
                        </span>
                      ) : (
                        <button
                          onClick={() => chargeEnrollment(e)}
                          disabled={!!charging[e.id]}
                          style={{ padding: "3px 10px", border: "1px solid color-mix(in srgb, var(--color-accent) 33%, transparent)", borderRadius: 6, background: "color-mix(in srgb, var(--color-accent) 8%, transparent)", fontSize: 12, color: "var(--color-accent)", cursor: charging[e.id] ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", opacity: charging[e.id] ? 0.6 : 1, whiteSpace: "nowrap" }}
                        >
                          {charging[e.id]
                            ? "Charging…"
                            : feeMap[e.client_id ?? ""]
                              ? `Charge $${(feeMap[e.client_id ?? ""] / 100).toFixed(0)}`
                              : "Charge"}
                        </button>
                      )}
                      {chargeMsg[e.id] && (
                        <span style={{ fontSize: 11, color: "var(--color-status-no_show)", maxWidth: 170, textAlign: "right" }}>
                          {chargeMsg[e.id]}
                        </span>
                      )}
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
