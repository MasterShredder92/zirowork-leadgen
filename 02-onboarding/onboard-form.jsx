// 02-onboarding/onboard-form.jsx
// Shared wizard — used by ClientOnboardingView (CRM) and onboard.html (public)
function OnboardForm({ standalone, onSuccess, onCancel }) {
  const T = window.T || {};
  const L = window.LucideReact || {};
  const { useState } = React;

  const BLANK = {
    studio_name: '', city: '', state: '', area_code: '',
    studio_phone: '', website: '', email: '', password: '', address: '', hours: '',
    instruments: [], program_prices: {},
    logo_url: '', tagline: '', offer: '', testimonial: '',
    testimonials: ['', '', ''], photos: [],
    teachers: [{ name: '', bio: '' }],
    slots: [],
    fb_pixel_id: '', gtm_id: '', twilio_phone_number: '',
    about: '',
  };

  // Live landing-page templates only — expand as more instrument pages ship (see TEMPL in handleSubmit)
  const INSTRUMENTS = ['Piano', 'Guitar', 'Voice', 'Drums'];

  // Teachers, Schedule, AI Behavior, Tracking Pixels, and Twilio deliberately NOT collected
  // at onboarding (low friction) — they live in Settings / operator tooling after signup.
  const STEPS = [
    { n: 1, label: 'Studio Info',     required: true  },
    { n: 2, label: 'Programs',        required: true  },
    { n: 3, label: 'Brand Assets',    required: false },
    { n: 4, label: 'Review & Launch', required: false },
  ];

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [scraping, setScraping] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState('');
  const [scrapeReady, setScrapeReady] = useState(false);
  const [scrapedMeta, setScrapedMeta] = useState({});
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [phase, setPhase] = useState(standalone ? 'welcome' : 'wizard');
  const FUN_MSGS = ['Reading your website…', 'Finding your programs…', 'Pulling in your photos…', 'Getting a feel for your studio…', 'Almost ready…'];
  const [loadMsg, setLoadMsg] = useState(FUN_MSGS[0]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const scrapeWebsite = async () => {
    if (!form.website) return;
    setScraping(true); setScrapeMsg(''); setScrapeReady(false);
    try {
      const res = await fetch('https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/scrape-school', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: form.website }),
      });
      if (!res.ok) throw new Error('scrape failed');
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const loc = Array.isArray(data.locations) ? data.locations[0] : data;
      const phone = loc.phone || data.phone || '';
      const updates = {};

      if (data.school_name && !form.studio_name) updates.studio_name = data.school_name;
      if ((loc.city  || data.city)  && !form.city)  updates.city  = loc.city  || data.city;
      if ((loc.state || data.state) && !form.state) updates.state = loc.state || data.state;
      if (phone && !form.studio_phone) {
        updates.studio_phone = phone;
        const ac = phone.match(/\((\d{3})\)|^(\d{3})[-.\s]/);
        if (ac && !form.area_code) updates.area_code = ac[1] || ac[2];
      }
      if ((loc.email || data.email) && !form.email) updates.email = loc.email || data.email;
      if ((loc.address || data.address) && !form.address) updates.address = loc.address || data.address;
      if ((loc.hours || data.hours) && !form.hours) updates.hours = loc.hours || data.hours;
      if (data.logo_url   && !form.logo_url)   updates.logo_url   = data.logo_url;
      if (data.tagline    && !form.tagline)    updates.tagline    = data.tagline;
      if (data.about      && !form.about)      updates.about      = data.about;
      if (data.testimonials?.length && !form.testimonial) updates.testimonial = data.testimonials[0];
      if (data.testimonials?.length && !(form.testimonials || []).some(t => t && t.trim())) {
        updates.testimonials = [0, 1, 2].map(i => data.testimonials[i] || '');
      }

      if (data.programs?.length && form.instruments.length === 0) {
        const ALIASES = { voice: ['vocals', 'singing', 'vocal'], bass: ['bass guitar'] };
        const matched = INSTRUMENTS.filter(k => data.programs.some(p => {
          const pl = p.toLowerCase(), kl = k.toLowerCase();
          return pl.includes(kl) || kl.includes(pl) || (ALIASES[kl] || []).some(a => pl.includes(a));
        }));
        if (matched.length) {
          const pp = {};
          matched.forEach(m => { pp[m] = { price: '', duration: '30' }; });
          updates.instruments = matched;
          updates.program_prices = { ...form.program_prices, ...pp };
        }
      }

      if (data.google_photos?.length && (form.photos || []).length === 0) updates.photos = data.google_photos.slice(0, 4);

      setForm(f => ({ ...f, ...updates }));
      setScrapedMeta({
        platform:         data.platform         || null,
        social_facebook:  data.social_facebook  || null,
        social_instagram: data.social_instagram || null,
        director_name:    data.director_name    || null,
        pricing_notes:    data.pricing_notes    || null,
        testimonials:     data.testimonials?.length ? data.testimonials : null,
        primary_color:    data.primary_color    || null,
        accent_color:     data.accent_color     || null,
        map_url:          data.map_url          || null,
        google_rating:        data.google_rating       || null,
        google_review_count:  data.google_review_count || null,
        scraped_at:       new Date().toISOString(),
      });

      const filled = Object.keys(updates).filter(k => !['program_prices','instruments'].includes(k)).length
        + (updates.instruments?.length ? 1 : 0);
      if (filled > 0) { setScrapeReady(true); setScrapeMsg(''); }
      else setScrapeMsg('Scraped — no new fields found');
      setScraping(false);
      return filled > 0;
    } catch {
      setScrapeMsg('Could not scrape site — fill manually');
      setScraping(false);
      return false;
    }
  };

  // Welcome screen → run the scrape with a fun loading state, then enter the wizard.
  const startFromWebsite = async () => {
    if (!form.website || scraping) return;
    let i = 0;
    setLoadMsg(FUN_MSGS[0]);
    const iv = setInterval(() => { i = (i + 1) % FUN_MSGS.length; setLoadMsg(FUN_MSGS[i]); }, 1400);
    const ok = await scrapeWebsite();
    clearInterval(iv);
    if (ok) { setScrapeMsg(''); setStep(1); setPhase('wizard'); }
  };

  const blockers = [
    !form.studio_name             && 'Studio name is required',
    form.instruments.length === 0 && 'At least one instrument required — needed to build landing pages',
    standalone && !form.email                                  && 'Email is required to create your portal login',
    standalone && (!form.password || form.password.length < 8) && 'A portal password (8+ characters) is required',
  ].filter(Boolean);

  const willCreate = [
    form.area_code
      ? `Phone number (${form.area_code} area code) auto-provisioned via Twilio`
      : 'Phone number — add your studio phone to auto-provision',
    form.instruments.length > 0 && `${form.instruments.length} landing page template${form.instruments.length > 1 ? 's' : ''} (${form.instruments.join(', ')})`,
    form.instruments.length > 0 && `${form.instruments.length} campaign shell${form.instruments.length > 1 ? 's' : ''} ready to activate`,
    'Default automation rules (qualify + enroll)',
    'Client record with onboarding checklist',
  ].filter(Boolean);

  const summary = [
    { label: 'Studio',   value: form.studio_name ? `${form.studio_name} · ${form.city}, ${form.state}` : null },
    { label: 'Programs', value: form.instruments.length ? form.instruments.join(', ') : null },
    { label: 'Brand',    value: form.tagline || (form.logo_url ? 'Logo URL added' : null) },
  ];

  const inp = {
    width: '100%', padding: '8px 10px', background: 'var(--bg)',
    border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 13, color: T.t1,
    fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: 'border-box',
  };
  const fLabel = (text, req) => (
    <div style={{ fontSize: 11, fontWeight: 600, color: T.t3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
      {text}{req && <span style={{ color: T.accent, marginLeft: 3 }}>*</span>}
    </div>
  );

  const S1 = () => (
    <div>
      {!standalone && (
      <div style={{ marginBottom: scrapeReady ? 12 : 20, padding: '12px 14px', background: T.accent + '12', border: `1px solid ${T.accent}40`, borderRadius: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Start here — auto-fill from website</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...inp, flex: 1 }}
            value={form.website}
            onChange={e => { set('website', e.target.value); setScrapeMsg(''); setScrapeReady(false); }}
            placeholder="https://yourstudio.com"
          />
          <button
            onClick={scrapeWebsite}
            disabled={!form.website || scraping}
            style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: T.accent, color: '#fff', fontSize: 12, fontWeight: 700, cursor: form.website && !scraping ? 'pointer' : 'not-allowed', opacity: form.website && !scraping ? 1 : 0.4, fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: 'nowrap' }}>
            {scraping ? 'Scraping…' : 'Auto-fill ↓'}
          </button>
        </div>
        {scrapeMsg && <div style={{ fontSize: 11, marginTop: 5, color: scrapeMsg.startsWith('Could') ? '#ef4444' : T.accent }}>{scrapeMsg}</div>}
      </div>
      )}

      {scrapeReady && (
        <div style={{ marginBottom: 16, padding: '12px 14px', background: T.accent + '18', border: `1px solid ${T.accent}50`, borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: T.accent, fontWeight: 700, marginBottom: form.about ? 6 : 10 }}>Fields pre-filled from your site — review below and correct anything wrong.</div>
          {form.about && (
            <div style={{ fontSize: 12, color: T.t2, fontStyle: 'italic', lineHeight: 1.5, marginBottom: 10, padding: '8px 10px', background: 'var(--bg)', borderRadius: 6, border: `1px solid ${T.border}` }}>"{form.about}"</div>
          )}
          {(scrapedMeta.primary_color || scrapedMeta.accent_color) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: T.t3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Brand colors detected</span>
              {scrapedMeta.primary_color && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: scrapedMeta.primary_color, border: `1px solid ${T.border}` }} />
                  <span style={{ fontSize: 11, color: T.t2 }}>{scrapedMeta.primary_color}</span>
                </div>
              )}
              {scrapedMeta.accent_color && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: scrapedMeta.accent_color, border: `1px solid ${T.border}` }} />
                  <span style={{ fontSize: 11, color: T.t2 }}>{scrapedMeta.accent_color}</span>
                </div>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setStep(s => s + 1)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: T.accent, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Looks good → Step 2</button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 14 }}>{fLabel('Studio Name', true)}<input style={inp} value={form.studio_name} onChange={e => set('studio_name', e.target.value)} placeholder="Your Studio Name" /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10, marginBottom: 14 }}>
        <div>{fLabel('City', true)}<input style={inp} value={form.city} onChange={e => set('city', e.target.value)} placeholder="Austin" /></div>
        <div>{fLabel('State', true)}<input style={inp} value={form.state} onChange={e => set('state', e.target.value)} placeholder="TX" maxLength={2} /></div>
      </div>
      <div style={{ marginBottom: 14 }}>
        {fLabel('Studio Phone', true)}
        <input style={inp} value={form.studio_phone} onChange={e => {
          const v = e.target.value;
          let d = v.replace(/\D/g, '');
          if (d.length === 11 && d[0] === '1') d = d.slice(1);
          setForm(f => ({ ...f, studio_phone: v, area_code: d.length >= 10 ? d.slice(0, 3) : '' }));
        }} placeholder="(531) 270-0848" />
        <div style={{ fontSize: 11, color: T.t4, marginTop: 4 }}>Your ZiroWork number is auto-provisioned in this area code.</div>
      </div>
      <div style={{ marginBottom: 14 }}>{fLabel('Booking / Contact Email', standalone)}<input style={inp} value={form.email} onChange={e => set('email', e.target.value)} placeholder="hello@yourstudio.com" /></div>
      <div style={{ marginBottom: 14 }}>{fLabel('Street Address')}<input style={inp} value={form.address} onChange={e => set('address', e.target.value)} placeholder="1234 Music Ave, Suite 200" /></div>
      <div style={{ marginBottom: 14 }}>{fLabel('Hours')}<input style={inp} value={form.hours} onChange={e => set('hours', e.target.value)} placeholder="Mon–Fri 2–8pm · Sat 9am–2pm" /></div>
    </div>
  );

  const toggleInst = inst => {
    const has = form.instruments.includes(inst);
    const instruments = has ? form.instruments.filter(i => i !== inst) : [...form.instruments, inst];
    const program_prices = { ...form.program_prices };
    if (!has && !program_prices[inst]) program_prices[inst] = { price: '', duration: '30' };
    setForm(f => ({ ...f, instruments, program_prices }));
  };

  const S2 = () => (
    <div>
      <div style={{ marginBottom: 18 }}>
        {fLabel('Which Instruments Do You Want Leads For?', true)}
        <div style={{ fontSize: 11, color: T.t4, marginTop: 2, marginBottom: 4, lineHeight: 1.5 }}>
          Each instrument you pick gets its own landing page and campaign built for it. We're live with these four — more instruments coming soon.
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
          {INSTRUMENTS.map(inst => {
            const on = form.instruments.includes(inst);
            return (
              <button key={inst} onClick={() => toggleInst(inst)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: on ? T.accent : (T.border || '#e2e8f0'), color: on ? '#fff' : T.t3,
              }}>{inst}</button>
            );
          })}
        </div>
      </div>
      {form.instruments.length > 0 && (
        <div>
          {fLabel('Pricing per Program')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
            {form.instruments.map(inst => (
              <div key={inst} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg)', border: `1px solid ${T.border}`, borderRadius: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.t2, width: 90, flexShrink: 0 }}>{inst}</span>
                <input
                  style={{ ...inp, flex: 1 }}
                  value={form.program_prices[inst]?.price || ''}
                  onChange={e => setForm(f => ({ ...f, program_prices: { ...f.program_prices, [inst]: { ...f.program_prices[inst], price: e.target.value } } }))}
                  placeholder="$/lesson (e.g. 45)"
                />
                <select
                  value={form.program_prices[inst]?.duration || '30'}
                  onChange={e => setForm(f => ({ ...f, program_prices: { ...f.program_prices, [inst]: { ...f.program_prices[inst], duration: e.target.value } } }))}
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
      <div style={{ marginBottom: 14 }}>{fLabel('Logo URL')}<input style={inp} value={form.logo_url} onChange={e => set('logo_url', e.target.value)} placeholder="https://... (or add later)" /></div>
      <div style={{ marginBottom: 14 }}>
        {fLabel('Brand Colors')}
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 2 }}>
          {[['primary_color', 'Primary'], ['accent_color', 'Accent']].map(([k, label]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="color"
                value={scrapedMeta[k] || '#cccccc'}
                onChange={e => setScrapedMeta(m => ({ ...m, [k]: e.target.value }))}
                style={{ width: 30, height: 30, padding: 0, border: `1px solid ${T.border}`, borderRadius: 6, background: 'none', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 11, color: T.t3 }}>{label}{scrapedMeta[k] ? ' · ' + scrapedMeta[k] : ''}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: T.t4, marginTop: 4 }}>Detected from your website — click a swatch to correct. The primary color styles your landing pages.</div>
      </div>
      <div style={{ marginBottom: 14 }}>{fLabel('Studio Tagline')}<input style={inp} value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Building confidence through music since 2010" /></div>
      <div style={{ marginBottom: 14 }}>
        {fLabel('Primary Offer / Pitch')}
        <textarea style={{ ...inp, resize: 'vertical', minHeight: 72 }} value={form.offer} onChange={e => set('offer', e.target.value)} placeholder="First lesson free for new students. No contracts." />
      </div>
      <div style={{ marginBottom: 6 }}>
        {fLabel('Testimonials (up to 3)')}
        <div style={{ fontSize: 11, color: T.t4, marginBottom: 8, lineHeight: 1.5 }}>
          These appear throughout your landing page. Real quotes from real families convert better than any copy you can write.
        </div>
      </div>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ marginBottom: 10 }}>
          <textarea
            style={{ ...inp, resize: 'vertical', minHeight: 64 }}
            value={form.testimonials?.[i] || ''}
            onChange={e => {
              const next = [...(form.testimonials || ['', '', ''])];
              next[i] = e.target.value;
              set('testimonials', next);
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
        {fLabel('Studio Photos (up to 4)')}
        <div style={{ fontSize: 11, color: T.t4, marginBottom: 8, lineHeight: 1.5 }}>
          Photos of your actual studio, teachers, or recitals convert significantly better than stock images. You can skip and add later.
        </div>
      </div>

      {(form.photos || []).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
          {(form.photos || []).map((url, i) => (
            <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: '#f0f0ee' }}>
              <img src={url} alt={'Studio photo ' + (i + 1)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                onClick={() => set('photos', (form.photos || []).filter((_, idx) => idx !== i))}
                style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {(form.photos || []).length < 4 && (
        <label style={{ display: 'block', width: '100%', padding: '10px', border: `1px dashed ${T.border}`, borderRadius: 7, textAlign: 'center', cursor: photoUploading ? 'not-allowed' : 'pointer', opacity: photoUploading ? 0.5 : 1 }}>
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            disabled={photoUploading}
            onChange={async e => {
              const files = Array.from(e.target.files || []);
              if (!files.length) return;
              setPhotoUploading(true);
              setPhotoError('');
              const existing = form.photos || [];
              const slots = 4 - existing.length;
              const toUpload = files.slice(0, slots);
              const urls = [];
              for (const file of toUpload) {
                const ext = file.name.split('.').pop();
                const safeName = (form.studio_name || 'school').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-') || 'school';
                const path = 'studio-photos/' + safeName + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7) + '.' + ext.toLowerCase().replace(/[^a-z0-9]/g, '');
                const { error: upErr } = await window.sb.storage.from('client-assets').upload(path, file, { upsert: true });
                if (upErr) { setPhotoError('Upload failed: ' + upErr.message); break; }
                const { data: urlData } = window.sb.storage.from('client-assets').getPublicUrl(path);
                if (urlData?.publicUrl) urls.push(urlData.publicUrl);
              }
              set('photos', [...existing, ...urls]);
              setPhotoUploading(false);
              e.target.value = '';
            }}
          />
          <span style={{ fontSize: 12, color: T.t3, fontWeight: 600 }}>
            {photoUploading ? 'Uploading...' : '+ Upload photos'}
          </span>
        </label>
      )}
      {photoError && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{photoError}</div>}
    </div>
  );

  const S9 = () => (
    <div>
      {blockers.length > 0 && (
        <div style={{ padding: '12px 14px', background: '#EF44440D', border: '1px solid #EF444430', borderRadius: 8, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Missing — required before launch</div>
          {blockers.map(b => <div key={b} style={{ fontSize: 12, color: '#EF4444', marginBottom: 2 }}>· {b}</div>)}
        </div>
      )}
      <div style={{ padding: '12px 14px', background: '#22C55E0D', border: '1px solid #22C55E30', borderRadius: 8, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#22C55E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Will be created automatically</div>
        {willCreate.map(w => <div key={w} style={{ fontSize: 12, color: T.t2, marginBottom: 2 }}>· {w}</div>)}
      </div>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
        {summary.map((row, i) => (
          <div key={row.label} style={{ display: 'flex', gap: 16, padding: '10px 14px', borderBottom: i < summary.length - 1 ? `1px solid ${T.border}` : 'none' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.06em', width: 72, flexShrink: 0, paddingTop: 1 }}>{row.label}</span>
            <span style={{ fontSize: 12, color: row.value ? T.t1 : T.t4 }}>{row.value || '—'}</span>
          </div>
        ))}
      </div>
      {standalone && (
        <div style={{ marginTop: 14 }}>
          {fLabel('Create Your Portal Password', true)}
          <input style={inp} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="8+ characters" />
          <div style={{ fontSize: 11, color: T.t4, marginTop: 4 }}>You'll log into your ZiroWork portal with {form.email || 'your email'} + this password.</div>
        </div>
      )}
    </div>
  );

  const STEP_CONTENT = [S1, S2, S3, S9];
  const currentStep = STEPS[step - 1];
  const StepComponent = STEP_CONTENT[step - 1];

  const handleSubmit = async () => {
    if (!window.sb) { setSubmitted(true); onSuccess && onSuccess(form); return; }
    setSaving(true); setSaveError(null);
    const slug = form.studio_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const { data, error } = await window.sb.from('clients').insert([{
      name: form.studio_name, city: form.city, state: form.state, status: 'onboarding',
      health: null, sms_number: null, lead_form_webhook: null,
      protected_slots: false, brand_assets: false, automation_rules: false, integrations: false,
      slug, instruments: form.instruments, program_prices: form.program_prices,
      teachers: form.teachers.filter(t => t.name),
      studio_phone: form.studio_phone || null, website: form.website || null,
      email: form.email || null, area_code: form.area_code || null,
      tagline: form.tagline || null, offer: form.offer || null,
      testimonial: form.testimonial || null, logo_url: form.logo_url || null,
      fb_pixel_id: form.fb_pixel_id || null, gtm_id: form.gtm_id || null,
    }]).select();
    setSaving(false);
    if (error) { setSaveError('Failed to create profile. Try again.'); return; }
    const clientId = data?.[0]?.id;
    if (clientId) {
      const { error: tenantErr } = await window.sb.from('agent_tenants').upsert([{
        tenant_id: clientId,
        name: form.studio_name,
        config: {
          director_name:    scrapedMeta.director_name || (form.studio_name + ' Team'),
          location_name:    form.studio_name,
          monthly_price_standard: parseInt(Object.values(form.program_prices)[0]?.price || '160') || 160,
          twilio_phone_number: form.twilio_phone_number || '',
          about:            form.about      || null,
          tagline:          form.tagline    || null,
          address:          form.address    || null,
          hours:            form.hours      || null,
          pricing_notes:    scrapedMeta.pricing_notes    || null,
          platform:         scrapedMeta.platform         || null,
          social_facebook:  scrapedMeta.social_facebook  || null,
          social_instagram: scrapedMeta.social_instagram || null,
          testimonials:     (() => {
            const manual = (form.testimonials || []).filter(t => t && t.trim());
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
      }], { onConflict: 'tenant_id' });

      const TEMPL = ['Piano', 'Guitar', 'Voice', 'Drums'];
      const TO_SLUG = { Piano: 'piano', Guitar: 'guitar', Voice: 'vocals', Drums: 'drums' };
      const pageInst = (form.instruments || []).filter(i => TEMPL.includes(i));
      let pageErr = null;
      if (pageInst.length > 0) {
        ({ error: pageErr } = await window.sb.from('client_pages').insert(pageInst.map(i => ({
          client_id: clientId,
          instrument: TO_SLUG[i],
          slug,
          school_name: form.studio_name,
          status: 'live',
        }))));
      }
      if (tenantErr || pageErr) {
        setSaveError('Profile saved, but landing-page setup failed — contact support before launch.');
        return;
      }

      // Self-serve only: create the portal login + tenant link, then sign them in
      // for instant access. (CRM/manual path skips this — Zach has no school password.)
      if (standalone && form.email && form.password) {
        try {
          const resp = await fetch('https://txpgyuetfsrzfxxopwzf.supabase.co/functions/v1/complete-onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: form.email, password: form.password, tenant_id: clientId, full_name: form.studio_name }),
          });
          const out = await resp.json().catch(() => ({}));
          if (!resp.ok || out.error) {
            setSaveError(out.error === 'email_exists'
              ? 'That email already has an account — log in at /dashboard with it.'
              : 'Profile created, but portal login setup failed — contact support.');
            return;
          }
          await window.sb.auth.signInWithPassword({ email: form.email, password: form.password });
        } catch {
          setSaveError('Profile created, but portal login setup failed — contact support.');
          return;
        }
      }
    }
    onSuccess && onSuccess(form);
    setSubmitted(true);
  };

  if (standalone && phase === 'welcome' && !submitted) {
    return (
      <div style={{ background: T.cardBg || 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 480, border: `1px solid ${T.border}`, padding: '48px 40px', textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: T.accent, margin: '0 auto 22px' }} />
        <div style={{ fontSize: 24, fontWeight: 800, color: T.t1, letterSpacing: '-0.02em', marginBottom: 10 }}>Let's get your school set up</div>
        <div style={{ fontSize: 14, color: T.t3, lineHeight: 1.6, maxWidth: 360, margin: '0 auto 26px' }}>Paste your website and we'll pull in your programs, photos, and details automatically — so you barely have to type.</div>
        <input
          style={{ ...inp, padding: '13px 16px', fontSize: 15, textAlign: 'center', marginBottom: 12 }}
          value={form.website}
          onChange={e => { set('website', e.target.value); setScrapeMsg(''); }}
          onKeyDown={e => { if (e.key === 'Enter') startFromWebsite(); }}
          placeholder="yourstudio.com"
          autoFocus
        />
        {scraping ? (
          <div style={{ padding: '10px 0 4px' }}>
            <div style={{ width: 28, height: 28, border: `3px solid ${T.border}`, borderTopColor: T.accent, borderRadius: '50%', margin: '0 auto 12px', animation: 'zwspin 0.8s linear infinite' }} />
            <div style={{ fontSize: 13, color: T.accent, fontWeight: 600 }}>{loadMsg}</div>
            <style>{`@keyframes zwspin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <button
            onClick={startFromWebsite}
            disabled={!form.website}
            style={{ width: '100%', padding: '13px', background: T.accent, color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: form.website ? 'pointer' : 'not-allowed', opacity: form.website ? 1 : 0.45, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Get started →
          </button>
        )}
        {scrapeMsg && !scraping && <div style={{ fontSize: 12, marginTop: 10, color: scrapeMsg.startsWith('Could') ? '#EF4444' : T.t3 }}>{scrapeMsg}</div>}
        <div style={{ marginTop: 18 }}>
          <button onClick={() => { setScrapeMsg(''); setStep(1); setPhase('wizard'); }} style={{ background: 'none', border: 'none', color: T.t4, fontSize: 12, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", textDecoration: 'underline' }}>
            I don't have a website — set up manually
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ background: T.cardBg || 'var(--surface)', borderRadius: 12, width: '100%', maxWidth: 560, border: `1px solid ${T.border}`, padding: '40px 32px', textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#22C55E20', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          {L.Check && <L.Check size={24} color="#22C55E" strokeWidth={2.5} />}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.t1, marginBottom: 8 }}>
          {standalone ? "You're in!" : `${form.studio_name || 'Studio'} is queued.`}
        </div>
        <div style={{ fontSize: 13, color: T.t3, marginBottom: 20, lineHeight: 1.6 }}>
          {standalone
            ? "Your account is live and your landing pages are ready. Head to your portal to see everything."
            : "Profile created. Complete the checklist below to get this client fully live."}
        </div>
        {blockers.length > 0 && !standalone && (
          <div style={{ fontSize: 12, color: '#F59E0B', marginBottom: 16 }}>{blockers.length} item{blockers.length > 1 ? 's' : ''} still needed before launch.</div>
        )}
        <button
          onClick={standalone ? () => { window.location.href = '/dashboard'; } : () => onCancel && onCancel()}
          style={{ padding: '10px 28px', background: T.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {standalone ? 'Go to my portal →' : 'Done'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: T.cardBg || 'var(--surface)', borderRadius: 12, width: '100%', maxWidth: 560, maxHeight: '88vh', display: 'flex', flexDirection: 'column', border: `1px solid ${T.border}` }}>
      <div style={{ padding: '20px 24px 14px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.t1 }}>
              {standalone ? 'Get your school set up with ZiroWork' : 'New Client Onboarding'}
            </div>
            <div style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>
              Step {step} of {STEPS.length} · {currentStep.label}
              {!currentStep.required && <span style={{ color: T.t4, marginLeft: 4 }}>(optional)</span>}
            </div>
          </div>
          {!standalone && (
            <button onClick={() => onCancel && onCancel()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.t4, fontSize: 22, lineHeight: 1, padding: '0 2px' }}>×</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {STEPS.map(s => (
            <div key={s.n} style={{ flex: 1, height: 3, borderRadius: 2, background: s.n <= step ? T.accent : T.border, transition: 'background 0.2s' }} />
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {StepComponent()}
      </div>

      <div style={{ padding: '14px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <button
          onClick={() => step > 1 ? setStep(s => s - 1) : (!standalone && onCancel && onCancel())}
          style={{ padding: '8px 18px', background: 'transparent', color: T.t3, border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", visibility: step === 1 && standalone ? 'hidden' : 'visible' }}>
          {step === 1 ? 'Cancel' : '← Back'}
        </button>
        {step < STEPS.length ? (
          <button
            onClick={() => setStep(s => s + 1)}
            style={{ padding: '8px 20px', background: T.accent, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Next →
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {saveError && <div style={{ fontSize: 11, color: '#EF4444' }}>{saveError}</div>}
            <button
              disabled={saving || (standalone && blockers.length > 0)}
              onClick={handleSubmit}
              style={{ padding: '8px 22px', background: '#22C55E', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {saving ? 'Saving...' : 'Create Profile'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

window.OnboardForm = OnboardForm;
