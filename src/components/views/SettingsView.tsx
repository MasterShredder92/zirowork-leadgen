"use client";

import { useState, useMemo } from "react";
import { useAgentTenants } from "@/hooks/tables";
import { supabase } from "@/lib/supabase/client";

const SEND_WINDOW_DEFAULTS = {
  send_window_start_hour: 9,
  send_window_end_hour: 21,
  send_window_tz: "America/Chicago",
  max_followups: 3,
  followup_day_offsets: [2, 4, 7],
};

const TZ_OPTIONS = [
  "America/Chicago",
  "America/New_York",
  "America/Denver",
  "America/Los_Angeles",
];

const selectStyle: React.CSSProperties = {
  padding: "6px 10px",
  border: "1px solid var(--color-border)",
  borderRadius: 7,
  background: "var(--color-bg)",
  fontSize: 13,
  color: "var(--color-text-1)",
  cursor: "pointer",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const inputStyle: React.CSSProperties = {
  padding: "6px 10px",
  border: "1px solid var(--color-border)",
  borderRadius: 7,
  background: "var(--color-bg)",
  fontSize: 13,
  color: "var(--color-text-1)",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

function FieldRow({ label, control, last }: { label: string; control: React.ReactNode; last?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 0",
      borderBottom: last ? "none" : "1px solid var(--color-border)",
      gap: 16,
    }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-1)" }}>{label}</div>
      {control}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: "var(--color-text-4)",
        textTransform: "uppercase", letterSpacing: "0.08em",
        paddingBottom: 8, borderBottom: "1px solid var(--color-border)", marginBottom: 2,
      }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value, action, last }: { label: string; value?: string; action?: string; last?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 0",
      borderBottom: last ? "none" : "1px solid var(--color-border)",
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-1)" }}>{label}</div>
        {value && <div style={{ fontSize: 13, color: "var(--color-text-4)", marginTop: 2 }}>{value}</div>}
      </div>
      {action && (
        <button style={{
          padding: "5px 12px", border: "1px solid var(--color-border)", borderRadius: 7,
          background: "transparent", fontSize: 13, color: "var(--color-text-2)",
          cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          {action}
        </button>
      )}
    </div>
  );
}

