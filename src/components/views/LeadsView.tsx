"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClients } from "@/hooks/tables";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { supabase } from "@/lib/supabase/client";

// stages: new #818CF8→--color-insight-0 · contacted #60A5FA→--color-stage-contacted(NEW) · qualified #38BDF8→--color-stage-qualified(NEW) · follow_up #F59E0B→--color-insight-3 · enrolled #22C55E→--color-insight-1 · lost #EF4444→--color-insight-2
// programs: Piano→--color-program-piano · Guitar→--color-program-guitar · Voice→--color-program-voice · Drums→--color-program-drums · default #6B7280→--color-insight-5

type LeadCard = {
  id: string;
  client_id?: string | null;
  stage?: string | null;
  days_in_stage?: number | null;
  notes?: string | null;
  source?: string | null;
  priority?: string | null;
  parent_name?: string | null;
  student_name?: string | null;
  client_name?: string | null;
  program?: string | null;
  age?: string | null;
  phone?: string | null;
  email?: string | null;
  utm?: { utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null } | null;
};

const STAGES = [
  { id: "new",       label: "New",       varName: "--color-insight-0" },
  { id: "contacted", label: "Contacted", varName: "--color-stage-contacted" },
  { id: "qualified", label: "Qualified", varName: "--color-stage-qualified" },
  { id: "follow_up", label: "Follow-Up", varName: "--color-insight-3" },
  { id: "enrolled",  label: "Enrolled",  varName: "--color-insight-1" },
  { id: "lost",      label: "Lost",      varName: "--color-insight-2" },
];

const STAGE_IDS = ["new", "contacted", "qualified", "follow_up", "enrolled"];

const PROGRAM_VAR: Record<string, string> = {
  Piano: "--color-program-piano",
  Guitar: "--color-program-guitar",
  Voice: "--color-program-voice",
  Drums: "--color-program-drums",
};

function programVar(p: string | null | undefined): string {
  return PROGRAM_VAR[p ?? ""] ?? "--color-insight-5";
}

function canAdvance(stage: string | null | undefined): boolean {
  const idx = STAGE_IDS.indexOf(stage ?? "");
  return idx !== -1 && idx < STAGE_IDS.length - 1;
}

