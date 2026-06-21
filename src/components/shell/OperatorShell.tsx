"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/app/providers";
import {
  LayoutDashboard, Building2, ClipboardList, Megaphone, Globe,
  Inbox, MessageSquare, AlertTriangle, CalendarCheck, UserCheck,
  BarChart2, Sparkles, Zap, Plug,
  Settings as SettingsIcon, Search, ChevronRight, Circle, ChevronsUpDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import UserMenu from "./UserMenu";

type NavItem = { id: string; label: string; Icon: LucideIcon };
type NavSection = { section: string; items: NavItem[] };

const NAV: NavSection[] = [
  { section: "OPS", items: [
    { id: "command-center", label: "Command Center", Icon: LayoutDashboard },
    { id: "clients",        label: "Clients",         Icon: Building2 },
    { id: "onboarding",    label: "Onboarding",      Icon: ClipboardList },
  ]},
  { section: "FUNNELS", items: [
    { id: "campaigns", label: "Campaigns", Icon: Megaphone },
    { id: "pages",     label: "Pages",     Icon: Globe },
  ]},
  { section: "PIPELINE", items: [
    { id: "leads",         label: "Leads",         Icon: Inbox },
    { id: "conversations", label: "Conversations", Icon: MessageSquare },
    { id: "escalations",   label: "Escalations",   Icon: AlertTriangle },
    { id: "bookings",      label: "Bookings",      Icon: CalendarCheck },
    { id: "enrollments",   label: "Enrollments",   Icon: UserCheck },
  ]},
  { section: "PERFORMANCE", items: [
    { id: "reporting",  label: "Reporting",  Icon: BarChart2 },
    { id: "insights",   label: "Insights",   Icon: Sparkles },
  ]},
  { section: "SYSTEM", items: [
    { id: "automation-rules", label: "Automation Rules", Icon: Zap },
    { id: "integrations",     label: "Integrations",     Icon: Plug },
    { id: "settings",         label: "Settings",         Icon: SettingsIcon },
  ]},
];

export default function OperatorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();

  const activeId = pathname.slice(1); // '/insights' → 'insights'
  const boltSrc = theme === "dark" ? "/brand/zw-bolt-dark.png" : "/brand/zw-bolt-light.png";

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", overflow: "hidden", background: "var(--color-bg)" }}>

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside style={{
        width: 220, flexShrink: 0, height: "100%",
        display: "flex", flexDirection: "column",
        background: "var(--color-sidebar-bg)",
        overflowY: "auto", overflowX: "hidden", position: "relative",
      }}>

        {/* Header */}
        <div style={{ padding: "16px 16px 10px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img
                src={boltSrc} width={30} height={30} alt=""
                style={{ display: "block", objectFit: "contain", pointerEvents: "none" }}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-1)", letterSpacing: "-0.2px", lineHeight: 1.2 }}>
                ZiroWork
              </div>
              <div style={{ fontSize: 11, color: "var(--color-text-3)", marginTop: 1 }}>
                Operator CRM · click ⚡ to act
              </div>
            </div>
            <ChevronRight size={12} color="var(--color-text-4)" style={{ marginLeft: "auto", flexShrink: 0 }} />
          </div>
        </div>

        {/* Search (deferred — at-rest appearance only) */}
        <div style={{ padding: "0 12px 8px", flexShrink: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "6px 10px", borderRadius: 8, cursor: "text",
            background: "var(--color-hover)", border: "1px solid var(--color-border)",
          }}>
            <Search size={12} color="var(--color-text-3)" strokeWidth={1.8} />
            <span style={{ fontSize: 13, color: "var(--color-text-4)" }}>Search…</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--color-text-5)", fontFamily: "ui-monospace,monospace" }}>⌘K</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0 8px 8px" }}>
          {NAV.map(({ section, items }) => (
            <div key={section} style={{ marginBottom: 4 }}>
              <div style={{
                padding: "10px 8px 4px", fontSize: 11, fontWeight: 600,
                letterSpacing: "0.08em", textTransform: "uppercase",
                color: "var(--color-text-4)",
              }}>
                {section}
              </div>
              {items.map(({ id, label, Icon }) => {
                const active = activeId === id;
                return (
                  <div key={id} style={{ position: "relative" }}>
                    {active && (
                      <div style={{
                        position: "absolute", left: 0, top: 0, bottom: 0,
                        width: 3, background: "var(--color-accent)",
                        borderRadius: "0 3px 3px 0",
                      }} />
                    )}
                    <button
                      onClick={() => router.push(`/${id}`)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, width: "100%",
                        padding: "6px 8px", borderRadius: 7,
                        border: active ? "1px solid var(--color-active-b)" : "1px solid transparent",
                        background: active ? "var(--color-active)" : "transparent",
                        color: active ? "var(--color-text-1)" : "var(--color-text-2)",
                        cursor: "pointer", textAlign: "left", fontSize: 14,
                        fontWeight: active ? 500 : 400,
                        fontFamily: "inherit", transition: "all 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = "var(--color-hover)";
                          e.currentTarget.style.color = "var(--color-text-1)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--color-text-2)";
                        }
                      }}
                    >
                      <Icon size={14} strokeWidth={active ? 2 : 1.7} style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{label}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Theme toggle */}
        <div style={{ padding: "4px 8px" }}>
          <button
            onClick={toggle}
            style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "6px 8px", borderRadius: 7, border: "none",
              background: "transparent", color: "var(--color-text-3)",
              cursor: "pointer", fontSize: 13, fontFamily: "inherit",
              transition: "all 0.1s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-hover)";
              e.currentTarget.style.color = "var(--color-text-1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--color-text-3)";
            }}
          >
            <Circle size={14} strokeWidth={1.7} />
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
        </div>

        {/* User footer (closed; dropdown deferred) */}
        <div style={{ padding: "2px 8px 14px" }}>
          <button
            style={{
              display: "flex", alignItems: "center", gap: 9, width: "100%",
              padding: "6px 8px", borderRadius: 7, border: "none",
              background: "transparent", color: "var(--color-text-1)",
              cursor: "pointer", textAlign: "left", fontFamily: "inherit",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
              background: "var(--color-user-av-bg)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, color: "var(--color-user-av-text)", fontWeight: 600,
            }}>
              ZA
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 13, fontWeight: 500, color: "var(--color-text-1)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                Zach Adkins
              </div>
              <div style={{ fontSize: 11, color: "var(--color-text-3)", marginTop: 1 }}>Operator</div>
            </div>
            <ChevronsUpDown size={12} color="var(--color-text-4)" style={{ flexShrink: 0 }} />
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Header bar */}
        <div style={{
          background: "var(--color-sidebar-bg)",
          borderBottom: "1px solid var(--color-border)",
          padding: "16px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-1)" }}>
            ZiroWork
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <UserMenu />
          </div>
        </div>

        {/* View content */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
