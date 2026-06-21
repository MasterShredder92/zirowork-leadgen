"use client";

import { useState, useEffect, useRef, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { useClients } from "@/hooks/tables";
import { useRollups } from "@/hooks/useRollups";
import { supabase } from "@/lib/supabase/client";
import type { Client } from "@/lib/derive/types";

type ClientRow = Client & {
  state?: string | null;
  health?: string | null;
  instruments?: string[] | null;
  slug?: string | null;
  studio_phone?: string | null;
  email?: string | null;
  website?: string | null;
  tagline?: string | null;
  logo_url?: string | null;
  program_prices?: Record<string, { price?: string; duration?: string }> | null;
};

type TenantRow = {
  config?: Record<string, unknown>;
  per_enrollment_fee_cents?: number | null;
  name?: string | null;
};

type DetailData = { client: ClientRow; tenant: TenantRow };

type FormState = {
  per_enrollment_fee: string | number;
  name: string; city: string; state: string;
  studio_phone: string; email: string; website: string;
  tagline: string; logo_url: string;
  program_prices: Record<string, { price?: string; duration?: string }>;
  about: string; address: string; hours: string;
  director_name: string; director_title: string; location_name: string;
  primary_color: string; accent_color: string; map_url: string;
  testimonials: string[]; photos: string[];
  social_facebook: string; social_instagram: string;
  monthly_price_standard: string | number;
  monthly_price_military: string | number;
};

type UploadRow = { id: string; file_name: string; description: string; created_at: string };

const DURATIONS = ['30', '45', '60'];
const INSTRUMENT_SLUGS: Record<string, string> = { Piano: 'piano', Guitar: 'guitar', Voice: 'vocals', Drums: 'drums' };

function buildForm(client: ClientRow, cfg: Record<string, unknown>, tenant: TenantRow | null): FormState {
  return {
    per_enrollment_fee: tenant?.per_enrollment_fee_cents != null ? (tenant.per_enrollment_fee_cents / 100) : '',
    name: client.name || '',
    city: client.city || '',
    state: client.state || '',
    studio_phone: client.studio_phone || '',
    email: client.email || '',
    website: client.website || '',
    tagline: client.tagline || '',
    logo_url: client.logo_url || '',
    program_prices: (client.program_prices as Record<string, { price?: string; duration?: string }>) || {},
    about: typeof cfg.about === 'string' ? cfg.about : '',
    address: typeof cfg.address === 'string' ? cfg.address : '',
    hours: typeof cfg.hours === 'string' ? cfg.hours : '',
    director_name: (cfg.director_name as string) || '',
    director_title: (cfg.director_title as string) || '',
    location_name: (cfg.location_name as string) || '',
    primary_color: (cfg.primary_color as string) || '',
    accent_color: (cfg.accent_color as string) || '',
    map_url: (cfg.map_url as string) || '',
    testimonials: Array.isArray(cfg.testimonials) ? (cfg.testimonials as string[]).slice() : [],
    photos: Array.isArray(cfg.photos) ? (cfg.photos as string[]).slice() : [],
    social_facebook: (cfg.social_facebook as string) || '',
    social_instagram: (cfg.social_instagram as string) || '',
    monthly_price_standard: cfg.monthly_price_standard != null ? (cfg.monthly_price_standard as number) : '',
    monthly_price_military: cfg.monthly_price_military != null ? (cfg.monthly_price_military as number) : '',
  };
}

// Shared form styles
const inp: CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 7, fontSize: 14, color: 'var(--color-text-1)', outline: 'none', boxSizing: 'border-box' };
const lbl: CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-2)', marginBottom: 5 };
const secHead: CSSProperties = { paddingBottom: 10, marginBottom: 18, borderBottom: '1px solid var(--color-border)', fontSize: 11, fontWeight: 700, color: 'var(--color-text-4)', letterSpacing: '0.08em', textTransform: 'uppercase' };
const grid2: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };
const fw: CSSProperties = { marginBottom: 14 };
const ta: CSSProperties = { ...inp, resize: 'vertical' };
const ghostBtn: CSSProperties = { padding: '8px 16px', background: 'transparent', color: 'var(--color-text-2)', border: '1px solid var(--color-border)', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const removeBtn: CSSProperties = { ...ghostBtn, padding: '7px 12px', color: 'var(--color-text-3)', flexShrink: 0 };
const priceWrap: CSSProperties = { display: 'flex', alignItems: 'center', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 7, overflow: 'hidden' };
const priceSym: CSSProperties = { padding: '9px 10px 9px 12px', fontSize: 14, color: 'var(--color-text-3)' };
const priceInp: CSSProperties = { flex: 1, padding: '9px 12px 9px 2px', background: 'transparent', border: 'none', fontSize: 14, color: 'var(--color-text-1)', outline: 'none' };

function ClientDetail({ clientId }: { clientId: string }) {
  const [tab, setTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DetailData | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadPhotoErr, setUploadPhotoErr] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('agent_tenants').select('id, tenant_id, name, plan_tier, status, config, square_customer_id, square_card_id, per_enrollment_fee_cents, intake_api_key, integrations_enabled').eq('tenant_id', clientId).single(),
    ]).then(([cr, tr]) => {
      const client = (cr.data || {}) as ClientRow;
      const tenant = (tr.data || { config: {} }) as TenantRow;
      setData({ client, tenant });
      setForm(buildForm(client, (tenant.config as Record<string, unknown>) || {}, tenant));
      setLoading(false);
    });
  }, [clientId]);

  function loadUploads() {
    supabase
      .from('client_uploads')
      .select('id, file_name, description, created_at')
      .eq('tenant_id', clientId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data: rows }) => {
        if (rows) setUploads(rows as UploadRow[]);
      });
  }

  useEffect(() => {
    if (tab !== 'uploads') return;
    loadUploads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, clientId]);

  function set(key: keyof FormState, val: unknown) { setForm(f => f ? ({ ...f, [key]: val }) : f); }

  function setProgramPrice(inst: string, key: string, val: string) {
    setForm(f => f ? ({ ...f, program_prices: { ...f.program_prices, [inst]: { ...(f.program_prices[inst] || {}), [key]: val } } }) : f);
  }

  function setTestimonial(i: number, val: string) {
    setForm(f => { if (!f) return f; const t = f.testimonials.slice(); t[i] = val; return { ...f, testimonials: t }; });
  }

  function addTestimonial() { setForm(f => f ? ({ ...f, testimonials: [...f.testimonials, ''] }) : f); }
  function removeTestimonial(i: number) { setForm(f => f ? ({ ...f, testimonials: f.testimonials.filter((_, idx) => idx !== i) }) : f); }
  function removePhoto(i: number) { setForm(f => f ? ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }) : f); }

  async function handlePhotoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length || !form) return;
    setUploadPhotoErr('');
    setUploadingPhotos(true);
    const safeName = (form.name || 'school').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
    const added: string[] = [];
    for (const file of files) {
      if (form.photos.length + added.length >= 8) break;
      const ext = ((file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '')) || 'jpg';
      const path = `studio-photos/${safeName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('client-assets').upload(path, file);
      if (error) { setUploadPhotoErr('Upload failed: ' + error.message); break; }
      const { data: pub } = supabase.storage.from('client-assets').getPublicUrl(path);
      if (pub?.publicUrl) added.push(pub.publicUrl);
    }
    if (added.length) setForm(f => f ? ({ ...f, photos: [...f.photos, ...added].slice(0, 8) }) : f);
    setUploadingPhotos(false);
  }

  async function handleSave() {
    if (!form || !data) return;
    setSaving(true); setSaved(false); setSaveErr('');
    const nv = (v: unknown) => { const t = (v ?? '').toString().trim(); return t || null; };
    const np = (v: unknown) => (v === '' || v == null ? null : Number(v));
    const clientUpdate = {
      name: (form.name || '').trim(), city: nv(form.city), state: nv(form.state),
      studio_phone: nv(form.studio_phone), email: nv(form.email), website: nv(form.website),
      tagline: nv(form.tagline), logo_url: nv(form.logo_url), program_prices: form.program_prices,
    };
    const newConfig = {
      ...data.tenant.config,
      about: nv(form.about), address: nv(form.address), hours: nv(form.hours),
      director_name: nv(form.director_name), director_title: nv(form.director_title),
      location_name: nv(form.location_name), primary_color: nv(form.primary_color),
      accent_color: nv(form.accent_color), map_url: nv(form.map_url),
      testimonials: form.testimonials.map(t => t.trim()).filter(Boolean),
      photos: form.photos,
      social_facebook: nv(form.social_facebook), social_instagram: nv(form.social_instagram),
      monthly_price_standard: np(form.monthly_price_standard),
      monthly_price_military: np(form.monthly_price_military),
    };
    const [cr, tr] = await Promise.all([
      supabase.from('clients').update(clientUpdate).eq('id', clientId),
      supabase.from('agent_tenants').update({ name: (form.name || '').trim(), config: newConfig, per_enrollment_fee_cents: form.per_enrollment_fee === '' || form.per_enrollment_fee == null ? null : Math.round(Number(form.per_enrollment_fee) * 100), updated_at: new Date().toISOString() }).eq('tenant_id', clientId),
    ]);
    setSaving(false);
    const err = cr.error || tr.error;
    if (err) { setSaveErr('Save failed: ' + err.message); return; }
    setData(d => d ? ({ ...d, client: { ...d.client, ...clientUpdate }, tenant: { ...d.tenant, config: newConfig } }) : d);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleFileUpload() {
    if (!uploadFile || !uploadDesc.trim()) return;
    setUploading(true); setUploadSuccess(false);
    const path = `${clientId}/${Date.now()}-${uploadFile.name}`;
    const { error: storageErr } = await supabase.storage.from('client-uploads').upload(path, uploadFile);
    if (storageErr) { setUploading(false); setSaveErr('Upload failed: ' + storageErr.message); return; }
    await supabase.from('client_uploads').insert({ tenant_id: clientId, file_name: uploadFile.name, file_path: path, description: uploadDesc.trim() });
    setUploadFile(null); setUploadDesc(''); setUploading(false);
    setUploadSuccess(true); loadUploads(); setTimeout(() => setUploadSuccess(false), 4000);
  }

  const field = (label: string, key: keyof FormState, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div style={fw}>
      <label style={lbl}>{label}</label>
      <input style={inp} value={(form?.[key] as string) || ''} onChange={e => set(key, e.target.value)} {...props} />
    </div>
  );

  const colorField = (label: string, key: keyof FormState) => (
    <div style={fw}>
      <label style={lbl}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="color" style={{ width: 36, height: 36, padding: 2, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 7, cursor: 'pointer', flexShrink: 0 }}
          value={(form?.[key] as string) || '#000000'} onChange={e => set(key, e.target.value)} />
        <input style={inp} value={(form?.[key] as string) || ''} onChange={e => set(key, e.target.value)} placeholder="#1A2B3C" />
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--color-text-3)', fontSize: 14 }}>Loading…</div>
    </div>
  );

  if (!form || !data) return (
    <div style={{ padding: 32, color: 'var(--color-text-3)', fontSize: 14 }}>Client not found.</div>
  );

  const cfg = (data.tenant?.config) || {};
  const instruments = Array.isArray(data.client.instruments) ? data.client.instruments : [];
  const slug = data.client.slug || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', flexShrink: 0, padding: '0 24px' }}>
        {['profile', 'uploads'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '12px 16px', background: 'transparent', border: 'none',
            borderBottom: tab === t ? '2px solid var(--color-accent)' : '2px solid transparent',
            color: tab === t ? 'var(--color-text-1)' : 'var(--color-text-3)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', marginBottom: -1,
          }}>{t === 'profile' ? 'Profile' : 'Uploads'}</button>
        ))}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {tab === 'profile' && (
          <>
            {/* School Info */}
            <div style={{ marginBottom: 32 }}>
              <div style={secHead}>School Info</div>
              <div style={grid2}>
                {field('School Name', 'name')}
                {field('Location Name', 'location_name', { placeholder: 'e.g. Main Studio' })}
                {field('City', 'city')}
                {field('State', 'state', { placeholder: 'TX', maxLength: 2, onChange: e => set('state', e.target.value.toUpperCase()) })}
                {field('Phone', 'studio_phone', { placeholder: '(555) 555-0123' })}
                {field('Email', 'email', { type: 'email' })}
                {field('Website', 'website', { placeholder: 'https://…' })}
                {field('Director Name', 'director_name')}
                {field('Director Title', 'director_title', { placeholder: 'Owner' })}
              </div>
            </div>

            {/* Location */}
            <div style={{ marginBottom: 32 }}>
              <div style={secHead}>Location</div>
              {field('Address', 'address', { placeholder: '123 Main St, City, ST 00000' })}
              {field('Hours', 'hours', { placeholder: 'Mon–Fri 10am–8pm, Sat 9am–2pm' })}
              {field('Google Maps Link', 'map_url', { placeholder: 'https://maps.google.com/…' })}
            </div>

            {/* Brand */}
            <div style={{ marginBottom: 32 }}>
              <div style={secHead}>Brand</div>
              <div style={fw}>
                <label style={lbl}>Logo URL</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {form.logo_url && form.logo_url.trim() && (
                    <img style={{ width: 40, height: 40, borderRadius: 7, objectFit: 'contain', border: '1px solid var(--color-border)', background: 'var(--color-bg)', flexShrink: 0 }} src={form.logo_url.trim()} alt="Logo" />
                  )}
                  <input style={inp} value={form.logo_url || ''} onChange={e => set('logo_url', e.target.value)} placeholder="https://…/logo.png" />
                </div>
              </div>
              <div style={grid2}>
                {colorField('Primary Color', 'primary_color')}
                {colorField('Accent Color', 'accent_color')}
              </div>
              {field('Tagline', 'tagline', { placeholder: 'Where your town learns to play' })}
              <div style={fw}>
                <label style={lbl}>About</label>
                <textarea style={{ ...ta, width: '100%', boxSizing: 'border-box' }} rows={5} value={form.about || ''}
                  onChange={e => set('about', e.target.value)} placeholder="What makes this school special…" />
              </div>
            </div>

            {/* Programs & Pricing */}
            <div style={{ marginBottom: 32 }}>
              <div style={secHead}>Programs & Pricing</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {instruments.length
                  ? instruments.map(inst => <span key={inst} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)', color: 'var(--color-accent)', border: '1px solid var(--color-accent)' }}>{inst}</span>)
                  : <span style={{ color: 'var(--color-text-4)', fontSize: 13 }}>No instruments on file</span>}
              </div>
              {instruments.map(inst => {
                const pp = (form.program_prices && form.program_prices[inst]) || {};
                return (
                  <div key={inst} style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-1)', marginBottom: 8 }}>{inst}</div>
                    <div style={grid2}>
                      <div>
                        <label style={lbl}>Price / lesson</label>
                        <div style={priceWrap}>
                          <span style={priceSym}>$</span>
                          <input style={priceInp} type="number" value={pp.price ?? ''} onChange={e => setProgramPrice(inst, 'price', e.target.value)} placeholder="45" />
                        </div>
                      </div>
                      <div>
                        <label style={lbl}>Duration</label>
                        <select style={{ width: '100%', padding: '9px 10px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 7, fontSize: 14, color: 'var(--color-text-1)', outline: 'none', cursor: 'pointer' }}
                          value={pp.duration || '30'} onChange={e => setProgramPrice(inst, 'duration', e.target.value)}>
                          {DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div style={grid2}>
                <div style={fw}>
                  <label style={lbl}>Standard / month</label>
                  <div style={priceWrap}><span style={priceSym}>$</span><input style={priceInp} type="number" value={form.monthly_price_standard || ''} onChange={e => set('monthly_price_standard', e.target.value)} placeholder="160" /></div>
                </div>
                <div style={fw}>
                  <label style={lbl}>Military / month</label>
                  <div style={priceWrap}><span style={priceSym}>$</span><input style={priceInp} type="number" value={form.monthly_price_military || ''} onChange={e => set('monthly_price_military', e.target.value)} placeholder="140" /></div>
                </div>
              </div>
              {slug && instruments.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <label style={lbl}>Live landing pages</label>
                  {instruments.map(inst => {
                    const url = `https://app.zirowork.com/schools/${slug}/${INSTRUMENT_SLUGS[inst] || inst.toLowerCase()}`;
                    return <div key={inst} style={{ marginBottom: 4 }}><a style={{ fontSize: 13, color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }} href={url} target="_blank" rel="noreferrer">{url} ↗</a></div>;
                  })}
                </div>
              )}
            </div>

            {/* ZiroWork Billing */}
            <div style={{ marginTop: 20 }}>
              <div style={secHead}>ZiroWork Billing</div>
              <div style={fw}>
                <label style={lbl}>Per-enrollment fee — charged to this school per enrolled student</label>
                <div style={priceWrap}><span style={priceSym}>$</span><input style={priceInp} type="number" value={form.per_enrollment_fee} onChange={e => set('per_enrollment_fee', e.target.value)} placeholder="150" /></div>
              </div>
            </div>

            {/* Testimonials */}
            <div style={{ marginBottom: 32 }}>
              <div style={secHead}>Testimonials</div>
              {form.testimonials.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                  <textarea style={{ ...ta, flex: 1, boxSizing: 'border-box' }} rows={2} value={t}
                    onChange={e => setTestimonial(i, e.target.value)} placeholder="What did a happy family say?" />
                  <button style={removeBtn} onClick={() => removeTestimonial(i)}>Remove</button>
                </div>
              ))}
              <button style={ghostBtn} onClick={addTestimonial}>+ Add testimonial</button>
            </div>

            {/* Photos */}
            <div style={{ marginBottom: 32 }}>
              <div style={secHead}>Photos</div>
              {form.photos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
                  {form.photos.map((url, i) => (
                    <div key={url + i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                      <img style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} src={url} alt={`Photo ${i + 1}`} />
                      <button style={{ position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, lineHeight: '20px', padding: 0 }}
                        onClick={() => removePhoto(i)}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoFiles} />
              <button style={{ ...ghostBtn, opacity: uploadingPhotos || form.photos.length >= 8 ? 0.5 : 1, cursor: uploadingPhotos || form.photos.length >= 8 ? 'not-allowed' : 'pointer' }}
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhotos || form.photos.length >= 8}>
                {uploadingPhotos ? 'Uploading…' : '+ Upload photos'}
              </button>
              {uploadPhotoErr && <div style={{ fontSize: 13, color: 'var(--color-overdue-dot)', fontWeight: 600, marginTop: 8 }}>{uploadPhotoErr}</div>}
              <div style={{ fontSize: 12, color: 'var(--color-text-4)', marginTop: 6 }}>First 4 appear on landing pages. Up to 8.</div>
            </div>

            {/* Social */}
            <div style={{ marginBottom: 32 }}>
              <div style={secHead}>Social & Google</div>
              <div style={grid2}>
                {field('Facebook', 'social_facebook', { placeholder: 'https://facebook.com/…' })}
                {field('Instagram', 'social_instagram', { placeholder: 'https://instagram.com/…' })}
              </div>
              {(cfg as { google_rating?: number; google_review_count?: number }).google_rating != null && (
                <div style={{ fontSize: 14, color: 'var(--color-text-2)' }}>★ {(cfg as { google_rating?: number; google_review_count?: number }).google_rating} on Google{(cfg as { google_rating?: number; google_review_count?: number }).google_review_count != null ? ` · ${(cfg as { google_rating?: number; google_review_count?: number }).google_review_count} reviews` : ''}</div>
              )}
            </div>

            {/* Save */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 24 }}>
              <button style={{ padding: '9px 22px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
                onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              {saved && <div style={{ fontSize: 13, color: 'var(--color-paid-dot)', fontWeight: 600 }}>✓ Saved</div>}
              {saveErr && <div style={{ fontSize: 13, color: 'var(--color-overdue-dot)', fontWeight: 600 }}>{saveErr}</div>}
            </div>
          </>
        )}

        {tab === 'uploads' && (
          <>
            <div style={{ fontSize: 14, color: 'var(--color-text-3)', marginBottom: 16 }}>Files sent by this client, or upload on their behalf.</div>
            <div
              style={{ border: `1px dashed ${dragging ? 'var(--color-accent)' : 'var(--color-border)'}`, borderRadius: 10, padding: '36px 24px', textAlign: 'center', background: dragging ? 'color-mix(in srgb, var(--color-accent) 5%, transparent)' : 'transparent', cursor: 'pointer', transition: 'all 0.15s ease', marginBottom: 16 }}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setUploadFile(f); }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div style={{ fontSize: 14, color: 'var(--color-text-2)', marginBottom: 4 }}>Drop a file here or click to browse</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-4)' }}>PDF, image, spreadsheet, doc</div>
              {uploadFile && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)', color: 'var(--color-accent)', fontSize: 13, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>✓ {uploadFile.name}</div>}
              <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => setUploadFile(e.target.files?.[0] ?? null)} />
            </div>
            <label style={lbl}>What is this?</label>
            <textarea style={{ ...ta, width: '100%', boxSizing: 'border-box', marginBottom: 14, minHeight: 72 }} value={uploadDesc}
              onChange={e => setUploadDesc(e.target.value)} placeholder="e.g. Updated pricing, new teacher schedule, logo for landing page…" />
            <button
              style={{ padding: '9px 20px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: uploading || !uploadFile || !uploadDesc.trim() ? 'not-allowed' : 'pointer', opacity: uploading || !uploadFile || !uploadDesc.trim() ? 0.5 : 1 }}
              onClick={handleFileUpload} disabled={uploading || !uploadFile || !uploadDesc.trim()}>
              {uploading ? 'Uploading…' : 'Upload file'}
            </button>
            {uploadSuccess && <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 7, background: 'var(--color-paid-bg)', color: 'var(--color-paid-text)', fontSize: 13, fontWeight: 600 }}>✓ Uploaded</div>}
            {uploads.length > 0 && (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-1)', marginTop: 28, marginBottom: 12 }}>Previous uploads</div>
                {uploads.map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ width: 32, height: 32, background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--color-accent)', fontSize: 14, fontWeight: 700 }}>↑</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-1)', marginBottom: 2 }}>{u.file_name}</div>
                      <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>{u.description}</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-4)', flexShrink: 0, paddingTop: 2 }}>{new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ClientsView() {
  const router = useRouter();
  const clients = (useClients().data || []) as ClientRow[];
  const { byClient } = useRollups();
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<ClientRow | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const filters = [
    { id: 'all',        label: 'All' },
    { id: 'live',       label: 'Live' },
    { id: 'onboarding', label: 'Onboarding' },
    { id: 'at_risk',    label: 'At Risk' },
    { id: 'stuck',      label: 'Stuck' },
  ];

  const visible = filter === 'all' ? clients : clients.filter(c =>
    filter === 'at_risk' || filter === 'stuck' ? c.health === filter : c.status === filter
  );

  const healthColorVar = (h?: string | null): string => ({
    healthy: 'var(--color-status-scheduled)',
    at_risk: 'var(--color-status-no_show)',
    stuck:   'var(--color-program-guitar)',
  }[h ?? ''] ?? 'var(--color-status-completed)');

  const healthLabel = (h?: string | null): string => ({
    healthy: 'Healthy',
    at_risk: 'At Risk',
    stuck:   'Stuck',
  }[h ?? ''] ?? 'Onboarding');

  const pill = (colorVar: string, label: string) => (
    <span style={{ fontSize: 12, fontWeight: 600, color: colorVar, background: `color-mix(in srgb, ${colorVar} 10%, transparent)`, padding: '2px 8px', borderRadius: 20 }}>{label}</span>
  );

  const cell: CSSProperties = { padding: '11px 16px', fontSize: 14, color: 'var(--color-text-2)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' };
  const firstCell: CSSProperties = { ...cell, paddingLeft: 0 };
  const lastCell: CSSProperties = { ...cell, paddingRight: 0 };
  const numCell: CSSProperties = { ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 25, fontWeight: 700, color: 'var(--color-text-1)', letterSpacing: '-0.4px', margin: '0 0 4px 0' }}>Clients</h1>
          <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Which schools are live, onboarding, healthy, stuck, or at risk?</div>
        </div>
        <button onClick={() => router.push('/client-onboarding')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} strokeWidth={1.75} /> Add Client
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: '5px 12px', borderRadius: 6,
              border: `1px solid ${filter === f.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
              background: filter === f.id ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'transparent',
              color: filter === f.id ? 'var(--color-accent)' : 'var(--color-text-3)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>{f.label}</button>
          ))}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[
                { label: 'Client', align: 'left' as const },
                { label: 'Status', align: 'left' as const },
                { label: 'Health', align: 'left' as const },
                { label: 'Leads 30d', align: 'right' as const },
                { label: 'Trials', align: 'right' as const },
                { label: 'Enrolled', align: 'right' as const },
                { label: 'MRR', align: 'right' as const },
                { label: 'Campaigns', align: 'right' as const },
              ].map((h, i, arr) => (
                <th key={h.label} style={{ ...(i === 0 ? firstCell : i === arr.length - 1 ? lastCell : cell), color: 'var(--color-text-4)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: h.align }}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map(c => {
              const r = byClient[c.id] || {};
              return (
                <tr key={c.id}
                  style={{ cursor: 'pointer', background: hoverId === c.id ? 'var(--color-row-hover)' : 'transparent' }}
                  onClick={() => setSelected(c)}
                  onMouseEnter={() => setHoverId(c.id)}
                  onMouseLeave={() => setHoverId(null)}>
                  <td style={firstCell}>
                    <div style={{ fontWeight: 500, color: 'var(--color-text-1)' }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-4)' }}>{c.city}, {c.state}</div>
                  </td>
                  <td style={cell}>
                    {pill(c.status === 'live' ? 'var(--color-status-scheduled)' : 'var(--color-status-completed)', c.status === 'live' ? 'Live' : 'Onboarding')}
                  </td>
                  <td style={cell}>
                    {c.health ? pill(healthColorVar(c.health), healthLabel(c.health)) : <span style={{ color: 'var(--color-text-4)' }}>—</span>}
                  </td>
                  <td style={numCell}>{r.leads_30d}</td>
                  <td style={numCell}>{r.trials_30d}</td>
                  <td style={numCell}>{r.enrollments_30d}</td>
                  <td style={numCell}>{(c.mrr_cents ?? 0) > 0 ? '$' + (c.mrr_cents! / 100).toLocaleString() : <span style={{ color: 'var(--color-text-4)' }}>—</span>}</td>
                  <td style={lastCell}><span style={{ fontVariantNumeric: 'tabular-nums' }}>{r.active_campaigns}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Client detail panel */}
      {selected && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'var(--color-scrim)', zIndex: 100 }} onClick={() => setSelected(null)} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 560, background: 'var(--color-bg)', borderLeft: '1px solid var(--color-border)', zIndex: 101, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Panel header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-1)', letterSpacing: '-0.2px' }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-4)', marginTop: 1 }}>{selected.city}, {selected.state}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', padding: 4, lineHeight: 0 }}>
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>
            <ClientDetail key={selected.id} clientId={selected.id} />
          </div>
        </>
      )}
    </div>
  );
}
