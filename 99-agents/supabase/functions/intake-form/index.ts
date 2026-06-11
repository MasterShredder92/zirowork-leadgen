import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildPrivacyHtml, buildTermsHtml } from './legal.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') || '';

const DEFAULT_INSTRUMENTS = ['Piano', 'Guitar', 'Voice', 'Drums', 'Bass', 'Violin', 'Ukulele', 'Saxophone', 'Trumpet', 'Flute'];

function buildHtml(client: {
  id: string;
  name: string;
  tagline: string | null;
  offer: string | null;
  hero_photo_url: string | null;
  testimonial: string | null;
  instruments: string[] | null;
  fb_pixel_id: string | null;
  gtm_id: string | null;
}, preselectedInstrument: string | null = null, webhookSecret = ''): string {
  const instruments: string[] = (client.instruments && client.instruments.length > 0)
    ? client.instruments
    : DEFAULT_INSTRUMENTS;

  const instrumentOptions = instruments
    .map((i) => {
      const sel = (preselectedInstrument && i.toLowerCase() === preselectedInstrument.toLowerCase()) ? ' selected' : '';
      return `<option value="${escHtml(i)}"${sel}>${escHtml(i)}</option>`;
    })
    .join('\n        ');

  const onNewLeadUrl = `${SUPABASE_URL}/functions/v1/on-new-lead/${client.id}`;

  const gtmHead = client.gtm_id
    ? `  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${escHtml(client.gtm_id)}');</script>
  <!-- End Google Tag Manager -->`
    : '';

  const gtmBody = client.gtm_id
    ? `  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${escHtml(client.gtm_id)}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->`
    : '';

  const fbPixel = client.fb_pixel_id
    ? `  <!-- Facebook Pixel Code -->
  <script>
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${escHtml(client.fb_pixel_id)}');
  fbq('track', 'PageView');
  </script>
  <noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${escHtml(client.fb_pixel_id)}&ev=PageView&noscript=1"/></noscript>
  <!-- End Facebook Pixel Code -->`
    : '';

  const heroImg = client.hero_photo_url
    ? `<img src="${escHtml(client.hero_photo_url)}" alt="${escHtml(client.name)}" class="hero-img">`
    : '';

  const h1Text = preselectedInstrument
    ? `${escHtml(preselectedInstrument)} Lessons at ${escHtml(client.name)}`
    : escHtml(client.name);

  const tagline = client.tagline ? `<p class="tagline">${escHtml(client.tagline)}</p>` : '';
  const offer = client.offer ? `<p class="offer">${escHtml(client.offer)}</p>` : '';
  const testimonial = client.testimonial
    ? `<blockquote class="testimonial">${escHtml(client.testimonial)}</blockquote>`
    : '';

  const smsConsent = `Consent is not a condition of purchase. <a href="/functions/v1/intake-form/terms" target="_blank" style="color:#6366F1">Terms</a> &amp; <a href="/functions/v1/intake-form/privacy" target="_blank" style="color:#6366F1">Privacy Policy</a>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escHtml(client.name)} — Music Lessons</title>
${gtmHead}
${fbPixel}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #fff;
      color: #111;
      padding: 24px 16px 48px;
    }
    #app {
      max-width: 480px;
      margin: 0 auto;
    }
    header {
      text-align: center;
      margin-bottom: 28px;
    }
    .hero-img {
      width: 100%;
      max-height: 280px;
      object-fit: cover;
      border-radius: 10px;
      margin-bottom: 16px;
    }
    blockquote.testimonial {
      margin: 0 0 24px;
      padding: 16px 20px;
      background: #f5f5ff;
      border-left: 4px solid #6366F1;
      border-radius: 8px;
      font-size: 0.95rem;
      color: #333;
      line-height: 1.6;
    }
    blockquote.testimonial::before {
      content: '“';
      font-size: 2rem;
      color: #6366F1;
      line-height: 0;
      vertical-align: -0.4em;
      margin-right: 4px;
    }
    blockquote.testimonial::after {
      content: '”';
      font-size: 2rem;
      color: #6366F1;
      line-height: 0;
      vertical-align: -0.4em;
      margin-left: 4px;
    }
    header h1 {
      font-size: 1.6rem;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .tagline {
      font-size: 1rem;
      color: #555;
      margin-bottom: 6px;
    }
    .offer {
      font-size: 0.95rem;
      color: #6366F1;
      font-weight: 600;
      margin-bottom: 0;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 4px;
      color: #333;
    }
    input[type="text"],
    input[type="tel"],
    input[type="email"],
    input[type="number"],
    select {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
      color: #111;
      background: #fff;
      outline: none;
      transition: border-color 0.15s;
    }
    input:focus, select:focus {
      border-color: #6366F1;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
    }
    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .checkbox-row input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: #6366F1;
      cursor: pointer;
      flex-shrink: 0;
    }
    .checkbox-row label {
      margin: 0;
      font-size: 0.9rem;
      cursor: pointer;
    }
    button[type="submit"] {
      width: 100%;
      padding: 14px;
      background: #6366F1;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
      margin-top: 4px;
    }
    button[type="submit"]:hover:not(:disabled) { background: #4F46E5; }
    button[type="submit"]:disabled { opacity: 0.65; cursor: not-allowed; }
    #thankyou {
      text-align: center;
      padding: 32px 0;
    }
    #thankyou h2 {
      font-size: 1.5rem;
      margin-bottom: 10px;
      color: #6366F1;
    }
    #thankyou p {
      color: #555;
      font-size: 1rem;
    }
    footer {
      margin-top: 28px;
      font-size: 0.75rem;
      color: #888;
      line-height: 1.5;
      text-align: center;
    }
  </style>
</head>
<body>
${gtmBody}
  <div id="app">
    <header>
      ${heroImg}
      <h1>${h1Text}</h1>
      ${tagline}
      ${offer}
    </header>

    ${testimonial}

    <form id="lead-form" novalidate>
      <div>
        <label for="first_name">First name *</label>
        <input type="text" id="first_name" name="first_name" required placeholder="First name" autocomplete="given-name">
      </div>
      <div>
        <label for="phone">Phone number *</label>
        <input type="tel" id="phone" name="phone" required placeholder="Phone number" autocomplete="tel">
      </div>
      <div>
        <label for="email">Email</label>
        <input type="email" id="email" name="email" placeholder="Email (optional)" autocomplete="email">
      </div>
      <div>
        <label for="instrument">Instrument *</label>
        <select id="instrument" name="instrument" required>
          <option value="" disabled selected>Select an instrument</option>
        ${instrumentOptions}
        </select>
      </div>
      <div>
        <label for="student_age">Student age</label>
        <input type="number" id="student_age" name="student_age" min="4" max="99" placeholder="Student age">
      </div>
      <div class="checkbox-row">
        <input type="checkbox" id="military" name="military">
        <label for="military">Military family — may qualify for discount</label>
      </div>
      <div>
        <label for="how_did_you_hear">How did you hear about us?</label>
        <input type="text" id="how_did_you_hear" name="how_did_you_hear" placeholder="How did you hear about us? (optional)">
      </div>
      <div class="checkbox-row" style="align-items:flex-start;margin-top:4px">
        <input type="checkbox" id="sms_consent" name="sms_consent" style="margin-top:2px">
        <label for="sms_consent" style="font-size:0.8rem;color:#444;line-height:1.5">I agree to receive automated text messages from <strong>${escHtml(client.name)}</strong> about my lesson inquiry. Up to 8 messages per inquiry. Msg &amp; data rates may apply. Reply HELP for help or STOP to cancel anytime. <a href="/functions/v1/intake-form/terms" target="_blank" style="color:#6366F1">Terms</a> | <a href="/functions/v1/intake-form/privacy" target="_blank" style="color:#6366F1">Privacy Policy</a></label>
      </div>

      <!-- Hidden UTM fields -->
      <input type="hidden" id="utm_source" name="utm_source">
      <input type="hidden" id="utm_campaign" name="utm_campaign">
      <input type="hidden" id="utm_medium" name="utm_medium">
      <input type="hidden" id="utm_content" name="utm_content">
      <input type="hidden" id="utm_term" name="utm_term">

      <div id="consent-error" style="display:none;color:#DC2626;font-size:0.8rem;margin-bottom:4px">Please check the box above to continue.</div>
      <button type="submit" id="submit-btn">Get Started</button>
    </form>

    <div id="thankyou" style="display:none"></div>

    <footer>${smsConsent}</footer>
  </div>

  <script>
    // Capture UTMs on load
    const params = new URLSearchParams(window.location.search);
    ['utm_source','utm_campaign','utm_medium','utm_content','utm_term'].forEach(function(k) {
      var el = document.getElementById(k);
      if (el) el.value = params.get(k) || '';
    });

    // Submit handler
    document.getElementById('lead-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      if (!document.getElementById('sms_consent').checked) {
        document.getElementById('consent-error').style.display = 'block';
        return;
      }
      document.getElementById('consent-error').style.display = 'none';
      var btn = document.getElementById('submit-btn');
      btn.disabled = true;
      btn.textContent = 'Sending...';

      var fd = new FormData(e.target);
      var payload = {
        type: 'INSERT',
        record: {
          first_name: fd.get('first_name'),
          phone: fd.get('phone'),
          email: fd.get('email') || null,
          instrument: fd.get('instrument'),
          student_age: parseInt(fd.get('student_age')) || null,
          military: fd.get('military') === 'on',
          how_did_you_hear: fd.get('how_did_you_hear') || null,
          sms_consent: true,
          sms_consent_at: new Date().toISOString(),
          utm: {
            utm_source: fd.get('utm_source') || null,
            utm_campaign: fd.get('utm_campaign') || null,
            utm_medium: fd.get('utm_medium') || null,
            utm_content: fd.get('utm_content') || null,
            utm_term: fd.get('utm_term') || null,
          },
          page_url: window.location.href,
        }
      };

      // Facebook Pixel Lead event
      if (typeof fbq !== 'undefined') fbq('track', 'Lead');
      // GTM event
      if (typeof dataLayer !== 'undefined') dataLayer.push({ event: 'generate_lead' });

      try {
        await fetch('${onNewLeadUrl}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-webhook-secret': '${webhookSecret}' },
          body: JSON.stringify(payload),
        });
      } catch (_) {}

      document.getElementById('lead-form').style.display = 'none';
      var ty = document.getElementById('thankyou');
      ty.style.display = 'block';
      ty.innerHTML = '<h2>Thanks, ' + fd.get('first_name') + '!</h2><p>We\'ll reach out within a few minutes.</p>';
    });
  </script>
</body>
</html>`;
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const KNOWN_INSTRUMENTS = ['piano','guitar','voice','drums','bass','violin','ukulele','saxophone','trumpet','flute'];

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const segments = url.pathname.split('/').filter(Boolean);

  // Instrument routing: path may end with /slug/instrument
  const lastSegment = segments[segments.length - 1];
  const secondToLast = segments[segments.length - 2];
  let slug = lastSegment;
  let preselectedInstrument: string | null = null;
  if (KNOWN_INSTRUMENTS.includes(lastSegment.toLowerCase())) {
    preselectedInstrument = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
    slug = secondToLast;
  }

  // Legal pages — serve before studio lookup
  if (slug === 'privacy') {
    return new Response(buildPrivacyHtml(), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
  if (slug === 'terms') {
    return new Response(buildTermsHtml(), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  // Guard: slug must exist and not just be the function name
  if (!slug || slug === 'intake-form') {
    return new Response('Missing client slug', { status: 400 });
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: client, error } = await db
    .from('clients')
    .select('id, name, tagline, offer, hero_photo_url, testimonial, instruments, fb_pixel_id, gtm_id')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    return new Response('Database error', { status: 500 });
  }

  if (!client) {
    return new Response('Studio not found', { status: 404 });
  }

  const html = buildHtml(client, preselectedInstrument, WEBHOOK_SECRET);

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
});