export default function SettingsView() {
  const { data: tenantRows, loading } = useAgentTenants();

  // selectedId: null = auto-select first tenant. Override by user interaction.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  // Derive the effective selected tenant (default to first)
  const effectiveId = selectedId ?? (tenantRows[0]?.tenant_id ?? null);

  // Derive base cadence from selected tenant's config (no useEffect needed)
  const baseCadence = useMemo(() => {
    const t = tenantRows.find((x) => x.tenant_id === effectiveId);
    const cfg = (t && t.config) || {};
    return {
      send_window_start_hour: cfg.send_window_start_hour ?? SEND_WINDOW_DEFAULTS.send_window_start_hour,
      send_window_end_hour:   cfg.send_window_end_hour   ?? SEND_WINDOW_DEFAULTS.send_window_end_hour,
      send_window_tz:         cfg.send_window_tz         ?? SEND_WINDOW_DEFAULTS.send_window_tz,
      max_followups:          cfg.max_followups           ?? SEND_WINDOW_DEFAULTS.max_followups,
      followup_day_offsets:   Array.isArray(cfg.followup_day_offsets)
        ? cfg.followup_day_offsets
        : SEND_WINDOW_DEFAULTS.followup_day_offsets,
    };
  }, [tenantRows, effectiveId]);

  // Editable overrides — reset when effectiveId changes
  const [startHour, setStartHour] = useState<string | number>("");
  const [endHour, setEndHour] = useState<string | number>("");
  const [tz, setTz] = useState<string>("");
  const [maxFollowups, setMaxFollowups] = useState<string | number>("");
  const [offsetsText, setOffsetsText] = useState<string>("");

  // Derive effective display values: use local override if set, else baseCadence
  const displayStart    = startHour    !== "" ? startHour    : baseCadence.send_window_start_hour;
  const displayEnd      = endHour      !== "" ? endHour      : baseCadence.send_window_end_hour;
  const displayTz       = tz           !== "" ? tz           : baseCadence.send_window_tz;
  const displayMax      = maxFollowups !== "" ? maxFollowups : baseCadence.max_followups;
  const displayOffsets  = offsetsText  !== "" ? offsetsText  : baseCadence.followup_day_offsets.join(", ");

  async function saveCadence() {
    if (!effectiveId || tenantRows.length === 0) return;
    setSaving(true); setSaved(false); setSaveErr("");
    const t = tenantRows.find((x) => x.tenant_id === effectiveId);
    const existing = (t && t.config) || {};
    const offsets = displayOffsets.split(",").map((s) => Number(s.trim())).filter((n) => !isNaN(n));
    const newConfig = {
      ...existing,
      send_window_start_hour: Number(displayStart),
      send_window_end_hour:   Number(displayEnd),
      send_window_tz:         String(displayTz),
      max_followups:          Number(displayMax),
      followup_day_offsets:   offsets,
    };
    const { error } = await supabase
      .from("agent_tenants")
      .update({ config: newConfig, updated_at: new Date().toISOString() })
      .eq("tenant_id", effectiveId);
    setSaving(false);
    if (error) { setSaveErr("Save failed: " + error.message); return; }
    // Clear local overrides so UI snaps to the saved values (reflected via hook refetch)
    setStartHour(""); setEndHour(""); setTz(""); setMaxFollowups(""); setOffsetsText("");
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const showLoading = loading;
  const showEmpty = !loading && tenantRows.length === 0;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>

      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
        <h1 style={{ fontSize: 25, fontWeight: 700, color: "var(--color-text-1)", letterSpacing: "-0.4px", margin: "0 0 4px 0" }}>
          Settings
        </h1>
        <div style={{ fontSize: 13, color: "var(--color-text-3)" }}>
          Operator account and system configuration
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        <div style={{ maxWidth: 640 }}>

          <Section title="Operator Account">
            <Row label="Operator name" value="ZiroWork" />
            <Row label="Operator user" value="Zach Adkins" />
            <Row label="Email" value="slavior1992@gmail.com" />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0" }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-1)" }}>Role</div>
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: "var(--color-accent)",
                background: "color-mix(in srgb, var(--color-accent) 10%, transparent)",
                padding: "3px 10px", borderRadius: 20,
              }}>Operator</span>
            </div>
          </Section>

          <Section title="Speed-to-Lead">
            {showLoading ? (
              <div style={{ fontSize: 13, color: "var(--color-text-4)", padding: "14px 0" }}>Loading…</div>
            ) : showEmpty ? (
              <div style={{ fontSize: 13, color: "var(--color-text-4)", padding: "14px 0" }}>
                Not connected to Supabase — send cadence settings are unavailable.
              </div>
            ) : (
              <>
                {tenantRows.length > 1 ? (
                  <FieldRow label="School" control={
                    <select
                      value={effectiveId || ""}
                      onChange={(e) => {
                        setSelectedId(e.target.value);
                        // Reset overrides when switching tenants
                        setStartHour(""); setEndHour(""); setTz(""); setMaxFollowups(""); setOffsetsText("");
                      }}
                      style={selectStyle}
                    >
                      {tenantRows.map((t) => (
                        <option key={t.tenant_id ?? ""} value={t.tenant_id ?? ""}>
                          {t.name || t.tenant_id}
                        </option>
                      ))}
                    </select>
                  } />
                ) : (
                  <Row label="School" value={(tenantRows[0] && (tenantRows[0].name || tenantRows[0].tenant_id)) || ""} />
                )}
                <FieldRow label="Contact window start hour" control={
                  <select
                    value={displayStart}
                    onChange={(e) => setStartHour(e.target.value)}
                    style={selectStyle}
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                } />
                <FieldRow label="Contact window end hour" control={
                  <select
                    value={displayEnd}
                    onChange={(e) => setEndHour(e.target.value)}
                    style={selectStyle}
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                } />
                <FieldRow label="Timezone" control={
                  <select
                    value={displayTz}
                    onChange={(e) => setTz(e.target.value)}
                    style={selectStyle}
                  >
                    {TZ_OPTIONS.map((zone) => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                } />
                <FieldRow label="Max follow-ups" control={
                  <input
                    type="number" min={1} max={5}
                    value={displayMax}
                    onChange={(e) => setMaxFollowups(e.target.value)}
                    style={{ ...inputStyle, width: 70 }}
                  />
                } />
                <FieldRow label="Follow-up day offsets" control={
                  <input
                    type="text"
                    value={displayOffsets}
                    onChange={(e) => setOffsetsText(e.target.value)}
                    placeholder="2, 4, 7"
                    style={{ ...inputStyle, width: 140 }}
                  />
                } last />
                <div style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 16 }}>
                  <button
                    onClick={saveCadence}
                    disabled={saving}
                    style={{
                      padding: "7px 16px", border: "none", borderRadius: 7,
                      background: "var(--color-accent)", color: "var(--color-on-accent)",
                      fontSize: 13, fontWeight: 600,
                      cursor: saving ? "default" : "pointer",
                      opacity: saving ? 0.6 : 1,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  {saved && <div style={{ fontSize: 13, color: "var(--color-paid-dot)", fontWeight: 600 }}>✓ Saved</div>}
                  {saveErr && <div style={{ fontSize: 13, color: "var(--color-overdue-dot)", fontWeight: 600 }}>{saveErr}</div>}
                </div>
              </>
            )}
          </Section>

          <Section title="Notifications">
            <Row label="Escalation alerts" value="Immediate — SMS + email" />
            <Row label="Daily digest" value="Every day at 7:00 AM" />
            <Row label="New lead alerts" value="Enabled" last />
          </Section>

          <Section title="System">
            <Row label="Backend" value="Supabase — live (project txpgyuetfsrzfxxopwzf)" />
            <Row label="Version" value="ZiroWork Operator CRM — Phase 2" last />
          </Section>

        </div>
      </div>
    </div>
  );
}
