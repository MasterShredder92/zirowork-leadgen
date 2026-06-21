"use client";

import { useState } from "react";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { supabase } from "@/lib/supabase/client";

// #EF4444 (open badge, card left-rule, error) → --color-insight-2
// #F59E0B (doctrine rule + strong)            → --color-insight-3
// #3B82F6 (outbound bubble)                   → --color-status-requested

type Escalation = {
  id: string;
  contact_name?: string | null;
  contact_phone?: string | null;
  trigger_reason?: string | null;
  original_message?: string | null;
  ziro_response?: string | null;
  created_at?: string | null;
  tenant_id?: string | null;
  resolved_at?: string | null;
};

type Msg = {
  id: string;
  direction?: string | null;
  message_body?: string | null;
  sent_at?: string | null;
  from_agent?: string | null;
};

export default function EscalationsView() {
  const { data: rawEsc } = useRealtimeTable<Escalation>("ziro_messaging_escalations");
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const escalations = rawEsc.filter((e) => !e.resolved_at && !resolvedIds.has(e.id));

  const [threads, setThreads] = useState<Record<string, Msg[]>>({});
  const [loadingThread, setLoadingThread] = useState<Record<string, boolean>>({});
  const [expandedThread, setExpandedThread] = useState<Record<string, boolean>>({});
  const [acting, setActing] = useState<Record<string, "resolve" | "forward" | null>>({});
  const [forwardError, setForwardError] = useState<Record<string, string | null>>({});

  function loadThread(esc: Escalation) {
    if (threads[esc.id] !== undefined) {
      setExpandedThread((p) => ({ ...p, [esc.id]: !p[esc.id] }));
      return;
    }
    setLoadingThread((p) => ({ ...p, [esc.id]: true }));
    supabase
      .from("ziro_message_log")
      .select("id, direction, message_body, sent_at, from_agent")
      .eq("recipient_phone", esc.contact_phone)
      .eq("tenant_id", esc.tenant_id)
      .order("sent_at", { ascending: true })
      .then(({ data, error }) => {
        setLoadingThread((p) => ({ ...p, [esc.id]: false }));
        if (error) { console.error(error); return; }
        setThreads((p) => ({ ...p, [esc.id]: (data as Msg[]) ?? [] }));
        setExpandedThread((p) => ({ ...p, [esc.id]: true }));
      });
  }

  function resolveEscalation(id: string) {
    setActing((p) => ({ ...p, [id]: "resolve" }));
    supabase
      .from("ziro_messaging_escalations")
      .update({ resolved_at: new Date().toISOString(), resolved_by: "operator" })
      .eq("id", id)
      .then(({ error }) => {
        setActing((p) => ({ ...p, [id]: null }));
        if (error) { console.error(error); return; }
        setResolvedIds((p) => { const s = new Set(p); s.add(id); return s; });
      });
  }

  async function forwardToStudio(esc: Escalation) {
    setActing((p) => ({ ...p, [esc.id]: "forward" }));
    setForwardError((p) => ({ ...p, [esc.id]: null }));
    const { data: studioClient, error: clientErr } = await supabase
      .from("clients")
      .select("studio_phone, name")
      .eq("id", esc.tenant_id)
      .single();
    const sc = studioClient as { studio_phone?: string | null; name?: string | null } | null;
    if (clientErr || !sc || !sc.studio_phone) {
      setActing((p) => ({ ...p, [esc.id]: null }));
      setForwardError((p) => ({ ...p, [esc.id]: "No studio phone on file for this client." }));
      return;
    }
    const body = `ESCALATION: ${esc.contact_name} needs attention. ${esc.trigger_reason}. Original message: ${esc.original_message}`;
    const { data, error } = await supabase.functions.invoke("send-operator-reply", {
      body: { tenant_id: esc.tenant_id, phone: sc.studio_phone, name: sc.name, body, from_agent: "OPERATOR_FORWARD" },
    });
    setActing((p) => ({ ...p, [esc.id]: null }));
    if (error || !data || !(data as { ok?: boolean }).ok) {
      setForwardError((p) => ({ ...p, [esc.id]: "Forward failed to send. Please try again." }));
      return;
    }
    resolveEscalation(esc.id);
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: 25, fontWeight: 700, color: "var(--color-text-1)", letterSpacing: "-0.4px", margin: 0 }}>Escalations</h1>
          {escalations.length > 0 && (
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-insight-2)", background: "color-mix(in srgb, var(--color-insight-2) 9%, transparent)", padding: "3px 10px", borderRadius: 20 }}>
              {escalations.length} open
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: "var(--color-text-3)" }}>What should not be handled by automation?</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {/* Doctrine callout — flat, left rule only */}
        <div style={{ paddingLeft: 12, borderLeft: "2px solid var(--color-insight-3)", marginBottom: 24, fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.5 }}>
          <strong style={{ color: "var(--color-insight-3)" }}>Escalation rule:</strong> AI handles new enrollment conversations only. Enrolled students, billing, refunds, angry parents, and cancellations are forwarded to the studio — not handled by ZiroWork.
        </div>

        {escalations.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--color-text-4)", fontSize: 14 }}>No open escalations.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {escalations.map((esc) => (
              <div key={esc.id} style={{ padding: "16px 0 16px 14px", borderLeft: "3px solid var(--color-insight-2)", borderBottom: "1px solid var(--color-border)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-1)" }}>{esc.contact_name}</span>
                      <span style={{ fontSize: 12, color: "var(--color-text-4)" }}>{esc.contact_phone}</span>
                    </div>
                    <div style={{ fontSize: 14, color: "var(--color-text-2)", marginBottom: 4 }}>
                      <strong style={{ color: "var(--color-text-1)" }}>Reason:</strong> {esc.trigger_reason}
                    </div>
                    {esc.original_message && (
                      <div style={{ fontSize: 13, color: "var(--color-text-3)", marginBottom: 4 }}>
                        <strong>Original:</strong> {esc.original_message}
                      </div>
                    )}
                    {esc.ziro_response && (
                      <div style={{ fontSize: 13, color: "var(--color-text-3)", marginBottom: 4 }}>
                        <strong>Ziro replied:</strong> {esc.ziro_response}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: "var(--color-text-4)", marginTop: 4 }}>
                      Opened {esc.created_at ? new Date(esc.created_at).toLocaleString() : ""}
                    </div>

                    {/* Thread toggle */}
                    <button
                      onClick={() => loadThread(esc)}
                      style={{ marginTop: 10, fontSize: 12, color: "var(--color-accent)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {loadingThread[esc.id] ? "Loading thread…" : expandedThread[esc.id] ? "Hide conversation" : "Show conversation"}
                    </button>

                    {/* Inline conversation thread */}
                    {expandedThread[esc.id] && threads[esc.id] && (
                      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                        {threads[esc.id].length === 0 ? (
                          <div style={{ fontSize: 12, color: "var(--color-text-4)" }}>No messages found.</div>
                        ) : threads[esc.id].map((msg) => (
                          <div key={msg.id} style={{
                            fontSize: 13, color: "var(--color-text-2)", padding: "6px 10px",
                            background: msg.direction === "inbound" ? "var(--color-bg)" : "color-mix(in srgb, var(--color-status-requested) 6%, transparent)",
                            borderRadius: 6, alignSelf: msg.direction === "inbound" ? "flex-start" : "flex-end",
                            maxWidth: "85%",
                          }}>
                            <div style={{ fontSize: 11, color: "var(--color-text-4)", marginBottom: 2 }}>
                              {msg.direction === "inbound" ? "Lead" : (msg.from_agent ?? "Ziro")} · {msg.sent_at ? new Date(msg.sent_at).toLocaleString() : ""}
                            </div>
                            {msg.message_body}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => forwardToStudio(esc)}
                        disabled={!!acting[esc.id]}
                        style={{ padding: "6px 14px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: acting[esc.id] ? "not-allowed" : "pointer", whiteSpace: "nowrap", fontFamily: "'Plus Jakarta Sans', sans-serif", opacity: acting[esc.id] ? 0.6 : 1 }}>
                        {acting[esc.id] === "forward" ? "Sending…" : "Forward to Studio"}
                      </button>
                      <button
                        onClick={() => resolveEscalation(esc.id)}
                        disabled={!!acting[esc.id]}
                        style={{ padding: "6px 14px", background: "transparent", color: "var(--color-text-3)", border: "1px solid var(--color-border)", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: acting[esc.id] ? "not-allowed" : "pointer", whiteSpace: "nowrap", fontFamily: "'Plus Jakarta Sans', sans-serif", opacity: acting[esc.id] ? 0.6 : 1 }}>
                        {acting[esc.id] === "resolve" ? "Resolving…" : "Resolve"}
                      </button>
                    </div>
                    {forwardError[esc.id] && (
                      <div style={{ fontSize: 11, color: "var(--color-insight-2)", maxWidth: 220, textAlign: "right" }}>{forwardError[esc.id]}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
