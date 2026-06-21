"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

type ProgramPrice = { price?: string; duration?: string };

type ClientRow = {
  name?: string;
  slug?: string;
  city?: string | null;
  state?: string | null;
  studio_phone?: string | null;
  email?: string | null;
  website?: string | null;
  tagline?: string | null;
  logo_url?: string | null;
  instruments?: string[];
  program_prices?: Record<string, ProgramPrice>;
  [key: string]: unknown;
};

type TenantConfig = {
  about?: unknown;
  address?: unknown;
  hours?: unknown;
  director_name?: string | null;
  director_title?: string | null;
  location_name?: string | null;
  primary_color?: string | null;
  accent_color?: string | null;
  map_url?: string | null;
  testimonials?: string[];
  photos?: string[];
  social_facebook?: string | null;
  social_instagram?: string | null;
  monthly_price_standard?: number | string | null;
  monthly_price_military?: number | string | null;
  google_rating?: number;
  google_review_count?: number;
  platform?: string;
  pricing_notes?: string;
  scraped_at?: string;
  [key: string]: unknown;
};

type TenantRow = {
  name?: string;
  plan_tier?: string;
  status?: string;
  config?: TenantConfig;
};

type FormState = {
  name: string;
  city: string;
  state: string;
  studio_phone: string;
  email: string;
  website: string;
  tagline: string;
  logo_url: string;
  program_prices: Record<string, ProgramPrice>;
  about: string;
  address: string;
  hours: string;
  director_name: string;
  director_title: string;
  location_name: string;
  primary_color: string;
  accent_color: string;
  map_url: string;
  testimonials: string[];
  photos: string[];
  social_facebook: string;
  social_instagram: string;
  monthly_price_standard: number | string;
  monthly_price_military: number | string;
};

const INSTRUMENT_SLUGS: Record<string, string> = { Piano: "piano", Guitar: "guitar", Voice: "vocals", Drums: "drums" };
const DURATIONS = ["30", "45", "60"];

function buildForm(client: ClientRow, cfg: TenantConfig): FormState {
  return {
    // clients
    name: client.name || "",
    city: client.city || "",
    state: client.state || "",
    studio_phone: client.studio_phone || "",
    email: client.email || "",
    website: client.website || "",
    tagline: client.tagline || "",
    logo_url: client.logo_url || "",
    program_prices: client.program_prices || {},
    // agent_tenants.config
    about: typeof cfg.about === "string" ? cfg.about : "",
    address: typeof cfg.address === "string" ? cfg.address : "",
    hours: typeof cfg.hours === "string" ? cfg.hours : "",
    director_name: cfg.director_name || "",
    director_title: cfg.director_title || "",
    location_name: cfg.location_name || "",
    primary_color: cfg.primary_color || "",
    accent_color: cfg.accent_color || "",
    map_url: cfg.map_url || "",
    testimonials: Array.isArray(cfg.testimonials) ? cfg.testimonials.slice() : [],
    photos: Array.isArray(cfg.photos) ? cfg.photos.slice() : [],
    social_facebook: cfg.social_facebook || "",
    social_instagram: cfg.social_instagram || "",
    monthly_price_standard: cfg.monthly_price_standard ?? "",
    monthly_price_military: cfg.monthly_price_military ?? "",
  };
}

