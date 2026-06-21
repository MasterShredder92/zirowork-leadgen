"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

// conv accent #6366F1 → --color-conv-accent (NEW) · manual-mode #F59E0B → --color-insight-3 · sendError #EF4444 → --color-insight-2

type Thread = {
  key: string;
  phone: string;
  tenant_id: string;
  name: string;
  last_message: string | null;
  last_at: string | null;
  unread: boolean;
};

type Msg = {
  id: string;
  direction?: string | null;
  message_body?: string | null;
  sent_at?: string | null;
  from_agent?: string | null;
  status?: string | null;
};

type RawLog = {
  id: string;
  recipient_phone: string;
  tenant_id: string;
  direction: string;
  recipient_name?: string | null;
  message_body?: string | null;
  sent_at?: string | null;
  from_agent?: string | null;
  status?: string | null;
};

export default function ConversationsView() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [takeover, setTakeover] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [loading, setLoading] = useState(true);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("ziro_message_log")
      .select("id, tenant_id, direction, recipient_phone, recipient_name, message_body, sent_at, from_agent, status")
      .order("sent_at", { ascending: false })
      .then(({ data, error }) => {
        if (error || !data) { setLoading(false); return; }
        const map: Record<string, Thread> = {};
        (data as RawLog[]).forEach((row) => {
          const key = row.recipient_phone + "|" + row.tenant_id;
          if (!map[key]) {
            map[key] = {
              key,
              phone: row.recipient_phone,
              tenant_id: row.tenant_id,
              name: row.recipient_name || row.recipient_phone,
              last_message: row.message_body ?? null,
              last_at: row.sent_at ?? null,
              unread: row.direction === "inbound",
            };
          } else if (row.direction === "inbound") {
            map[key].unread = true;
          }
        });
        setThreads(Object.values(map));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedPhone) return;
    const [phone, tenant_id] = selectedPhone.split("|");
    supabase
      .from("ziro_message_log")
      .select("id, direction, message_body, sent_at, from_agent")
      .eq("recipient_phone", phone)
      .eq("tenant_id", tenant_id)
      .order("sent_at", { ascending: true })
      .then(({ data }) => {
        setMessages(data ? (data as Msg[]) : []);
      });
  }, [selectedPhone]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function selectThread(t: Thread) {
    setSelectedPhone(t.key);
    setTakeover(false);
    setDraft("");
    setSendError("");
    setThreads((prev) => prev.map((r) => r.key === t.key ? { ...r, unread: false } : r));
  }

  async function handleTakeover() {
    if (!selectedPhone) return;
    const [phone, tenant_id] = selectedPhone.split("|");
    await supabase.from("leads").update({ followup_paused: true }).eq("phone", phone).eq("client_id", tenant_id);
    setTakeover(true);
  }

  async function sendReply() {
    if (!draft.trim() || !selectedPhone) return;
    const [phone, tenant_id] = selectedPhone.split("|");
    const thread = threads.find((t) => t.key === selectedPhone);
    const text = draft.trim();
    setSending(true);
    setSendError("");
    const { data, error } = await supabase.functions.invoke("send-operator-reply", {
      body: { tenant_id, phone, name: thread ? thread.name : null, body: text, from_agent: "OPERATOR" },
    });
    setSending(false);
    const respData = data as { ok?: boolean; error?: string; row?: Msg } | null;
    if (error || !respData || !respData.ok) {
      const reason = respData?.error || (error as Error | null)?.message || "send_failed";
      setSendError(
        reason === "opted_out"
          ? "This lead opted out of texts (replied STOP). You can't message them."
          : "Message failed to send. Please try again."
      );
      return;
    }
    const row: Msg = respData.row || {
      id: "op-" + Date.now(),
      direction: "outbound",
      message_body: text,
      sent_at: new Date().toISOString(),
      from_agent: "OPERATOR",
    };
    setMessages((prev) => [...prev, row]);
    setDraft("");
  }

  function fmtTime(iso: string | null | undefined): string {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
  }

  const selected = threads.find((t) => t.key === selectedPhone);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
        <h1 style={{ fontSize: 25, fontWeight: 700, color: "var(--color-text-1)", letterSpacing: "-0.4px", margin: "0 0 4px 0" }}>Conversations</h1>
        <div style={{ fontSize: 13, color: "var(--color-text-3)" }}>What is being said, what has AI handled, and what needs review?</div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Thread list */}
        <div style={{ width: 300, flexShrink: 0, borderRight: "1px solid var(--color-border)", overflowY: "auto" }}>
          {loading && (
            <div style={{ padding: 24, fontSize: 14, color: "var(--color-text-4)" }}>Loading…</div>
          )}
          {!loading && threads.length === 0 && (
            <div style={{ padding: 24, fontSize: 14, color: "var(--color-text-4)" }}>No messages yet.</div>
          )}
          {threads.map((t) => (
            <div
              key={t.key}
              onClick={() => selectThread(t)}
              onMouseEnter={() => setHoverKey(t.key)}
              onMouseLeave={() => setHoverKey(null)}
              style={{
                padding: "14px 16px",
                cursor: "pointer",
                borderBottom: "1px solid var(--color-border)",
                background:
                  selectedPhone === t.key
                    ? "color-mix(in srgb, var(--color-conv-accent) 8%, transparent)"
                    : hoverKey === t.key
                    ? "var(--color-row-hover)"
                    : "transparent",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {t.unread && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-conv-accent)", flexShrink: 0 }} />}
                  <span style={{ fontSize: 14, fontWeight: t.unread ? 600 : 500, color: "var(--color-text-1)" }}>{t.name}</span>
                </div>
                <span style={{ fontSize: 12, color: "var(--color-text-4)", whiteSpace: "nowrap", marginLeft: 8 }}>{fmtTime(t.last_at)}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--color-text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {t.last_message}
              </div>
            </div>
          ))}
        </div>

        {/* Message thread */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {!selectedPhone && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 14, color: "var(--color-text-4)" }}>Select a conversation</span>
            </div>
          )}

          {selectedPhone && (
            <>
              {/* Thread header */}
              <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-1)" }}>{selected ? selected.name : ""}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-4)" }}>{selected ? selected.phone : ""}</div>
                </div>
                {!takeover && (
                  <button
                    onClick={handleTakeover}
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--color-conv-accent)",
                      background: "color-mix(in srgb, var(--color-conv-accent) 10%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--color-conv-accent) 30%, transparent)",
                      borderRadius: 6,
                      padding: "6px 14px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Take Over
                  </button>
                )}
                {takeover && (
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--color-insight-3)",
                    background: "color-mix(in srgb, var(--color-insight-3) 10%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--color-insight-3) 30%, transparent)",
                    borderRadius: 6,
                    padding: "4px 10px",
                  }}>
                    Manual Mode
                  </span>
                )}
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                {messages.map((m) => {
                  const out = m.direction === "outbound";
                  return (
                    <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: out ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "70%",
                        padding: "9px 13px",
                        borderRadius: out ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                        background: out ? "var(--color-conv-accent)" : "var(--color-card-bg)",
                        color: out ? "#fff" : "var(--color-text-1)",
                        fontSize: 14,
                        lineHeight: 1.5,
                      }}>
                        {m.message_body}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-text-4)", marginTop: 3 }}>
                        {out && m.from_agent ? m.from_agent + " · " : ""}{fmtTime(m.sent_at)}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Compose box — only visible after takeover */}
              {takeover && (
                <div style={{ padding: "12px 20px", borderTop: "1px solid var(--color-border)", flexShrink: 0 }}>
                  {sendError && (
                    <div style={{ fontSize: 12, color: "var(--color-insight-2)", marginBottom: 8 }}>{sendError}</div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                      placeholder="Type a reply… (Enter to send)"
                      rows={2}
                      style={{
                        flex: 1,
                        resize: "none",
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: "1px solid var(--color-border)",
                        background: "var(--color-input-bg)",
                        color: "var(--color-text-1)",
                        fontSize: 14,
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={sendReply}
                      disabled={sending || !draft.trim()}
                      style={{
                        padding: "0 18px",
                        borderRadius: 6,
                        border: "none",
                        cursor: sending || !draft.trim() ? "not-allowed" : "pointer",
                        background: "var(--color-conv-accent)",
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 600,
                        fontFamily: "inherit",
                        opacity: sending || !draft.trim() ? 0.5 : 1,
                      }}
                    >
                      {sending ? "…" : "Send"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
