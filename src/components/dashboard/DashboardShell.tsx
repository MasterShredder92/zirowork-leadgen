"use client";

import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import LoginView from "./LoginView";
import PortalOverview from "./PortalOverview";
import PortalPipeline from "./PortalPipeline";
import PortalUpload from "./PortalUpload";
import PortalMyBusiness from "./PortalMyBusiness";
import PortalBilling from "./PortalBilling";

type DashboardView = "overview" | "pipeline" | "upload" | "business" | "billing" | "login";

const NAV: { key: DashboardView; label: string; icon: string }[] = [
  { key: "overview", label: "Overview",    icon: "◈" },
  { key: "pipeline", label: "Pipeline",    icon: "⟶" },
  { key: "upload",   label: "Upload",      icon: "↑" },
  { key: "business", label: "My Business", icon: "⊕" },
  { key: "billing",  label: "Billing",     icon: "▭" },
];

// Dashboard's own theme — kept isolated from globals.css. Hex literals preserved on purpose.
const THEME_CSS = `
  .zw-dash, .zw-dash *, .zw-dash *::before, .zw-dash *::after { box-sizing: border-box; }

  /* Light theme — warm cream/sand palette, pumpkin accent */
  .zw-dash {
    --bg:       #F7F2E8;
    --surface:  #FFFFFF;
    --sidebar:  #E8DCC8;
    --border:   rgba(0,0,0,0.07);
    --bmed:     rgba(0,0,0,0.11);
    --hover:    rgba(0,0,0,0.04);
    --t1:       #162833;
    --t2:       #3D4F58;
    --t3:       #6B7880;
    --t4:       #8C9298;
    --accent:   #D9641C;
    --accent-bg: rgba(217,100,28,0.09);

    width: 100%;
    height: 100vh;
    display: flex;
    background: var(--bg);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--t1);
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
    font-size: 14px;
    line-height: 1.5;
  }

  /* Dark theme — neutral graphite, pumpkin accent (matches operator CRM) */
  html[data-theme="dark"] .zw-dash {
    --bg:       #1A1C1F;
    --surface:  #26292D;
    --sidebar:  #141619;
    --border:   rgba(255,255,255,0.08);
    --bmed:     rgba(255,255,255,0.13);
    --hover:    rgba(255,255,255,0.05);
    --t1:       #F5F4F1;
    --t2:       #B0ADA9;
    --t3:       #8A8784;
    --t4:       #63605D;
    --accent:   #FD802E;
    --accent-bg: rgba(253,128,46,0.15);
  }

  /* ZiroWork bolt logo — swaps with theme */
  .zw-dash .zw-logo {
    flex-shrink: 0;
    background-image: url('/brand/zw-bolt-light.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }
  html[data-theme="dark"] .zw-dash .zw-logo {
    background-image: url('/brand/zw-bolt-dark.png');
  }

  .zw-dash ::-webkit-scrollbar { width: 4px; height: 4px; }
  .zw-dash ::-webkit-scrollbar-track { background: transparent; }
  .zw-dash ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 2px; }
  html[data-theme="dark"] .zw-dash ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
`;

function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark"
  );

  function toggle() {
    const next = !dark;
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try { localStorage.setItem("zw-portal-theme", next ? "dark" : "light"); } catch { /* ignore */ }
    setDark(next);
  }

  return (
    <button onClick={toggle} title="Toggle light / dark"
      style={{
        display: "flex", alignItems: "center", gap: 8, width: "100%",
        padding: "7px 9px", marginBottom: 10, borderRadius: 7,
        background: "transparent", border: "1px solid var(--border)",
        color: "var(--t2)", cursor: "pointer", fontFamily: "inherit",
        fontSize: 13, fontWeight: 500,
      }}>
      {dark
        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>}
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}