export default function LeadsView() {
  const router = useRouter();
  const [clientId, setClientId] = useState<string | null>(null);
  const { data: leadsData } = useRealtimeTable<LeadCard>("leads", clientId ? { client_id: clientId } : undefined);
  const { data: clients } = useClients();
  const [overrides, setOverrides] = useState<Record<string, Partial<LeadCard>>>({});
  const items: LeadCard[] = (leadsData ?? []).map(l => overrides[l.id] ? { ...l, ...overrides[l.id] } : l);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = items.find(l => l.id === selectedId) ?? null;

  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);

  async function handleAdvance(lead: LeadCard) {
    const idx = STAGE_IDS.indexOf(lead.stage ?? "");
    if (idx === -1 || idx >= STAGE_IDS.length - 1) return;
    const nextStage = STAGE_IDS[idx + 1];
    setOverrides(p => ({ ...p, [lead.id]: { ...p[lead.id], stage: nextStage, days_in_stage: 0 } }));
    await supabase.from("leads").update({ stage: nextStage, days_in_stage: 0, stage_entered_at: new Date().toISOString() }).eq("id", lead.id);
  }

  async function handleMoveStage(newStage: string) {
    if (!selectedId) return;
    const id = selectedId;
    setOverrides(p => ({ ...p, [id]: { ...p[id], stage: newStage, days_in_stage: 0 } }));
    await supabase.from("leads").update({ stage: newStage, days_in_stage: 0, stage_entered_at: new Date().toISOString() }).eq("id", id);
  }

  async function handleMarkEnrolled() {
    if (!selectedId) return;
    const id = selectedId;
    setOverrides(p => ({ ...p, [id]: { ...p[id], stage: "enrolled", days_in_stage: 0 } }));
    await supabase.from("leads").update({ stage: "enrolled", days_in_stage: 0, stage_entered_at: new Date().toISOString() }).eq("id", id);
  }

  async function handleSaveNote() {
    if (!selectedId || !noteText.trim()) return;
    const id = selectedId;
    setNoteSaving(true);
    const updated = noteText.trim();
    setOverrides(p => ({ ...p, [id]: { ...p[id], notes: updated } }));
    await supabase.from("leads").update({ notes: updated }).eq("id", id);
    setNoteText("");
    setNoteSaving(false);
  }

  function openDetail(lead: LeadCard) {
    setSelectedId(lead.id);
    setNoteText("");
  }

  const byStage = (id: string) => items.filter(l => l.stage === id);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--color-bg)" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 25, fontWeight: 700, color: "var(--color-text-1)", letterSpacing: "-0.4px", margin: "0 0 4px 0" }}>Leads</h1>
            <div style={{ fontSize: 13, color: "var(--color-text-3)" }}>Who is in the pipeline and what is the next move?</div>
          </div>
          <select
            value={clientId ?? ""}
            onChange={e => setClientId(e.target.value || null)}
            style={{ fontSize: 14, color: "var(--color-text-2)", background: "var(--color-card-bg)", border: "1px solid var(--color-border)", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}
          >
            <option value="">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Lead Detail Panel */}
      {selected && (
        <div style={{
          position: "fixed", top: 0, right: 0, width: 380, height: "100%",
          background: "var(--color-card-bg)", borderLeft: "1px solid var(--color-border)",
          display: "flex", flexDirection: "column", zIndex: 200, overflowY: "auto",
        }}>
          {/* Panel header */}
          <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--color-border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-1)" }}>{selected.student_name || selected.parent_name}</div>
            <button onClick={() => setSelectedId(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-text-3)", fontSize: 19, lineHeight: 1, padding: 4 }}>✕</button>
          </div>

          {/* Fields */}
          <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
            {([
              ["Parent", selected.parent_name],
              ["Student", selected.student_name],
              ["Phone", selected.phone],
              ["Email", selected.email],
              ["Instrument", selected.program],
              ["Age", selected.age],
              ["Source", selected.source],
              ["UTM Source", selected.utm && selected.utm.utm_source],
              ["UTM Medium", selected.utm && selected.utm.utm_medium],
              ["UTM Campaign", selected.utm && selected.utm.utm_campaign],
              ["Priority", selected.priority],
            ] as [string, string | null | undefined][]).filter(([, v]) => v != null && v !== "").map(([label, value]) => (
              <div key={label} style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 12, color: "var(--color-text-4)", width: 90, flexShrink: 0, paddingTop: 2 }}>{label}</span>
                <span style={{ fontSize: 13, color: "var(--color-text-1)" }}>{String(value)}</span>
              </div>
            ))}
            {/* Stage badge */}
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--color-text-4)", width: 90, flexShrink: 0, paddingTop: 2 }}>Stage</span>
              {(() => {
                const s = STAGES.find(x => x.id === selected.stage);
                return (
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: s ? `var(${s.varName})` : "var(--color-text-2)",
                    background: s ? `color-mix(in srgb, var(${s.varName}) 10%, transparent)` : "transparent",
                    padding: "2px 8px", borderRadius: 20,
                  }}>
                    {s ? s.label : selected.stage}
                  </span>
                );
              })()}
            </div>
            {/* Notes */}
            {selected.notes && (
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 12, color: "var(--color-text-4)", width: 90, flexShrink: 0, paddingTop: 2 }}>Notes</span>
                <span style={{ fontSize: 13, color: "var(--color-text-2)", fontStyle: "italic" }}>{selected.notes}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ padding: "0 24px 20px", display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
            <div style={{ height: 1, background: "var(--color-border)", margin: "4px 0" }} />

            {/* Move stage */}
            <div>
              <div style={{ fontSize: 12, color: "var(--color-text-4)", marginBottom: 6 }}>Move Stage</div>
              <select
                value={selected.stage ?? ""}
                onChange={e => handleMoveStage(e.target.value)}
                style={{ width: "100%", fontSize: 13, color: "var(--color-text-2)", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 6, padding: "6px 8px", cursor: "pointer" }}
              >
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>

            {/* Mark enrolled */}
            {selected.stage !== "enrolled" && (
              <button
                onClick={handleMarkEnrolled}
                style={{ width: "100%", fontSize: 13, fontWeight: 600, color: "#fff", background: "var(--color-insight-1)", border: "none", borderRadius: 7, padding: "8px 0", cursor: "pointer" }}
              >
                Mark Enrolled
              </button>
            )}

            {/* Add note */}
            <div>
              <div style={{ fontSize: 12, color: "var(--color-text-4)", marginBottom: 6 }}>Add Note</div>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                rows={3}
                placeholder="Type a note…"
                style={{ width: "100%", fontSize: 13, color: "var(--color-text-1)", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 6, padding: "6px 8px", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
              />
              <button
                onClick={handleSaveNote}
                disabled={noteSaving || !noteText.trim()}
                style={{ marginTop: 6, width: "100%", fontSize: 13, fontWeight: 600, color: "var(--color-text-1)", background: "transparent", border: "1px solid var(--color-border)", borderRadius: 7, padding: "6px 0", cursor: noteText.trim() ? "pointer" : "default", opacity: noteText.trim() ? 1 : 0.4 }}
              >
                {noteSaving ? "Saving…" : "Save Note"}
              </button>
            </div>

            {/* View conversation */}
            <button
              onClick={() => { setSelectedId(null); router.push("/conversations"); }}
              style={{ width: "100%", fontSize: 13, fontWeight: 600, color: "var(--color-insight-0)", background: "transparent", border: "1px solid var(--color-insight-0)", borderRadius: 7, padding: "8px 0", cursor: "pointer" }}
            >
              View Conversation →
            </button>
          </div>
        </div>
      )}

      {/* Kanban */}
      <div style={{ flex: 1, overflowX: "auto", padding: "20px 24px" }}>
        <div style={{ display: "flex", gap: 24, height: "100%", minWidth: STAGES.length * 240 }}>
          {STAGES.map(stage => {
            const cols = byStage(stage.id);
            return (
              <div key={stage.id} style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 8, marginBottom: 4, borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: `var(${stage.varName})`, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-4)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{stage.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--color-text-4)", fontVariantNumeric: "tabular-nums" }}>{cols.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", overflowY: "auto" }}>
                  {cols.map(lead => (
                    <div
                      key={lead.id}
                      onClick={() => openDetail(lead)}
                      onMouseEnter={() => setHoverId(lead.id)}
                      onMouseLeave={() => setHoverId(null)}
                      style={{
                        padding: "12px 8px", margin: "0 -8px", borderBottom: "1px solid var(--color-border)",
                        cursor: "pointer", borderRadius: 6, transition: "background 0.15s",
                        background: hoverId === lead.id ? "var(--color-hover)" : "transparent",
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-1)", marginBottom: 4 }}>{lead.parent_name || lead.student_name}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-3)", marginBottom: 8 }}>{lead.student_name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          color: `var(${programVar(lead.program)})`,
                          background: `color-mix(in srgb, var(${programVar(lead.program)}) 10%, transparent)`,
                          padding: "2px 7px", borderRadius: 20,
                        }}>
                          {lead.program}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--color-text-4)", marginLeft: "auto" }}>{lead.client_name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
                        {(lead.days_in_stage ?? 0) >= 5 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--color-insight-3)" }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--color-insight-3)" }} />
                            {lead.days_in_stage}d in stage
                          </div>
                        )}
                        {canAdvance(lead.stage) && (
                          <button
                            onClick={e => { e.stopPropagation(); handleAdvance(lead); }}
                            style={{ marginLeft: "auto", fontSize: 11, color: "var(--color-text-3)", background: "transparent", border: "none", cursor: "pointer", padding: "2px 4px", borderRadius: 4, lineHeight: 1 }}
                          >
                            → Next
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {cols.length === 0 && (
                    <div style={{ padding: "16px 0", textAlign: "center", fontSize: 13, color: "var(--color-text-4)" }}>Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
