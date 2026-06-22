"use client";

import { useState } from "react";
import { useAutomationRules, useClients } from "@/hooks/tables";
import { supabase } from "@/lib/supabase/client";
import type { Client } from "@/lib/derive/types";

// mode:   ai=#818CF8→--color-insight-0 · escalate=#EF4444→--color-insight-2 · pause=#F59E0B→--color-insight-3 · default=#6B7280→--color-insight-5
// status: active=#22C55E→--color-insight-1 · paused=#F59E0B→--color-insight-3
const MODE_VAR: Record<string, string> = {
  ai: "--color-insight-0",
  escalate: "--color-insight-2",
  pause: "--color-insight-3",
};
const STAT_VAR: Record<string, string> = {
  active: "--color-insight-1",
  paused: "--color-insight-3",
};
const MODE_LABEL: Record<string, string> = { ai: "AI", escalate: "Escalate", pause: "Pause" };

function mv(key: string | null | undefined) { return MODE_VAR[key ?? ""] ?? "--color-insight-5"; }
function sv(key: string | null | undefined) { return STAT_VAR[key ?? ""] ?? "--color-insight-5"; }
function cmix(v: string, pct: number) { return `color-mix(in srgb, var(${v}) ${pct}%, transparent)`; }

type AutomationRule = {
  id: string;
  name?: string | null;
  trigger?: string | null;
  action?: string | null;
  client_id?: string | null;
  status?: string | null;
  mode?: string | null;
};

const EMPTY_FORM = { name: "", trigger: "new_lead", action: "send_sms_ai", client_id: "", status: "active" };

const LABEL: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "var(--color-text-3)", marginBottom: 6,
};
const FIELD: React.CSSProperties = {
  width: "100%", padding: "9px 11px", fontSize: 13,
  color: "var(--color-text-1)", background: "var(--color-bg)",
  border: "1px solid var(--color-border)", borderRadius: 8,
  fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: "border-box",
};

export default function AutomationRulesView() {
  const { data: rawData } = useAutomationRules();
  const { data: clients } = useClients();
  const [overrides, setOverrides] = useState<Record<string, "active" | "paused">>({});
  const [created, setCreated] = useState<AutomationRule[]>([]);
  const rules = ([...created, ...rawData] as AutomationRule[]).map((r) =>
    overrides[r.id] ? { ...r, status: overrides[r.id] } : r
  );

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function openModal() { setForm(EMPTY_FORM); setFormError(""); setShowModal(true); }
  function closeModal() { setShowModal(false); }

  async function saveRule() {
    if (!form.name.trim()) { setFormError("Name is required."); return; }
    setSaving(true);
    setFormError("");
    const { data, error } = await supabase
      .from("automation_rules")
      .insert({ name: form.name.trim(), trigger: form.trigger, action: form.action, client_id: form.client_id || null, status: form.status })
      .select();
    setSaving(false);
    if (error) { setFormError(error.message || "Failed to save rule."); return; }
    if (data?.length) setCreated((p) => [...(data as AutomationRule[]), ...p]);
    setShowModal(false);
  }

  async function toggleRule(rule: AutomationRule) {
    const newStatus: "active" | "paused" = rule.status === "active" ? "paused" : "active";
    const { error } = await supabase.from("automation_rules").update({ status: newStatus }).eq("id", rule.id);
    if (!error) setOverrides((p) => ({ ...p, [rule.id]: newStatus }));
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", flexShrink: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 25, fontWeight: 700, color: "var(--color-text-1)", letterSpacing: "-0.4px", margin: "0 0 4px 0" }}>Automation Rules</h1>
          <div style={{ fontSize: 13, color: "var(--color-text-3)" }}>What should AI say, do, pause, or escalate?</div>
        </div>
        <button onClick={openModal}
          style={{ fontSize: 13, fontWeight: 600, color: "var(--color-on-accent)", background: "var(--color-accent)", padding: "9px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 }}>
          + Create Rule
        </button>
      </div>

      {/* Scrollable content — flat rows, hairline separated */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {rules.map((rule) => (
          <div key={rule.id}
            style={{ padding: "14px 8px", margin: "0 -8px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 16, borderRadius: 6, transition: "background 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: cmix(mv(rule.mode), 9), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: `var(${mv(rule.mode)})` }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-1)", marginBottom: 2 }}>{rule.name}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-4)", display: "flex", gap: 8 }}>
                <span>When: {rule.trigger}</span>
                <span>·</span>
                <span>Then: {rule.action}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: `var(${mv(rule.mode)})`, background: cmix(mv(rule.mode), 10), padding: "2px 8px", borderRadius: 20 }}>
                {MODE_LABEL[rule.mode ?? ""] ?? rule.mode}
              </span>
              <button onClick={() => toggleRule(rule)}
                style={{ fontSize: 11, fontWeight: 600, color: `var(${sv(rule.status)})`, background: cmix(sv(rule.status), 10), padding: "2px 8px", borderRadius: 20, border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {rule.status}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Rule modal */}
      {showModal && (
        <div onClick={closeModal}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ width: 440, maxWidth: "calc(100vw - 40px)", background: "var(--color-card-bg)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-1)", letterSpacing: "-0.2px", margin: "0 0 18px 0" }}>Create Rule</h2>

            <div style={{ marginBottom: 14 }}>
              <label style={LABEL}>Name</label>
              <input type="text" value={form.name} placeholder="e.g. New lead instant reply"
                onChange={(e) => setForm({ ...form, name: e.target.value })} style={FIELD} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={LABEL}>Trigger</label>
              <select value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })} style={FIELD}>
                <option value="new_lead">new_lead</option>
                <option value="followup_due">followup_due</option>
                <option value="enrolled">enrolled</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={LABEL}>Action</label>
              <select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} style={FIELD}>
                <option value="send_sms_ai">send_sms_ai</option>
                <option value="escalate">escalate</option>
                <option value="pause">pause</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={LABEL}>Client</label>
              <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} style={FIELD}>
                <option value="">All clients</option>
                {(clients as Client[]).map((c) => (
                  <option key={c.id} value={c.id}>{c.name ?? c.id}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={LABEL}>Status</label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["active", "paused"] as const).map((s) => (
                  <button key={s} onClick={() => setForm({ ...form, status: s })}
                    style={{
                      flex: 1, fontSize: 13, fontWeight: 600, padding: "9px 0", borderRadius: 8, cursor: "pointer",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      color: form.status === s ? `var(${sv(s)})` : "var(--color-text-3)",
                      background: form.status === s ? cmix(sv(s), 10) : "transparent",
                      border: `1px solid ${form.status === s ? `var(${sv(s)})` : "var(--color-border)"}`,
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {formError && <div style={{ fontSize: 12, color: "var(--color-insight-2)", marginBottom: 14 }}>{formError}</div>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={closeModal} disabled={saving}
                style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-2)", background: "transparent", padding: "9px 16px", borderRadius: 8, border: "1px solid var(--color-border)", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Cancel
              </button>
              <button onClick={saveRule} disabled={saving}
                style={{ fontSize: 13, fontWeight: 600, color: "var(--color-on-accent)", background: "var(--color-accent)", padding: "9px 16px", borderRadius: 8, border: "none", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
