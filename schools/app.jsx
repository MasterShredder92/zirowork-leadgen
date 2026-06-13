const SUPABASE_URL = 'https://txpgyuetfsrzfxxopwzf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4cGd5dWV0ZnNyemZ4eG9wd3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDk5MzQsImV4cCI6MjA5NDc4NTkzNH0.LaSe5Gfho9WIqKQOyBECKHx4CbtIO95RexqoAQMkIvQ'; // public anon key — nosemgrep: generic.secrets.security.detected-jwt-token.detected-jwt-token
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Funnel tracking — one row per page view, deduped per session so a refresh
// doesn't double-count. Fire-and-forget: tracking must NEVER break the page.
function logPageEvent(type, slug, instrument) {
  try {
    const key = `pe_${type}_${slug}_${instrument || ''}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    sb.from('page_events')
      .insert([{ slug, instrument: instrument || null, type, page_url: window.location.href }])
      .then(() => {}, () => {});
  } catch (e) { /* no-op */ }
}

function LandingLayout({ school, intakeUrl, instrument, children }) {
  const accent = school.accent || '#E04D27';
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif", color: '#1a1a1a' }}>

      {/* Sticky nav */}
      <nav style={{ position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #f0f0ee', zIndex: 100, padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          {school.logo
            ? <img src={school.logo} alt={school.name} style={{ height: 36, width: 'auto', maxWidth: 180, objectFit: 'contain', display: 'block' }} />
            : <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#bbb', fontWeight: 600, flexShrink: 0 }}>LOGO</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.02em' }}>{school.name}</div>
              </div>
          }
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            {school.phone && (
              <a href={'tel:' + school.phone.replace(/\D/g, '')} style={{ fontSize: 15, color: '#555', textDecoration: 'none', display: 'none', fontWeight: 500 }}
                className="nav-phone">
                {school.phone}
              </a>
            )}
            <a href={intakeUrl} style={{ padding: '9px 22px', background: accent, color: '#fff', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
              Get Started →
            </a>
          </div>
        </div>
      </nav>

      {/* Page content */}
      {children}

      {/* Footer */}
      <footer style={{ background: '#111', color: '#fff', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{school.name}</div>
            {school.phone && <a href={'tel:' + school.phone.replace(/\D/g, '')} style={{ fontSize: 14, color: '#666', textDecoration: 'none' }}>{school.phone}</a>}
            {school.city && <span style={{ fontSize: 14, color: '#555' }}>{school.city}{school.state ? ', ' + school.state : ''}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ fontSize: 12, color: '#444' }}>© 2025 {school.name}</div>
            <div style={{ fontSize: 12, color: '#444' }}>
              <a href="/privacy" target="_blank" style={{ color: '#666', textDecoration: 'none' }}>Privacy Policy</a>
              {' · '}
              <a href="/terms" target="_blank" style={{ color: '#666', textDecoration: 'none' }}>Terms</a>
            </div>
            <div style={{ fontSize: 12, color: '#333' }}>Powered by <span style={{ color: '#555', fontWeight: 600 }}>ZiroWork</span></div>
            <a href={intakeUrl} style={{ padding: '8px 18px', background: accent, color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Get Started →
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
window.LandingLayout = LandingLayout;

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ width: 40, height: 40, border: '3px solid #f0f0ee', borderTopColor: '#1a1a1a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontSize: 15, color: '#aaa' }}>Loading...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function buildSchool(client, config, page, slug) {
  return {
    name: client.name || (page && page.school_name) || config.location_name || 'Music School',
    city: client.city || '',
    state: client.state || '',
    phone: client.studio_phone || '',
    email: client.email || '',
    about: config.about || '',
    tagline: config.tagline || client.tagline || '',
    accent: config.primary_color || config.accent_color || '#E04D27',
    testimonials: config.testimonials || (client.testimonial ? [client.testimonial] : []),
    photos: config.photos || [],
    offer: client.offer || 'First lesson free',
    ageMin: config.age_min || 4,
    teachers: client.teachers || [],
    directorName: config.director_name || '',
    address: config.address || '',
    hours: config.hours || null,
    mapUrl: config.map_url || '',
    logo: client.logo_url || client.logo || config.logo_url || config.logo || null,
    stats: config.stats || client.stats || [],
    slug,
  };
}

function App() {
  const [state, setState] = React.useState({ loading: true, notFound: false, school: null, intakeUrl: null, instrument: null });

  const parts = window.location.pathname.split('/').filter(Boolean);
  const base = parts[0] === 'schools' ? 1 : 0;
  const slug = parts[base];
  const instrument = parts[base + 1];
  const isSignup = instrument === 'signup';
  const isThankYou = instrument === 'thank-you';
  const isConfirm = instrument === 'confirm';

  React.useEffect(() => {
    if (!slug) { setState(s => ({ ...s, loading: false, notFound: true })); return; }

    if (isSignup || isThankYou || isConfirm) {
      (async () => {
        try {
          const { data: clients } = await sb.from('clients').select('*').eq('slug', slug).limit(1);
          if (!clients?.length) { setState(s => ({ ...s, loading: false, notFound: true })); return; }
          const client = clients[0];
          const { data: tenants } = await sb.from('agent_tenants').select('*').eq('tenant_id', client.id).limit(1);
          const config = tenants?.[0]?.config || {};
          const school = buildSchool(client, config, null, slug);
          if (isSignup) {
            const sp = new URLSearchParams(window.location.search);
            logPageEvent('signup_view', slug, sp.get('instrument') || null);
          }
          setState({ loading: false, notFound: false, school, client, intakeUrl: null, instrument: null });
        } catch {
          setState(s => ({ ...s, loading: false, notFound: true }));
        }
      })();
      return;
    }

    if (!instrument) { setState(s => ({ ...s, loading: false, notFound: true })); return; }

    (async () => {
      try {
        const { data: pages } = await sb
          .from('client_pages')
          .select('*')
          .eq('slug', slug)
          .eq('instrument', instrument)
          .eq('status', 'live')
          .limit(1);

        if (!pages?.length) { setState(s => ({ ...s, loading: false, notFound: true })); return; }
        const page = pages[0];
        logPageEvent('view', slug, instrument);

        const [{ data: clients }, { data: tenants }] = await Promise.all([
          sb.from('clients').select('*').eq('id', page.client_id).limit(1),
          sb.from('agent_tenants').select('*').eq('tenant_id', page.client_id).limit(1),
        ]);

        const client = clients?.[0] || {};
        const config = tenants?.[0]?.config || {};
        const school = buildSchool(client, config, page, slug);

        const INST_LABEL = { piano: 'Piano', guitar: 'Guitar', vocals: 'Voice', drums: 'Drum' };
        document.title = `${INST_LABEL[instrument] || instrument} Lessons in ${school.city || school.name} | ${school.name}`;

        const intakeUrl = `/schools/${slug}/signup?instrument=${instrument}`;
        setState({ loading: false, notFound: false, school, intakeUrl, instrument });
      } catch {
        setState(s => ({ ...s, loading: false, notFound: true }));
      }
    })();
  }, []);

  if (state.loading) return <LoadingScreen />;
  if (state.notFound) return <NotFoundPage />;

  if (isSignup) {
    const urlParams = new URLSearchParams(window.location.search);
    return <window.SignupPage school={state.school} slug={slug} instrument={urlParams.get('instrument') || ''} />;
  }
  if (isThankYou) {
    return <window.ThankYouPage school={state.school} slug={slug} />;
  }
  if (isConfirm) {
    return <window.ConfirmPage school={state.school} client={state.client} slug={slug} />;
  }

  const PAGES = {
    piano:  window.PianoPage,
    guitar: window.GuitarPage,
    vocals: window.VocalsPage,
    drums:  window.DrumsPage,
  };

  const Page = PAGES[state.instrument];
  if (!Page) return <NotFoundPage />;

  return <Page school={state.school} intakeUrl={state.intakeUrl} />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
