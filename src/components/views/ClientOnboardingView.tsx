"use client";
import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { useClients } from "@/hooks/tables";
import { supabase } from "@/lib/supabase/client";
import OnboardForm from "@/components/forms/OnboardForm";

type ClientRow = {
  id: string;
  name: string;
  city: string;
  state: string;
  status: string;
  sms_number: string | null;
  lead_form_webhook: string | null;
  protected_slots: boolean;
  brand_assets: boolean;
  automation_rules: boolean;
  integrations: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

const CHECKLIST = [
  { key: "sms_number",        label: "SMS number assigned",          derived: true },
  { key: "lead_form_webhook", label: "Lead form webhook configured", derived: true },
  { key: "protected_slots",   label: "Protected slots confirmed" },
  { key: "brand_assets",      label: "Brand assets uploaded" },
  { key: "automation_rules",  label: "Automation rules reviewed" },
  { key: "integrations",      label: "Integrations reviewed" },
] as const;

export default function ClientOnboardingView() {
  const { data: clientsData, refetch } = useClients();
  const clients = (clientsData || []) as ClientRow[];
  const [wizardOpen, setWizardOpen] = useState(false);
  const pending = clients.filter((c) => c.status === "onboarding");

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 25, fontWeight: 700, color: "var(--color-text-1)", letterSpacing: "-0.4px", margin: "0 0 4px 0" }}>Client Onboarding</h1>
          <div style={{ fontSize: 13, color: "var(--color-text-3)" }}>What is missing before a client can launch?</div>
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "8px 16px",
            background: "var(--color-accent)",
            color: "var(--color-on-accent)",
            border: "none",
            borderRadius: 7,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <Plus size={14} />
          New Client
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {pending.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "var(--color-text-4)", fontSize: 14 }}>
            No clients currently onboarding.
          </div>
        ) : (
          <div>
            {pending.map((client) => {
              const done = CHECKLIST.filter((item) => client[item.key]).length;
              const pct = Math.round((done / CHECKLIST.length) * 100);
              return (
                <div key={client.id} style={{ paddingTop: 24, paddingBottom: 28, borderBottom: "1px solid var(--color-border)" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-1)", marginBottom: 2 }}>{client.name}</div>
                      <div style={{ fontSize: 13, color: "var(--color-text-4)" }}>{client.city}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 29, fontWeight: 700, color: pct === 100 ? "var(--color-status-scheduled)" : "var(--color-accent)", letterSpacing: "-0.6px", fontVariantNumeric: "tabular-nums" }}>{pct}%</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-4)" }}>{done}/{CHECKLIST.length} complete</div>
                    </div>
                  </div>
                  <div style={{ height: 4, background: "var(--color-border)", borderRadius: 4, marginBottom: 16 }}>
                    <div style={{ height: "100%", width: pct + "%", background: pct === 100 ? "var(--color-status-scheduled)" : "var(--color-accent)", borderRadius: 4, transition: "width 0.3s" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
                    {CHECKLIST.map((item) => {
                      const checked = !!client[item.key];
                      const isDerived = "derived" in item && item.derived;
                      return (
                        <div
                          key={item.key}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 13,
                            color: checked ? "var(--color-text-2)" : "var(--color-text-4)",
                            cursor: isDerived ? "default" : "pointer",
                          }}
                          onClick={async () => {
                            if (isDerived) return;
                            await supabase
                              .from("clients")
                              .update({ [item.key]: !client[item.key] })
                              .eq("id", client.id);
                            refetch();
                          }}
                        >
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              background: checked ? "var(--color-status-scheduled)" : "var(--color-border)",
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {checked && <Check size={10} color="var(--color-on-accent)" strokeWidth={3} />}
                          </div>
                          {item.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {wizardOpen && (
        <div style={{ position: "fixed", inset: 0, background: "var(--color-scrim)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <OnboardForm
            standalone={false}
            onSuccess={() => {
              refetch();
              setWizardOpen(false);
            }}
            onCancel={() => setWizardOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