export default function PortalMyBusiness({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<{ client: ClientRow; tenant: TenantRow } | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [uploadErr, setUploadErr] = useState("");
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [loading, setLoading] = useState(true);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      if (tenantId === "preview") {
        const sampleClient: ClientRow = {
          name: "Maple Street Music",
          slug: "maple-street-music",
          city: "Austin",
          state: "TX",
          studio_phone: "(512) 555-0188",
          email: "hello@maplestreetmusic.com",
          website: "https://maplestreetmusic.com",
          tagline: "Where Austin learns to play",
          logo_url: "",
          instruments: ["Piano", "Guitar"],
          program_prices: {
            Piano: { price: "45", duration: "30" },
            Guitar: { price: "40", duration: "30" },
          },
        };
        const sampleTenant: TenantRow = {
          name: "Maple Street Music",
          plan_tier: "studio",
          status: "active",
          config: {
            about: "Family-owned music school serving Austin since 2012. We teach piano and guitar to students of every age, with patient teachers and a recital every season.",
            address: "123 Maple St, Austin, TX 78704",
            hours: "Mon–Fri 10am–8pm, Sat 9am–2pm",
            director_name: "Dana Reyes",
            director_title: "Owner",
            location_name: "Main Studio",
            primary_color: "#1F3A5F",
            accent_color: "#E07A2F",
            map_url: "https://maps.google.com/?q=Maple+Street+Music+Austin",
            testimonials: [
              "My daughter went from zero to playing recitals in one year. Dana and the team are wonderful.",
              "Best music school in Austin — flexible scheduling and teachers who actually care.",
            ],
            photos: [
              "https://picsum.photos/seed/maple1/400",
              "https://picsum.photos/seed/maple2/400",
            ],
            social_facebook: "https://facebook.com/maplestreetmusic",
            social_instagram: "https://instagram.com/maplestreetmusic",
            monthly_price_standard: 160,
            monthly_price_military: 140,
            google_rating: 5.0,
            google_review_count: 206,
            platform: "wordpress",
            pricing_notes: "Sibling discount available on request",
            scraped_at: "2026-06-01T00:00:00Z",
          },
        };
        setData({ client: sampleClient, tenant: sampleTenant });
        setForm(buildForm(sampleClient, sampleTenant.config!));
        setLoading(false);
        return;
      }

      const [clientRes, tenantRes] = await Promise.all([
        supabase.from("clients").select("*").eq("id", tenantId).single(),
        supabase.from("agent_tenants").select("*").eq("tenant_id", tenantId).single(),
      ]);
      const client = clientRes.data as ClientRow | null;
      const tenant = tenantRes.data as TenantRow | null;

      if (client || tenant) {
        const cfg = (tenant && tenant.config) || {};
        setData({ client: client || {}, tenant: tenant || { config: {} } });
        setForm(buildForm(client || { name: (tenant && tenant.name) || "" }, cfg));
      }
      setLoading(false);
    }
    load();
  }, [tenantId]);

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => (f ? { ...f, [key]: val } : f));
  }

  function setProgramPrice(inst: string, key: keyof ProgramPrice, val: string) {
    setForm(f => (f ? {
      ...f,
      program_prices: {
        ...f.program_prices,
        [inst]: { ...(f.program_prices[inst] || {}), [key]: val },
      },
    } : f));
  }

  function setTestimonial(i: number, val: string) {
    setForm(f => {
      if (!f) return f;
      const t = f.testimonials.slice();
      t[i] = val;
      return { ...f, testimonials: t };
    });
  }

  function addTestimonial() {
    setForm(f => (f ? { ...f, testimonials: [...f.testimonials, ""] } : f));
  }

  function removeTestimonial(i: number) {
    setForm(f => (f ? { ...f, testimonials: f.testimonials.filter((_, idx) => idx !== i) } : f));
  }

  function removePhoto(i: number) {
    setForm(f => (f ? { ...f, photos: f.photos.filter((_, idx) => idx !== i) } : f));
  }

  async function handlePhotoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length || !form) return;
    setUploadErr("");

    if (tenantId === "preview") {
      const urls = files.map(f => URL.createObjectURL(f));
      setForm(f => (f ? { ...f, photos: [...f.photos, ...urls].slice(0, 8) } : f));
      return;
    }

    setUploadingPhotos(true);
    const safeName = (form.name || "school")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");
    const added: string[] = [];
    for (const file of files) {
      if (form.photos.length + added.length >= 8) break;
      const ext = ((file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "")) || "jpg";
      const path = `studio-photos/${safeName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("client-assets").upload(path, file);
      if (error) {
        setUploadErr("Upload failed: " + error.message);
        break;
      }
      const { data: pub } = supabase.storage.from("client-assets").getPublicUrl(path);
      if (pub && pub.publicUrl) added.push(pub.publicUrl);
    }
    if (added.length) setForm(f => (f ? { ...f, photos: [...f.photos, ...added].slice(0, 8) } : f));
    setUploadingPhotos(false);
  }

  async function handleSave() {
    if (!form || !data) return;
    setSaving(true);
    setSaved(false);
    setSaveErr("");

    if (tenantId === "preview") {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return;
    }

    const nv = (v: unknown): string | null => {
      const t = (v ?? "").toString().trim();
      return t ? t : null;
    };
    const np = (v: unknown): number | null => (v === "" || v === null || v === undefined ? null : Number(v));

    const clientUpdate = {
      name: form.name.trim(),
      city: nv(form.city),
      state: nv(form.state),
      studio_phone: nv(form.studio_phone),
      email: nv(form.email),
      website: nv(form.website),
      tagline: nv(form.tagline),
      logo_url: nv(form.logo_url),
      program_prices: form.program_prices,
    };

    const newConfig = {
      ...data.tenant.config,
      about: nv(form.about),
      address: nv(form.address),
      hours: nv(form.hours),
      director_name: nv(form.director_name),
      director_title: nv(form.director_title),
      location_name: nv(form.location_name),
      primary_color: nv(form.primary_color),
      accent_color: nv(form.accent_color),
      map_url: nv(form.map_url),
      testimonials: form.testimonials.map(t => t.trim()).filter(Boolean),
      photos: form.photos,
      social_facebook: nv(form.social_facebook),
      social_instagram: nv(form.social_instagram),
      monthly_price_standard: np(form.monthly_price_standard),
      monthly_price_military: np(form.monthly_price_military),
    };

    const [clientRes, tenantRes] = await Promise.all([
      supabase.from("clients").update(clientUpdate).eq("id", tenantId),
      supabase
        .from("agent_tenants")
        .update({ name: form.name.trim(), config: newConfig, updated_at: new Date().toISOString() })
        .eq("tenant_id", tenantId),
    ]);

    setSaving(false);
    const err = clientRes.error || tenantRes.error;
    if (err) {
      setSaveErr("Save failed: " + err.message);
      return;
    }
    setData(d => (d ? {
      ...d,
      client: { ...d.client, ...clientUpdate },
      tenant: { ...d.tenant, config: newConfig },
    } : d));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "32px 36px", overflowY: "auto", height: "100%", animation: "fadeIn 0.2s ease" },
    heading: { fontSize: 23, fontWeight: 700, letterSpacing: "-0.4px", color: "var(--t1)", marginBottom: 4 },
    sub: { fontSize: 14, color: "var(--t3)", marginBottom: 28 },
    section: { marginBottom: 32 },
    sectionHead: {
      paddingBottom: 10, marginBottom: 18, borderBottom: "1px solid var(--border)",
      fontSize: 12, fontWeight: 700, color: "var(--t3)",
      letterSpacing: "0.08em", textTransform: "uppercase",
    },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
    grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 },
    fieldWrap: { marginBottom: 14 },
    label: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--t2)", marginBottom: 5 },
    input: {
      width: "100%", padding: "9px 12px",
      background: "var(--bg)", border: "1px solid var(--bmed)",
      borderRadius: 7, fontSize: 14, color: "var(--t1)",
      outline: "none", fontFamily: "inherit",
    },
    textarea: {
      width: "100%", padding: "9px 12px",
      background: "var(--bg)", border: "1px solid var(--bmed)",
      borderRadius: 7, fontSize: 14, color: "var(--t1)",
      outline: "none", fontFamily: "inherit", resize: "vertical",
    },
    select: {
      padding: "9px 10px",
      background: "var(--bg)", border: "1px solid var(--bmed)",
      borderRadius: 7, fontSize: 14, color: "var(--t1)",
      outline: "none", fontFamily: "inherit", cursor: "pointer",
    },
    priceWrap: {
      display: "flex", alignItems: "center",
      background: "var(--bg)", border: "1px solid var(--bmed)",
      borderRadius: 7, overflow: "hidden",
    },
    priceSymbol: {
      padding: "9px 10px 9px 12px", fontSize: 14, color: "var(--t3)", flexShrink: 0,
    },
    priceInput: {
      flex: 1, minWidth: 0, padding: "9px 12px 9px 2px", background: "transparent",
      border: "none", fontSize: 14, color: "var(--t1)", outline: "none",
      fontFamily: "inherit",
    },
    chipRow: { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" },
    note: { fontSize: 12, color: "var(--t4)", marginTop: 6 },
    link: { fontSize: 13, color: "var(--accent)", fontWeight: 600, textDecoration: "none" },
    colorRow: { display: "flex", alignItems: "center", gap: 8 },
    colorSwatch: {
      width: 36, height: 36, padding: 2, flexShrink: 0,
      background: "var(--bg)", border: "1px solid var(--bmed)",
      borderRadius: 7, cursor: "pointer",
    },
    logoThumb: {
      width: 40, height: 40, borderRadius: 7, objectFit: "contain",
      border: "1px solid var(--border)", background: "var(--bg)", flexShrink: 0,
    },
    testimonialRow: { display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 },
    removeBtn: {
      padding: "7px 12px", background: "var(--bg)", color: "var(--t3)",
      border: "1px solid var(--bmed)", borderRadius: 7, fontSize: 13, fontWeight: 600,
      cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
    },
    addBtn: {
      padding: "8px 16px", background: "var(--bg)", color: "var(--t2)",
      border: "1px solid var(--bmed)", borderRadius: 7, fontSize: 13, fontWeight: 600,
      cursor: "pointer", fontFamily: "inherit",
    },
    photoGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 },
    photoCell: {
      position: "relative", aspectRatio: "1", borderRadius: 8,
      overflow: "hidden", border: "1px solid var(--border)",
    },
    photoImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
    photoDel: {
      position: "absolute", top: 5, right: 5, width: 20, height: 20,
      borderRadius: "50%", background: "rgba(0,0,0,0.55)", color: "#fff",
      border: "none", cursor: "pointer", fontSize: 13, lineHeight: "20px",
      padding: 0, fontFamily: "inherit",
    },
    instrumentBlock: { marginBottom: 18 },
    instrumentName: { fontSize: 14, fontWeight: 700, color: "var(--t1)", marginBottom: 8 },
    readonlyLine: { fontSize: 14, color: "var(--t2)" },
    metaLine: { fontSize: 12, color: "var(--t4)", marginTop: 10 },
    errText: { fontSize: 13, color: "#DC2626", fontWeight: 600 },
    actions: { display: "flex", alignItems: "center", gap: 12, marginTop: 4 },
    saveBtn: {
      padding: "9px 22px", background: "var(--accent)", color: "#fff",
      border: "none", borderRadius: 7, fontSize: 14, fontWeight: 600,
      cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
      fontFamily: "inherit",
    },
    savedMsg: { fontSize: 13, color: "#059669", fontWeight: 600 },
  };

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600,
    background: active ? "var(--accent-bg)" : "var(--bg)",
    color: active ? "var(--accent)" : "var(--t4)",
    border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
  });

  if (loading) return (
    <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "var(--t3)", fontSize: 14 }}>Loading…</div>
    </div>
  );

  if (!form || !data) return (
    <div style={s.page}>
      <div style={s.heading}>My Business</div>
      <div style={{ color: "var(--t3)", fontSize: 14, marginTop: 8 }}>No business profile found.</div>
    </div>
  );

  const cfg = data.tenant.config || {};
  const slug = data.client.slug || "";
  const instruments = Array.isArray(data.client.instruments) ? data.client.instruments : [];

  const field = (label: string, key: keyof FormState, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div style={s.fieldWrap}>
      <label style={s.label}>{label}</label>
      <input style={s.input} value={form[key] as string} onChange={e => set(key, e.target.value as FormState[typeof key])} {...props} />
    </div>
  );

  const colorField = (label: string, key: keyof FormState) => (
    <div style={s.fieldWrap}>
      <label style={s.label}>{label}</label>
      <div style={s.colorRow}>
        <input
          type="color"
          style={s.colorSwatch}
          value={(form[key] as string) || "#000000"}
          onChange={e => set(key, e.target.value as FormState[typeof key])}
        />
        <input
          style={s.input}
          value={form[key] as string}
          onChange={e => set(key, e.target.value as FormState[typeof key])}
          placeholder="#1A2B3C"
        />
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.heading}>My Business</div>
      <div style={s.sub}>This information powers your AI agent and your landing pages. Keep it current.</div>

      <div style={s.chipRow}>
        <div style={chipStyle(data.tenant.status === "active")}>● Active</div>
        <div style={chipStyle(false)}>{data.tenant.plan_tier || "individual"} plan</div>
      </div>

      {/* ───── School Info ───── */}
      <div style={s.section}>
        <div style={s.sectionHead}>School Info</div>
        <div style={s.grid2}>
          {field("School Name", "name")}
          {field("Location Name", "location_name", { placeholder: "e.g. Main Studio" })}
          {field("City", "city")}
          {field("State", "state", { placeholder: "e.g. TX", maxLength: 2, onChange: e => set("state", e.target.value.toUpperCase()) })}
          {field("Phone", "studio_phone", { placeholder: "(555) 555-0123" })}
          {field("Email", "email", { type: "email" })}
          {field("Website", "website", { placeholder: "https://…" })}
          {field("Director / Owner Name", "director_name")}
          {field("Director Title", "director_title", { placeholder: "e.g. Owner" })}
        </div>
      </div>

      {/* ───── Location ───── */}
      <div style={s.section}>
        <div style={s.sectionHead}>Location</div>
        {field("Address", "address", { placeholder: "123 Main St, City, ST 00000" })}
        {field("Hours", "hours", { placeholder: "e.g. Mon–Fri 10am–8pm, Sat 9am–2pm" })}
        <div style={s.fieldWrap}>
          <label style={s.label}>
            Google Maps Link{" "}
            {form.map_url.trim() && (
              <a style={s.link} href={form.map_url.trim()} target="_blank" rel="noreferrer">open ↗</a>
            )}
          </label>
          <input style={s.input} value={form.map_url} onChange={e => set("map_url", e.target.value)} placeholder="https://maps.google.com/…" />
        </div>
      </div>

      {/* ───── Brand ───── */}
      <div style={s.section}>
        <div style={s.sectionHead}>Brand</div>
        <div style={s.fieldWrap}>
          <label style={s.label}>Logo URL</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {form.logo_url.trim() && <img style={s.logoThumb} src={form.logo_url.trim()} alt="Logo" />}
            <input style={s.input} value={form.logo_url} onChange={e => set("logo_url", e.target.value)} placeholder="https://…/logo.png" />
          </div>
        </div>
        <div style={s.grid2}>
          {colorField("Primary Color", "primary_color")}
          {colorField("Accent Color", "accent_color")}
        </div>
        <div style={{ ...s.note, marginTop: 0, marginBottom: 14 }}>Your primary color styles your landing pages.</div>
        {field("Tagline", "tagline", { placeholder: "e.g. Where your town learns to play" })}
        <div style={s.fieldWrap}>
          <label style={s.label}>About</label>
          <textarea
            style={s.textarea}
            rows={5}
            value={form.about}
            onChange={e => set("about", e.target.value)}
            placeholder="Tell families what makes your school special…"
          />
        </div>
      </div>

      {/* ───── Programs & Pricing ───── */}
      <div style={s.section}>
        <div style={s.sectionHead}>Programs &amp; Pricing</div>
        <div style={s.chipRow}>
          {instruments.length
            ? instruments.map(inst => <div key={inst} style={chipStyle(true)}>{inst}</div>)
            : <div style={chipStyle(false)}>No instruments on file</div>}
        </div>
        {instruments.map(inst => {
          const pp = form.program_prices[inst] || {};
          return (
            <div key={inst} style={s.instrumentBlock}>
              <div style={s.instrumentName}>{inst}</div>
              <div style={s.grid2}>
                <div>
                  <label style={s.label}>Price / lesson</label>
                  <div style={s.priceWrap}>
                    <span style={s.priceSymbol}>$</span>
                    <input
                      style={s.priceInput}
                      type="number"
                      value={pp.price ?? ""}
                      onChange={e => setProgramPrice(inst, "price", e.target.value)}
                      placeholder="45"
                    />
                  </div>
                </div>
                <div>
                  <label style={s.label}>Lesson duration</label>
                  <select
                    style={{ ...s.select, width: "100%" }}
                    value={pp.duration || "30"}
                    onChange={e => setProgramPrice(inst, "duration", e.target.value)}
                  >
                    {DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
        <div style={s.grid2}>
          <div style={s.fieldWrap}>
            <label style={s.label}>Standard / month</label>
            <div style={s.priceWrap}>
              <span style={s.priceSymbol}>$</span>
              <input
                style={s.priceInput}
                type="number"
                value={form.monthly_price_standard}
                onChange={e => set("monthly_price_standard", e.target.value)}
                placeholder="160"
              />
            </div>
          </div>
          <div style={s.fieldWrap}>
            <label style={s.label}>Military discount / month</label>
            <div style={s.priceWrap}>
              <span style={s.priceSymbol}>$</span>
              <input
                style={s.priceInput}
                type="number"
                value={form.monthly_price_military}
                onChange={e => set("monthly_price_military", e.target.value)}
                placeholder="140"
              />
            </div>
          </div>
        </div>
        {cfg.pricing_notes && (
          <div style={s.readonlyLine}>Pricing notes on file: {cfg.pricing_notes}</div>
        )}
        <div style={s.note}>Want to add an instrument? Contact ZiroWork — each one gets its own landing page.</div>
        {slug && instruments.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <label style={s.label}>Your live landing pages</label>
            {instruments.map(inst => {
              const url = `https://app.zirowork.com/schools/${slug}/${INSTRUMENT_SLUGS[inst] || inst.toLowerCase()}`;
              return (
                <div key={inst} style={{ marginBottom: 4 }}>
                  <a style={s.link} href={url} target="_blank" rel="noreferrer">{url} ↗</a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ───── Testimonials ───── */}
      <div style={s.section}>
        <div style={s.sectionHead}>Testimonials</div>
        {form.testimonials.map((t, i) => (
          <div key={i} style={s.testimonialRow}>
            <textarea
              style={{ ...s.textarea, flex: 1 }}
              rows={2}
              value={t}
              onChange={e => setTestimonial(i, e.target.value)}
              placeholder="What did a happy family say about you?"
            />
            <button style={s.removeBtn} onClick={() => removeTestimonial(i)}>Remove</button>
          </div>
        ))}
        <button style={s.addBtn} onClick={addTestimonial}>+ Add testimonial</button>
        <div style={s.note}>These appear on your landing pages.</div>
      </div>

      {/* ───── Photos ───── */}
      <div style={s.section}>
        <div style={s.sectionHead}>Photos</div>
        {form.photos.length > 0 && (
          <div style={s.photoGrid}>
            {form.photos.map((url, i) => (
              <div key={url + i} style={s.photoCell}>
                <img style={s.photoImg} src={url} alt={`Studio photo ${i + 1}`} />
                <button style={s.photoDel} onClick={() => removePhoto(i)} title="Remove photo">×</button>
              </div>
            ))}
          </div>
        )}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={handlePhotoFiles}
        />
        <button
          style={{ ...s.addBtn, cursor: uploadingPhotos || form.photos.length >= 8 ? "not-allowed" : "pointer", opacity: uploadingPhotos || form.photos.length >= 8 ? 0.5 : 1 }}
          onClick={() => photoInputRef.current?.click()}
          disabled={uploadingPhotos || form.photos.length >= 8}
        >
          {uploadingPhotos ? "Uploading…" : "+ Upload photos"}
        </button>
        {uploadErr && <div style={{ ...s.errText, marginTop: 8 }}>{uploadErr}</div>}
        <div style={s.note}>The first 4 photos appear on your landing pages. Up to 8 photos.</div>
      </div>

      {/* ───── Social & Google ───── */}
      <div style={s.section}>
        <div style={s.sectionHead}>Social &amp; Google</div>
        <div style={s.grid2}>
          {field("Facebook", "social_facebook", { placeholder: "https://facebook.com/…" })}
          {field("Instagram", "social_instagram", { placeholder: "https://instagram.com/…" })}
        </div>
        {cfg.google_rating != null && (
          <div style={s.readonlyLine}>
            ★ {cfg.google_rating} on Google{cfg.google_review_count != null ? ` · ${cfg.google_review_count} reviews` : ""}
          </div>
        )}
        {(cfg.platform || cfg.scraped_at) && (
          <div style={s.metaLine}>
            {cfg.scraped_at ? `Profile data gathered ${new Date(cfg.scraped_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}
            {cfg.platform ? `${cfg.scraped_at ? " · " : ""}Website platform: ${cfg.platform}` : ""}
          </div>
        )}
      </div>

      <div style={s.actions}>
        <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && <div style={s.savedMsg}>✓ Saved — your agent is updated</div>}
        {saveErr && <div style={s.errText}>{saveErr}</div>}
      </div>
    </div>
  );
}
