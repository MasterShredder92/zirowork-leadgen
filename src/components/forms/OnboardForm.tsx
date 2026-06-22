"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

// Default color for the brand color picker input (HTML value attr — cannot use CSS var()).
const COLOR_PICKER_DEFAULT = '#cccccc'; // hex-allow: native input[type=color] value attr; var() not accepted by HTML input

// Theme tokens — mirrors the legacy window.T shape.
// The CRM modal path gets these values from the operator shell's window.T;
// this component owns them for the public route (standalone).
const T = {
  bg:      "var(--color-bg)",
  surface: "var(--color-surface)",
  cardBg:  "var(--color-surface)",
  border:  "var(--color-border)",
  accent:  "var(--color-accent)",
  t1:      "var(--color-text-1)",
  t2:      "var(--color-text-2)",
  t3:      "var(--color-text-3)",
  t4:      "var(--color-text-4)",
} as const;

// Minimal inline Check icon — replaces window.LucideReact.Check
function CheckIcon({ size, color, strokeWidth }: { size: number; color: string; strokeWidth: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

interface ProgramPrice {
  price: string;
  duration: string;
}

interface Teacher {
  name: string;
  bio: string;
}

interface ScrapedMeta {
  platform:            string | null;
  social_facebook:     string | null;
  social_instagram:    string | null;
  director_name:       string | null;
  pricing_notes:       string | null;
  testimonials:        string[] | null;
  primary_color:       string | null;
  accent_color:        string | null;
  map_url:             string | null;
  google_rating:       number | null;
  google_review_count: number | null;
  scraped_at:          string | null;
  [key: string]: string | string[] | number | null;
}

interface FormState {
  studio_name:   string;
  city:          string;
  state:         string;
  area_code:     string;
  studio_phone:  string;
  website:       string;
  email:         string;
  password:      string;
  address:       string;
  hours:         string;
  instruments:   string[];
  program_prices: Record<string, ProgramPrice>;
  logo_url:      string;
  tagline:       string;
  offer:         string;
  testimonial:   string;
  testimonials:  string[];
  photos:        string[];
  teachers:      Teacher[];
  slots:         unknown[];
  fb_pixel_id:   string;
  gtm_id:        string;
  twilio_phone_number: string;
  about:         string;
  legal_business_name: string;
  ein:           string;
  privacy_policy_url: string;
  tos_url:       string;
  scheduling_platform: "none" | "square" | "google";
  square_access_token: string;
}

interface OperatorCreds {
  email:    string;
  password: string;
}

export interface OnboardFormProps {
  standalone?: boolean;
  onSuccess?:  (form?: FormState) => void;
  onCancel?:   () => void;
}

export default function OnboardForm({ standalone, onSuccess, onCancel }: OnboardFormProps) {
  const router = useRouter();

  const BLANK: FormState = {
    studio_name: "", city: "", state: "", area_code: "",
    studio_phone: "", website: "", email: "", password: "", address: "", hours: "",
    instruments: [], program_prices: {},
    logo_url: "", tagline: "", offer: "", testimonial: "",
    testimonials: ["", "", ""], photos: [],
    teachers: [{ name: "", bio: "" }],
    slots: [],
    fb_pixel_id: "", gtm_id: "", twilio_phone_number: "",
    about: "",
    legal_business_name: "", ein: "", privacy_policy_url: "", tos_url: "",
    scheduling_platform: "none", square_access_token: "",
  };

  // Live landing-page templates only — expand as more instrument pages ship
  const INSTRUMENTS = ["Piano", "Guitar", "Voice", "Drums"];

  const STEPS = [
    { n: 1, label: "Studio Info",     required: true  },
    { n: 2, label: "Programs",        required: true  },
    { n: 3, label: "Brand Assets",    required: false },
    { n: 4, label: "Review & Launch", required: false },
  ];

  const [step,           setStep]           = useState(1);
  const [submitted,      setSubmitted]      = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [saveError,      setSaveError]      = useState<string | null>(null);
  const [operatorCreds,  setOperatorCreds]  = useState<OperatorCreds | null>(null);
  const [form,           setForm]           = useState<FormState>(BLANK);
  const [scraping,       setScraping]       = useState(false);
  const [scrapeMsg,      setScrapeMsg]      = useState("");
  const [scrapeReady,    setScrapeReady]    = useState(false);
  const [scrapedMeta,    setScrapedMeta]    = useState<ScrapedMeta>({
    platform: null, social_facebook: null, social_instagram: null,
    director_name: null, pricing_notes: null, testimonials: null,
    primary_color: null, accent_color: null, map_url: null,
    google_rating: null, google_review_count: null, scraped_at: null,
  });
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError,     setPhotoError]     = useState("");
  const [phase,          setPhase]          = useState(standalone ? "welcome" : "wizard");
  const FUN_MSGS = ["Reading your website…", "Finding your programs…", "Pulling in your photos…", "Getting a feel for your studio…", "Almost ready…"];
  const [loadMsg, setLoadMsg] = useState(FUN_MSGS[0]);

  const set = (k: keyof FormState, v: FormState[keyof FormState]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const scrapeWebsite = async (): Promise<boolean> => {
    if (!form.website) return false;
    setScraping(true); setScrapeMsg(""); setScrapeReady(false);
    try {
      const res = await fetch("https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/scrape-school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.website }),
      });
      if (!res.ok) throw new Error("scrape failed");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await res.json();
      if (data.error) throw new Error(data.error as string);

      const loc = Array.isArray(data.locations) ? data.locations[0] : data;
      const phone: string = loc.phone || data.phone || "";
      const updates: Partial<FormState> = {};

      if (data.school_name && !form.studio_name) updates.studio_name = data.school_name as string;
      if ((loc.city  || data.city)  && !form.city)  updates.city  = (loc.city  || data.city)  as string;
      if ((loc.state || data.state) && !form.state) updates.state = (loc.state || data.state) as string;
      if (phone && !form.studio_phone) {
        updates.studio_phone = phone;
        const ac = phone.match(/\((\d{3})\)|^(\d{3})[-.\s]/);
        if (ac && !form.area_code) updates.area_code = (ac[1] || ac[2]) as string;
      }
      if ((loc.email || data.email) && !form.email) updates.email = (loc.email || data.email) as string;
      if ((loc.address || data.address) && !form.address) updates.address = (loc.address || data.address) as string;
      if ((loc.hours || data.hours) && !form.hours) updates.hours = (loc.hours || data.hours) as string;
      if (data.logo_url  && !form.logo_url)  updates.logo_url  = data.logo_url  as string;
      if (data.tagline   && !form.tagline)   updates.tagline   = data.tagline   as string;
      if (data.about     && !form.about)     updates.about     = data.about     as string;
      if (data.testimonials?.length && !form.testimonial) updates.testimonial = data.testimonials[0] as string;
      if (data.testimonials?.length && !(form.testimonials || []).some((t: string) => t && t.trim())) {
        updates.testimonials = [0, 1, 2].map((i: number) => (data.testimonials[i] || "") as string);
      }

      if (data.programs?.length && form.instruments.length === 0) {
        const ALIASES: Record<string, string[]> = { voice: ["vocals", "singing", "vocal"], bass: ["bass guitar"] };
        const matched = INSTRUMENTS.filter((k) => data.programs.some((p: string) => {
          const pl = p.toLowerCase(), kl = k.toLowerCase();
          return pl.includes(kl) || kl.includes(pl) || (ALIASES[kl] || []).some((a: string) => pl.includes(a));
        }));
        if (matched.length) {
          const pp: Record<string, ProgramPrice> = {};
          matched.forEach((m) => { pp[m] = { price: "", duration: "30" }; });
          updates.instruments    = matched;
          updates.program_prices = { ...form.program_prices, ...pp };
        }
      }

      if (data.google_photos?.length && (form.photos || []).length === 0) {
        updates.photos = (data.google_photos as string[]).slice(0, 4);
      }

      setForm((f) => ({ ...f, ...updates }));
      setScrapedMeta({
        platform:            (data.platform         as string | null)  || null,
        social_facebook:     (data.social_facebook  as string | null)  || null,
        social_instagram:    (data.social_instagram as string | null)  || null,
        director_name:       (data.director_name    as string | null)  || null,
        pricing_notes:       (data.pricing_notes    as string | null)  || null,
        testimonials:        data.testimonials?.length ? data.testimonials as string[] : null,
        primary_color:       (data.primary_color    as string | null)  || null,
        accent_color:        (data.accent_color     as string | null)  || null,
        map_url:             (data.map_url          as string | null)  || null,
        google_rating:       (data.google_rating       as number | null) || null,
        google_review_count: (data.google_review_count as number | null) || null,
        scraped_at:          new Date().toISOString(),
      });

      const filled = Object.keys(updates).filter((k) => !["program_prices", "instruments"].includes(k)).length
        + (updates.instruments?.length ? 1 : 0);
      if (filled > 0) { setScrapeReady(true); setScrapeMsg(""); }
      else setScrapeMsg("Scraped — no new fields found");
      setScraping(false);
      return filled > 0;
    } catch {
      setScrapeMsg("Could not scrape site — fill manually");
      setScraping(false);
      return false;
    }
  };

  const startFromWebsite = async () => {
    if (!form.website || scraping) return;
    let i = 0;
    setLoadMsg(FUN_MSGS[0]);
    const iv = setInterval(() => { i = (i + 1) % FUN_MSGS.length; setLoadMsg(FUN_MSGS[i]); }, 1400);
    const ok = await scrapeWebsite();
    clearInterval(iv);
    if (ok) { setScrapeMsg(""); setStep(1); setPhase("wizard"); }
  };

  const blockers = [
    !form.studio_name              && "Studio name is required",
    !form.legal_business_name      && "Legal business name is required for SMS compliance",
    !form.ein                      && "EIN/Tax ID is required for SMS compliance",
    !form.privacy_policy_url       && "Privacy Policy URL is required for SMS compliance",
    !form.tos_url                  && "Terms of Service URL is required for SMS compliance",
    form.instruments.length === 0  && "At least one instrument required — needed to build landing pages",
    standalone && !form.email                                  && "Email is required to create your portal login",
    standalone && (!form.password || form.password.length < 8) && "A portal password (8+ characters) is required",
  ].filter(Boolean) as string[];

  const willCreate = [
    form.area_code
      ? `Phone number (${form.area_code} area code) auto-provisioned via Twilio`
      : "Phone number — add your studio phone to auto-provision",
    form.instruments.length > 0 && `${form.instruments.length} landing page template${form.instruments.length > 1 ? "s" : ""} (${form.instruments.join(", ")})`,
    form.instruments.length > 0 && `${form.instruments.length} campaign shell${form.instruments.length > 1 ? "s" : ""} ready to activate`,
    "Default automation rules (qualify + enroll)",
    "Client record with onboarding checklist",
  ].filter(Boolean) as string[];

  const summary = [
    { label: "Studio",   value: form.studio_name ? `${form.studio_name} · ${form.city}, ${form.state}` : null },
    { label: "Programs", value: form.instruments.length ? form.instruments.join(", ") : null },
    { label: "Brand",    value: form.tagline || (form.logo_url ? "Logo URL added" : null) },
  ];

  const inp: React.CSSProperties = {
    width: "100%", padding: "8px 10px", background: T.bg,
    border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 14, color: T.t1,
    fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: "border-box",
  };

  const fLabel = (text: string, req?: boolean) => (
    <div style={{ fontSize: 12, fontWeight: 600, color: T.t3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
      {text}{req && <span style={{ color: T.accent, marginLeft: 3 }}>*</span>}
    </div>
  );

  const S1 = () => (
    <div>
      {!standalone && (
        <div style={{ marginBottom: scrapeReady ? 12 : 20, padding: "12px 14px", background: T.accent + "12", border: `1px solid ${T.accent}40`, borderRadius: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Start here — auto-fill from website</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...inp, flex: 1 }}
              value={form.website}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { set("website", e.target.value); setScrapeMsg(""); setScrapeReady(false); }}
              placeholder="https://yourstudio.com"
            />
            <button
              onClick={scrapeWebsite}
              disabled={!form.website || scraping}
              style={{ padding: "8px 16px", borderRadius: 7, border: "none", background: T.accent, color: "var(--color-school-white)", fontSize: 13, fontWeight: 700, cursor: form.website && !scraping ? "pointer" : "not-allowed", opacity: form.website && !scraping ? 1 : 0.4, fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: "nowrap" }}>
              {scraping ? "Scraping…" : "Auto-fill ↓"}
            </button>
          </div>
          {scrapeMsg && <div style={{ fontSize: 12, marginTop: 5, color: scrapeMsg.startsWith("Could") ? "var(--color-status-no_show)" : T.accent }}>{scrapeMsg}</div>}
        </div>
      )}

      {scrapeReady && (
        <div style={{ marginBottom: 16, padding: "12px 14px", background: T.accent + "18", border: `1px solid ${T.accent}50`, borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: T.accent, fontWeight: 700, marginBottom: form.about ? 6 : 10 }}>Fields pre-filled from your site — review below and correct anything wrong.</div>
          {form.about && (
            <div style={{ fontSize: 13, color: T.t2, fontStyle: "italic", lineHeight: 1.5, marginBottom: 10, padding: "8px 10px", background: T.bg, borderRadius: 6, border: `1px solid ${T.border}` }}>&ldquo;{form.about}&rdquo;</div>
          )}
          {(scrapedMeta.primary_color || scrapedMeta.accent_color) && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: T.t3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Brand colors detected</span>
              {scrapedMeta.primary_color && (
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: scrapedMeta.primary_color, border: `1px solid ${T.border}` }} />
                  <span style={{ fontSize: 12, color: T.t2 }}>{scrapedMeta.primary_color}</span>
                </div>
              )}
              {scrapedMeta.accent_color && (
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: scrapedMeta.accent_color as string, border: `1px solid ${T.border}` }} />
                  <span style={{ fontSize: 12, color: T.t2 }}>{scrapedMeta.accent_color}</span>
                </div>
              )}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setStep((s) => s + 1)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: T.accent, color: "var(--color-school-white)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Looks good → Step 2</button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 14 }}>{fLabel("Studio Name", true)}<input style={inp} value={form.studio_name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("studio_name", e.target.value)} placeholder="Your Studio Name" /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 10, marginBottom: 14 }}>
        <div>{fLabel("City", true)}<input style={inp} value={form.city} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("city", e.target.value)} placeholder="Austin" /></div>
        <div>{fLabel("State", true)}<input style={inp} value={form.state} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("state", e.target.value)} placeholder="TX" maxLength={2} /></div>
      </div>
      <div style={{ marginBottom: 14 }}>
        {fLabel("Studio Phone", true)}
        <input style={inp} value={form.studio_phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const v = e.target.value;
          let d = v.replace(/\D/g, "");
          if (d.length === 11 && d[0] === "1") d = d.slice(1);
          setForm((f) => ({ ...f, studio_phone: v, area_code: d.length >= 10 ? d.slice(0, 3) : "" }));
        }} placeholder="(531) 270-0848" />
        <div style={{ fontSize: 12, color: T.t4, marginTop: 4 }}>Your ZiroWork number is auto-provisioned in this area code.</div>
      </div>
      <div style={{ marginBottom: 14 }}>{fLabel("Booking / Contact Email", !!standalone)}<input style={inp} value={form.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("email", e.target.value)} placeholder="hello@yourstudio.com" /></div>
      <div style={{ marginBottom: 14 }}>{fLabel("Street Address")}<input style={inp} value={form.address} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("address", e.target.value)} placeholder="1234 Music Ave, Suite 200" /></div>
      <div style={{ marginBottom: 14 }}>{fLabel("Hours")}<input style={inp} value={form.hours} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("hours", e.target.value)} placeholder="Mon–Fri 2–8pm · Sat 9am–2pm" /></div>

      <div style={{ marginTop: 24, padding: "16px 14px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.t1, marginBottom: 4 }}>SMS Compliance (A2P 10DLC)</div>
        <div style={{ fontSize: 12, color: T.t3, marginBottom: 14, lineHeight: 1.5 }}>
          Required by mobile carriers to send text messages. This information must exactly match your tax records.
        </div>
        <div style={{ marginBottom: 12 }}>{fLabel("Legal Business Name", true)}<input style={inp} value={form.legal_business_name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("legal_business_name", e.target.value)} placeholder="Adkins Music Lessons LLC" /></div>
        <div style={{ marginBottom: 12 }}>{fLabel("EIN / Tax ID", true)}<input style={inp} value={form.ein} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("ein", e.target.value)} placeholder="XX-XXXXXXX" /></div>
        <div style={{ marginBottom: 12 }}>{fLabel("Privacy Policy URL", true)}<input style={inp} value={form.privacy_policy_url} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("privacy_policy_url", e.target.value)} placeholder="https://yourstudio.com/privacy" /></div>
        <div style={{ marginBottom: 12 }}>{fLabel("Terms of Service URL", true)}<input style={inp} value={form.tos_url} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("tos_url", e.target.value)} placeholder="https://yourstudio.com/terms" /></div>
      </div>

      <div style={{ marginTop: 24, padding: "16px 14px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.t1, marginBottom: 4 }}>Scheduling Integration</div>
        <div style={{ fontSize: 12, color: T.t3, marginBottom: 14, lineHeight: 1.5 }}>
          How do your teachers manage their schedules? We connect to this to avoid double-booking.
        </div>
        <div style={{ marginBottom: 12 }}>
          {fLabel("Scheduling Platform")}
          <select style={inp} value={form.scheduling_platform} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set("scheduling_platform", e.target.value as any)}>
            <option value="none">Manual / Other (No live sync)</option>
            <option value="google">Google Calendar</option>
            <option value="square">Square Appointments</option>
          </select>
        </div>
        {form.scheduling_platform === "square" && (
          <div style={{ marginBottom: 12, padding: "12px", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: "var(--color-info-text)", marginBottom: 8, fontWeight: 500 }}>Please provide your Square Developer Personal Access Token.</div>
            {fLabel("Square Access Token", true)}
            <input style={inp} type="password" value={form.square_access_token} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("square_access_token", e.target.value)} placeholder="EAAA..." />
          </div>
        )}
      </div>
    </div>
  );

  const toggleInst = (inst: string) => {
    const has = form.instruments.includes(inst);
    const instruments = has ? form.instruments.filter((i) => i !== inst) : [...form.instruments, inst];
    const program_prices = { ...form.program_prices };
    if (!has && !program_prices[inst]) program_prices[inst] = { price: "", duration: "30" };
    setForm((f) => ({ ...f, instruments, program_prices }));
  };

  const S2 = () => (
    <div>
      <div style={{ marginBottom: 18 }}>
        {fLabel("Which Instruments Do You Want Leads For?", true)}
        <div style={{ fontSize: 12, color: T.t4, marginTop: 2, marginBottom: 4, lineHeight: 1.5 }}>
          Each instrument you pick gets its own landing page and campaign built for it. We&#39;re live with these four — more instruments coming soon.
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
          {INSTRUMENTS.map((inst) => {
            const on = form.instruments.includes(inst);
            return (
              <button key={inst} onClick={() => toggleInst(inst)} style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: "none", fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: on ? T.accent : (T.border || "var(--color-onboard-border)"), color: on ? "var(--color-school-white)" : T.t3,
              }}>{inst}</button>
            );
          })}
        </div>
      </div>
      {form.instruments.length > 0 && (
        <div>
          {fLabel("Pricing per Program")}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
            {form.instruments.map((inst) => (
              <div key={inst} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.t2, width: 90, flexShrink: 0 }}>{inst}</span>
                <input
                  style={{ ...inp, flex: 1 }}
                  value={form.program_prices[inst]?.price || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, program_prices: { ...f.program_prices, [inst]: { ...f.program_prices[inst], price: e.target.value } } }))}
                  placeholder="$/lesson (e.g. 45)"
                />
                <select
                  value={form.program_prices[inst]?.duration || "30"}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm((f) => ({ ...f, program_prices: { ...f.program_prices, [inst]: { ...f.program_prices[inst], duration: e.target.value } } }))}
                  style={{ ...inp, width: 90, flexShrink: 0 }}>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const S3 = () => (
    <div>
      <div style={{ marginBottom: 14 }}>{fLabel("Logo URL")}<input style={inp} value={form.logo_url} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("logo_url", e.target.value)} placeholder="https://... (or add later)" /></div>
      <div style={{ marginBottom: 14 }}>
        {fLabel("Brand Colors")}
        <div style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 2 }}>
          {(["primary_color", "accent_color"] as const).map((k) => {
            const label = k === "primary_color" ? "Primary" : "Accent";
            return (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="color"
                  value={(scrapedMeta[k] as string | null) || COLOR_PICKER_DEFAULT}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScrapedMeta((m) => ({ ...m, [k]: e.target.value }))}
                  style={{ width: 30, height: 30, padding: 0, border: `1px solid ${T.border}`, borderRadius: 6, background: "none", cursor: "pointer" }}
                />
                <span style={{ fontSize: 12, color: T.t3 }}>{label}{scrapedMeta[k] ? " · " + (scrapedMeta[k] as string) : ""}</span>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: T.t4, marginTop: 4 }}>Detected from your website — click a swatch to correct. The primary color styles your landing pages.</div>
      </div>
      <div style={{ marginBottom: 14 }}>{fLabel("Studio Tagline")}<input style={inp} value={form.tagline} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("tagline", e.target.value)} placeholder="Building confidence through music since 2010" /></div>
      <div style={{ marginBottom: 14 }}>
        {fLabel("Primary Offer / Pitch")}
        <textarea style={{ ...inp, resize: "vertical", minHeight: 72 }} value={form.offer} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set("offer", e.target.value)} placeholder="First lesson free for new students. No contracts." />
      </div>
      <div style={{ marginBottom: 6 }}>
        {fLabel("Testimonials (up to 3)")}
        <div style={{ fontSize: 12, color: T.t4, marginBottom: 8, lineHeight: 1.5 }}>
          These appear throughout your landing page. Real quotes from real families convert better than any copy you can write.
        </div>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <textarea
            style={{ ...inp, resize: "vertical", minHeight: 64 }}
            value={form.testimonials?.[i] || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              const next = [...(form.testimonials || ["", "", ""])];
              next[i] = e.target.value;
              set("testimonials", next);
            }}
            placeholder={[
              '"My daughter went from zero to performing in 4 months." — Sarah J.',
              '"Best decision we ever made. Our son actually asks to practice." — Mike T.',
              '"I started at 42 and I\'m playing songs I love. No pressure, just progress." — Dana R.',
            ][i]}
          />
        </div>
      ))}

      <div style={{ marginBottom: 4 }}>
        {fLabel("Studio Photos (up to 4)")}
        <div style={{ fontSize: 12, color: T.t4, marginBottom: 8, lineHeight: 1.5 }}>
          Photos of your actual studio, teachers, or recitals convert significantly better than stock images. You can skip and add later.
        </div>
      </div>

      {(form.photos || []).length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
          {(form.photos || []).map((url, i) => (
            <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden", background: "var(--color-school-bg-subtle)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={"Studio photo " + (i + 1)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button
                onClick={() => set("photos", (form.photos || []).filter((_, idx) => idx !== i))}
                style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "var(--color-school-white)", border: "none", cursor: "pointer", fontSize: 13, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {(form.photos || []).length < 4 && (
        <label style={{ display: "block", width: "100%", padding: "10px", border: `1px dashed ${T.border}`, borderRadius: 7, textAlign: "center", cursor: photoUploading ? "not-allowed" : "pointer", opacity: photoUploading ? 0.5 : 1 }}>
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            disabled={photoUploading}
            onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
              const files = Array.from(e.target.files || []);
              if (!files.length) return;
              setPhotoUploading(true);
              setPhotoError("");
              const existing = form.photos || [];
              const slots = 4 - existing.length;
              const toUpload = files.slice(0, slots);
              const urls: string[] = [];
              for (const file of toUpload) {
                const ext = file.name.split(".").pop() ?? "jpg";
                const safeName = (form.studio_name || "school").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-") || "school";
                const path = "studio-photos/" + safeName + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7) + "." + ext.toLowerCase().replace(/[^a-z0-9]/g, "");
                const { error: upErr } = await supabase.storage.from("client-assets").upload(path, file, { upsert: true });
                if (upErr) { setPhotoError("Upload failed: " + upErr.message); break; }
                const { data: urlData } = supabase.storage.from("client-assets").getPublicUrl(path);
                if (urlData?.publicUrl) urls.push(urlData.publicUrl);
              }
              set("photos", [...existing, ...urls]);
              setPhotoUploading(false);
              e.target.value = "";
            }}
          />
          <span style={{ fontSize: 13, color: T.t3, fontWeight: 600 }}>
            {photoUploading ? "Uploading..." : "+ Upload photos"}
          </span>
        </label>
      )}
      {photoError && <div style={{ fontSize: 12, color: "var(--color-status-no_show)", marginTop: 4 }}>{photoError}</div>}
    </div>
  );

  const S9 = () => (
    <div>
      {blockers.length > 0 && (
        <div style={{ padding: "12px 14px", background: "var(--color-error-bg-tint)", border: "1px solid var(--color-error-border-tint)", borderRadius: 8, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-status-no_show)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Missing — required before launch</div>
          {blockers.map((b) => <div key={b} style={{ fontSize: 13, color: "var(--color-status-no_show)", marginBottom: 2 }}>· {b}</div>)}
        </div>
      )}
      <div style={{ padding: "12px 14px", background: "var(--color-success-bg-tint)", border: "1px solid var(--color-success-border-tint)", borderRadius: 8, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-status-scheduled)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Will be created automatically</div>
        {willCreate.map((w) => <div key={w} style={{ fontSize: 13, color: T.t2, marginBottom: 2 }}>· {w}</div>)}
      </div>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
        {summary.map((row, i) => (
          <div key={row.label} style={{ display: "flex", gap: 16, padding: "10px 14px", borderBottom: i < summary.length - 1 ? `1px solid ${T.border}` : "none" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.t4, textTransform: "uppercase", letterSpacing: "0.06em", width: 72, flexShrink: 0, paddingTop: 1 }}>{row.label}</span>
            <span style={{ fontSize: 13, color: row.value ? T.t1 : T.t4 }}>{row.value || "—"}</span>
          </div>
        ))}
      </div>
      {standalone && (
        <div style={{ marginTop: 14 }}>
          {fLabel("Create Your Portal Password", true)}
          <input style={inp} type="password" value={form.password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("password", e.target.value)} placeholder="8+ characters" />
          <div style={{ fontSize: 12, color: T.t4, marginTop: 4 }}>You&#39;ll log into your ZiroWork portal with {form.email || "your email"} + this password.</div>
        </div>
      )}
    </div>
  );

  const STEP_CONTENT = [S1, S2, S3, S9];
  const currentStep = STEPS[step - 1];
  const StepComponent = STEP_CONTENT[step - 1];

  const handleSubmit = async () => {
    setSaving(true); setSaveError(null);
    const slug = form.studio_name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const { data, error } = await supabase.from("clients").insert([{
      name: form.studio_name, city: form.city, state: form.state, status: "onboarding",
      health: null, sms_number: null, lead_form_webhook: null,
      protected_slots: false, brand_assets: false, automation_rules: false, integrations: false,
      slug, instruments: form.instruments, program_prices: form.program_prices,
      teachers: form.teachers.filter((t) => t.name),
      studio_phone: form.studio_phone || null, website: form.website || null,
      email: form.email || null, area_code: form.area_code || null,
      tagline: form.tagline || null, offer: form.offer || null,
      testimonial: form.testimonial || null, logo_url: form.logo_url || null,
      fb_pixel_id: form.fb_pixel_id || null, gtm_id: form.gtm_id || null,
    }]).select();
    setSaving(false);
    if (error) { setSaveError("Failed to create profile. Try again."); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientId = (data as any)?.[0]?.id as string | undefined;
    if (clientId) {
      const { error: tenantErr } = await supabase.from("agent_tenants").upsert([{
        tenant_id: clientId,
        name: form.studio_name,
        config: {
          director_name:    scrapedMeta.director_name || (form.studio_name + " Team"),
          location_name:    form.studio_name,
          monthly_price_standard: parseInt(Object.values(form.program_prices)[0]?.price || "160") || 160,
          twilio_phone_number: form.twilio_phone_number || "",
          about:            form.about      || null,
          tagline:          form.tagline    || null,
          address:          form.address    || null,
          hours:            form.hours      || null,
          pricing_notes:    scrapedMeta.pricing_notes    || null,
          platform:         scrapedMeta.platform         || null,
          social_facebook:  scrapedMeta.social_facebook  || null,
          social_instagram: scrapedMeta.social_instagram || null,
          testimonials:     (() => {
            const manual = (form.testimonials || []).filter((t) => t && t.trim());
            const scraped = scrapedMeta.testimonials || [];
            const legacy = form.testimonial ? [form.testimonial] : [];
            const all = [...manual, ...scraped, ...legacy].filter((t, i, arr) => arr.indexOf(t) === i);
            return all.length ? all : null;
          })(),
          photos:           (form.photos || []).length > 0 ? form.photos : null,
          primary_color:    scrapedMeta.primary_color    || null,
          accent_color:     scrapedMeta.accent_color     || null,
          map_url:          scrapedMeta.map_url          || null,
          google_rating:        scrapedMeta.google_rating       || null,
          google_review_count:  scrapedMeta.google_review_count || null,
          scraped_at:       scrapedMeta.scraped_at       || null,
        },
      }], { onConflict: "tenant_id" });

      const TEMPL = ["Piano", "Guitar", "Voice", "Drums"];
      const TO_SLUG: Record<string, string> = { Piano: "piano", Guitar: "guitar", Voice: "vocals", Drums: "drums" };
      const pageInst = (form.instruments || []).filter((i) => TEMPL.includes(i));
      let pageErr: { message: string } | null = null;
      if (pageInst.length > 0) {
        ({ error: pageErr } = await supabase.from("client_pages").insert(pageInst.map((i) => ({
          client_id: clientId,
          instrument: TO_SLUG[i],
          slug,
          school_name: form.studio_name,
          status: "live",
        }))));
      }
      if (tenantErr || pageErr) {
        setSaveError("Profile saved, but landing-page setup failed — contact support before launch.");
        return;
      }

      if (standalone && form.email && form.password) {
        try {
          const resp = await fetch("https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/complete-onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: form.email, password: form.password, tenant_id: clientId, full_name: form.studio_name }),
          });
          const out: { error?: string } = await resp.json().catch(() => ({}));
          if (!resp.ok || out.error) {
            setSaveError(out.error === "email_exists"
              ? "That email already has an account — log in at /dashboard with it."
              : "Profile created, but portal login setup failed — contact support.");
            return;
          }
          await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        } catch {
          setSaveError("Profile created, but portal login setup failed — contact support.");
          return;
        }
      }

      if (!standalone && form.email) {
        const tempPassword = "Zw-" + Math.random().toString(36).slice(2, 10);
        try {
          const resp = await fetch("https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/complete-onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: form.email, password: tempPassword, tenant_id: clientId, full_name: form.studio_name }),
          });
          const out: { error?: string } = await resp.json().catch(() => ({}));
          if (resp.ok && !out.error) {
            setOperatorCreds({ email: form.email, password: tempPassword });
          }
        } catch {
          // Non-fatal: the client profile was still created. Login can be set up later.
        }
      }
    }
    if (onSuccess) onSuccess(form);
    setSubmitted(true);
  };

  if (standalone && phase === "welcome" && !submitted) {
    return (
      <div style={{ background: T.cardBg || "var(--surface)", borderRadius: 16, width: "100%", maxWidth: 480, border: `1px solid ${T.border}`, padding: "48px 40px", textAlign: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: T.accent, margin: "0 auto 22px" }} />
        <div style={{ fontSize: 25, fontWeight: 800, color: T.t1, letterSpacing: "-0.02em", marginBottom: 10 }}>Let&#39;s get your school set up</div>
        <div style={{ fontSize: 15, color: T.t3, lineHeight: 1.6, maxWidth: 360, margin: "0 auto 26px" }}>Paste your website and we&#39;ll pull in your programs, photos, and details automatically — so you barely have to type.</div>
        <input
          style={{ ...inp, padding: "13px 16px", fontSize: 16, textAlign: "center", marginBottom: 12 }}
          value={form.website}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { set("website", e.target.value); setScrapeMsg(""); }}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") { void startFromWebsite(); } }}
          placeholder="yourstudio.com"
          autoFocus
        />
        {scraping ? (
          <div style={{ padding: "10px 0 4px" }}>
            <div style={{ width: 28, height: 28, border: `3px solid ${T.border}`, borderTopColor: T.accent, borderRadius: "50%", margin: "0 auto 12px", animation: "zwspin 0.8s linear infinite" }} />
            <div style={{ fontSize: 14, color: T.accent, fontWeight: 600 }}>{loadMsg}</div>
            <style>{`@keyframes zwspin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <button
            onClick={() => { void startFromWebsite(); }}
            disabled={!form.website}
            style={{ width: "100%", padding: "13px", background: T.accent, color: "var(--color-school-white)", border: "none", borderRadius: 9, fontSize: 16, fontWeight: 700, cursor: form.website ? "pointer" : "not-allowed", opacity: form.website ? 1 : 0.45, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Get started →
          </button>
        )}
        {scrapeMsg && !scraping && <div style={{ fontSize: 13, marginTop: 10, color: scrapeMsg.startsWith("Could") ? "var(--color-status-no_show)" : T.t3 }}>{scrapeMsg}</div>}
        <div style={{ marginTop: 18 }}>
          <button onClick={() => { setScrapeMsg(""); setStep(1); setPhase("wizard"); }} style={{ background: "none", border: "none", color: T.t4, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", textDecoration: "underline" }}>
            I don&#39;t have a website — set up manually
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ background: T.cardBg || "var(--surface)", borderRadius: 12, width: "100%", maxWidth: 560, border: `1px solid ${T.border}`, padding: "40px 32px", textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--color-success-bg-tint-2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <CheckIcon size={24} color="var(--color-status-scheduled)" strokeWidth={2.5} />
        </div>
        <div style={{ fontSize: 19, fontWeight: 700, color: T.t1, marginBottom: 8 }}>
          {standalone ? "You're in!" : `${form.studio_name || "Studio"} is queued.`}
        </div>
        <div style={{ fontSize: 14, color: T.t3, marginBottom: 20, lineHeight: 1.6 }}>
          {standalone
            ? "Your account is live and your landing pages are ready. Head to your portal to see everything."
            : "Profile created. Complete the checklist below to get this client fully live."}
        </div>
        {blockers.length > 0 && !standalone && (
          <div style={{ fontSize: 13, color: "var(--color-program-guitar)", marginBottom: 16 }}>{blockers.length} item{blockers.length > 1 ? "s" : ""} still needed before launch.</div>
        )}
        {!standalone && operatorCreds && (
          <div style={{ textAlign: "left", padding: "14px 16px", background: T.accent + "12", border: `1px solid ${T.accent}40`, borderRadius: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Portal login created</div>
            <div style={{ fontSize: 13, color: T.t2, marginBottom: 3 }}>Email: <code style={{ color: T.t1 }}>{operatorCreds.email}</code></div>
            <div style={{ fontSize: 13, color: T.t2, marginBottom: 8 }}>Temp password: <code style={{ color: T.t1 }}>{operatorCreds.password}</code></div>
            <div style={{ fontSize: 12, color: T.t4, lineHeight: 1.5 }}>Share with the school; they should change it after logging into /dashboard.</div>
          </div>
        )}
        <button
          onClick={standalone ? () => { router.push("/dashboard"); } : () => onCancel && onCancel()}
          style={{ padding: "10px 28px", background: T.accent, color: "var(--color-school-white)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {standalone ? "Go to my portal →" : "Done"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: T.cardBg || "var(--surface)", borderRadius: 12, width: "100%", maxWidth: 560, maxHeight: "88vh", display: "flex", flexDirection: "column", border: `1px solid ${T.border}` }}>
      <div style={{ padding: "20px 24px 14px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.t1 }}>
              {standalone ? "Get your school set up with ZiroWork" : "New Client Onboarding"}
            </div>
            <div style={{ fontSize: 13, color: T.t3, marginTop: 2 }}>
              Step {step} of {STEPS.length} · {currentStep.label}
              {!currentStep.required && <span style={{ color: T.t4, marginLeft: 4 }}>(optional)</span>}
            </div>
          </div>
          {!standalone && (
            <button onClick={() => onCancel && onCancel()} style={{ background: "none", border: "none", cursor: "pointer", color: T.t4, fontSize: 23, lineHeight: 1, padding: "0 2px" }}>×</button>
          )}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ flex: 1, height: 3, borderRadius: 2, background: s.n <= step ? T.accent : T.border, transition: "background 0.2s" }} />
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        <StepComponent />
      </div>

      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <button
          onClick={() => step > 1 ? setStep((s) => s - 1) : (!standalone && onCancel && onCancel())}
          style={{ padding: "8px 18px", background: "transparent", color: T.t3, border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", visibility: step === 1 && standalone ? "hidden" : "visible" }}>
          {step === 1 ? "Cancel" : "← Back"}
        </button>
        {step < STEPS.length ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            style={{ padding: "8px 20px", background: T.accent, color: "var(--color-school-white)", border: "none", borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Next →
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            {saveError && <div style={{ fontSize: 12, color: "var(--color-status-no_show)" }}>{saveError}</div>}
            <button
              disabled={saving || (!!standalone && blockers.length > 0)}
              onClick={() => { void handleSubmit(); }}
              style={{ padding: "8px 22px", background: "var(--color-status-scheduled)", color: "var(--color-school-white)", border: "none", borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {saving ? "Saving..." : "Create Profile"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