function Sidebar({ view, setView, schoolName, onLogout }: {
  view: DashboardView;
  setView: (v: DashboardView) => void;
  schoolName: string;
  onLogout: () => void;
}) {
  const s: Record<string, React.CSSProperties> = {
    sidebar: {
      width: 220, flexShrink: 0, height: "100%",
      background: "var(--sidebar)",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
    },
    logoWrap: {
      padding: "20px 18px 16px",
      borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center", gap: 9,
    },
    logoText: { fontSize: 15, fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.3px" },
    logoSub: { fontSize: 12, color: "var(--t3)", fontWeight: 500 },
    nav: { flex: 1, padding: "10px 10px" },
    footer: {
      padding: "12px 14px",
      borderTop: "1px solid var(--border)",
    },
    schoolName: { fontSize: 13, fontWeight: 600, color: "var(--t2)", marginBottom: 2 },
    schoolSub: { fontSize: 12, color: "var(--t4)", marginBottom: 10 },
    logoutBtn: {
      fontSize: 12, color: "var(--t3)", background: "none",
      border: "none", cursor: "pointer", padding: 0,
      fontFamily: "inherit", fontWeight: 500,
    },
  };

  const navItem = (active: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 10,
    padding: "8px 10px", borderRadius: 7, cursor: "pointer",
    background: active ? "var(--hover)" : "transparent",
    marginBottom: 2, transition: "background 0.1s",
    userSelect: "none",
  });
  const navIcon = (active: boolean): React.CSSProperties => ({
    fontSize: 15, width: 18, textAlign: "center", flexShrink: 0,
    color: active ? "var(--accent)" : "var(--t3)",
  });
  const navLabel = (active: boolean): React.CSSProperties => ({
    fontSize: 14, fontWeight: active ? 600 : 500,
    color: active ? "var(--t1)" : "var(--t2)",
  });

  return (
    <div style={s.sidebar}>
      <div style={s.logoWrap}>
        <div className="zw-logo" style={{ width: 26, height: 26 }} />
        <div>
          <div style={s.logoText}>ZiroWork</div>
          <div style={s.logoSub}>Client Portal</div>
        </div>
      </div>

      <div style={s.nav}>
        {NAV.map(item => (
          <div key={item.key} style={navItem(view === item.key)} onClick={() => setView(item.key)}>
            <span style={navIcon(view === item.key)}>{item.icon}</span>
            <span style={navLabel(view === item.key)}>{item.label}</span>
          </div>
        ))}
      </div>

      <div style={s.footer}>
        <ThemeToggle />
        <div style={s.schoolName}>{schoolName || "Your School"}</div>
        <div style={s.schoolSub}>Client account</div>
        <button style={s.logoutBtn} onClick={onLogout}>Sign out</button>
      </div>
    </div>
  );
}

function Portal({ user, tenantId }: { user: { id: string }; tenantId: string }) {
  const [view, setView] = useState<DashboardView>("overview");
  const [schoolName, setSchoolName] = useState("");

  useEffect(() => {
    supabase
      .from("agent_tenants")
      .select("name")
      .eq("tenant_id", tenantId)
      .single()
      .then(({ data }) => { if (data) setSchoolName((data as { name: string }).name); });
  }, [tenantId]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  const main: React.CSSProperties = {
    display: "flex", width: "100%", height: "100%",
  };
  const content: React.CSSProperties = {
    flex: 1, height: "100%", overflow: "hidden", background: "var(--bg)",
  };

  return (
    <div style={main}>
      <Sidebar view={view} setView={setView} schoolName={schoolName} onLogout={handleLogout} />
      <div style={content}>
        {view === "overview" && <PortalOverview tenantId={tenantId} />}
        {view === "pipeline" && <PortalPipeline tenantId={tenantId} />}
        {view === "upload"   && <PortalUpload   tenantId={tenantId} userId={user.id} />}
        {view === "business" && <PortalMyBusiness tenantId={tenantId} />}
        {view === "billing"  && <PortalBilling tenantId={tenantId} />}
      </div>
    </div>
  );
}

// ?preview bypass: /dashboard?preview renders the portal with sample data, no login.
function readPreviewFlag(): boolean {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).has("preview");
}

export default function DashboardShell() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isPreview] = useState(readPreviewFlag);
  const [checking, setChecking] = useState(() => !readPreviewFlag());

  useEffect(() => {
    // In preview, skip auth entirely — sample data renders without a session.
    if (isPreview) return;

    // Check for existing session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase
          .from("client_users")
          .select("tenant_id")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data: cu }) => {
            if (cu) {
              setUser(session.user);
              setTenantId((cu as { tenant_id: string }).tenant_id);
            }
            setChecking(false);
          });
      } else {
        setChecking(false);
      }
    });
  }, [isPreview]);

  function handleLogin(u: User, tid: string) {
    setUser(u);
    setTenantId(tid);
  }

  return (
    <>
      <style>{THEME_CSS}</style>
      {isPreview ? (
        <div className="zw-dash" style={{ flexDirection: "column" }}>
          <div style={{
            flexShrink: 0, padding: "5px 14px", textAlign: "center",
            background: "var(--accent)", color: "#fff",
            fontSize: 12, fontWeight: 600, letterSpacing: "0.02em",
          }}>
            Preview — sample data, not a real account.
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Portal user={{ id: "preview" }} tenantId="preview" />
          </div>
        </div>
      ) : checking ? (
        <div className="zw-dash" style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: "var(--t3)", fontSize: 14 }}>Loading…</div>
        </div>
      ) : !user || !tenantId ? (
        <div className="zw-dash">
          <LoginView onLogin={handleLogin} />
        </div>
      ) : (
        <div className="zw-dash">
          <Portal user={user} tenantId={tenantId} />
        </div>
      )}
    </>
  );
}
