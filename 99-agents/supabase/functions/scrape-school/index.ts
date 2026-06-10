const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') ?? '';
const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY') ?? '';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Content-Type': 'application/json',
};

const SYSTEM_PROMPT = `You are a data extraction assistant. Extract every piece of useful information about a music school from scraped website content. Content includes the MAIN PAGE (the exact URL the school owner pasted) and may include JSON-LD structured data, About and Teachers/Staff pages, CSS color hints, and the school's logo image.

LOCATION RULE — most important rule:
- The MAIN PAGE is the exact URL the owner pasted. If its path names a specific city or location (e.g. /omaha), the business has multiple locations and you must extract for THAT LOCATION ONLY:
  - city, state, address, phone, email, hours: take ONLY from MAIN PAGE content (or its JSON-LD) describing that location. NEVER use another branch's address, phone, or hours — even if they appear in footers, the About page, or the Teachers page.
  - If JSON-LD contains multiple business entries, use the one whose URL or address matches the main page.
- about/tagline/teachers/testimonials may draw on the whole site, but prefer content specific to the main page's location when both exist.

RULES:
- Ignore navigation menus, copyright notices, cookie banners, and legal boilerplate.
- Focus on: name, location, contact, programs, pricing, bio, staff, technology, and social presence.
- If a field is not present in the content, return null or [] — never guess or hallucinate.
- school_name: the brand name; include the location if the page itself presents it that way (e.g. "Adkins Music Lessons – Omaha").
- state: 2-letter US state abbreviation or null.
- phone: format (XXX) XXX-XXXX. Use the main page's number. Null if not found.
- email: primary contact or booking email or null.
- city/state/address: the main page's location only. Do NOT return arrays.
- hours: business/lesson hours as one short human-readable string (e.g. "Mon–Fri 2–8pm · Sat 9am–2pm"), or null.
- programs: array of instrument/lesson type names only (e.g. ["Piano","Guitar","Voice"]). No descriptions.
- teachers: array of { name, instrument, bio } objects for each teacher or staff member named on the site. instrument and bio may be null. Return [] if none found.
- pricing_notes: one sentence on lesson pricing/rates, or null.
- tagline: short marketing motto/tagline explicitly stated by the school, or null.
- about: 3-5 sentences covering identity, mission, teaching philosophy, founding story, and differentiators. Pull from About/bio sections. Be specific and rich — this trains the AI agent.
- testimonials: array of real verbatim customer quotes found anywhere on the site (reviews, testimonials sections, Google review snippets, etc.). If the customer's name appears with the quote, append it to the quote as " — Name". Include as many as you find. Return [] if none.
- director_name: owner, director, or founder's name, or null.
- platform: website builder or scheduling software they appear to use. Look for footer credits, booking widget branding, or CMS signatures. Examples: "WordPress", "Squarespace", "Wix", "Jackrabbit", "iClassPro", "Music Teacher's Helper", "Studio Helper". Null if undetectable.
- social_facebook: full Facebook page URL if found, or null.
- social_instagram: full Instagram profile URL if found, or null.
- confidence per field: "high" = clearly stated, "medium" = inferred, "low" = guessed, "not_found" = absent.

COLOR RULES:
- If a logo image is attached, derive primary_color and accent_color from the LOGO first — the logo is the brand. Use the COLOR HINTS to pin the exact hex when a hint matches what you see in the logo.
- Otherwise use the COLOR HINTS section, in this priority: svg-logo > theme-color meta > css-var > css-freq.
- primary_color / accent_color: 6-digit hex (e.g. "#c0392b"). Never return white, black, or gray. Return null when nothing is clearly a brand color.

Return ONLY this exact JSON shape — no extra fields, no markdown:
{
  "school_name": string | null,
  "city": string | null,
  "state": string | null,
  "address": string | null,
  "phone": string | null,
  "email": string | null,
  "hours": string | null,
  "director_name": string | null,
  "programs": string[],
  "teachers": [{ "name": string, "instrument": string | null, "bio": string | null }],
  "pricing_notes": string | null,
  "tagline": string | null,
  "about": string | null,
  "testimonials": string[],
  "platform": string | null,
  "social_facebook": string | null,
  "social_instagram": string | null,
  "primary_color": string | null,
  "accent_color": string | null,
  "confidence": { "school_name": string, "city": string, "state": string, "address": string, "phone": string, "email": string, "hours": string, "director_name": string, "programs": string, "teachers": string, "pricing_notes": string, "tagline": string, "about": string, "testimonials": string, "platform": string, "primary_color": string, "accent_color": string }
}`;

const UA = 'Mozilla/5.0 (compatible; ZiroWork/1.0; +https://zirowork.com)';

function stripHtml(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function tryFetch(url: string): Promise<string> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    return res.ok ? await res.text() : '';
  } catch { return ''; }
}

// Firecrawl-first (renders JS, beats bot walls); plain fetch fallback if no key or Firecrawl fails.
async function fetchPage(url: string): Promise<{ text: string; html: string }> {
  if (FIRECRAWL_API_KEY) {
    try {
      const res = await fetch('https://api.firecrawl.dev/v2/scrape', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${FIRECRAWL_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, formats: ['markdown', 'rawHtml'], onlyMainContent: false }),
      });
      if (res.ok) {
        const { data } = await res.json();
        if (data?.markdown || data?.rawHtml) {
          return { text: data.markdown || stripHtml(data.rawHtml || ''), html: data.rawHtml || '' };
        }
      }
    } catch { /* fall through to plain fetch */ }
  }
  const html = await tryFetch(url);
  return { text: stripHtml(html), html };
}

function findSubpageUrl(baseUrl: string, html: string, pattern: RegExp): string {
  const match = html.match(pattern);
  if (!match) return '';
  try { return new URL(match[1], baseUrl).href; } catch { return ''; }
}

// JSON-LD business blocks — typed name/address/phone, far more reliable than prose when present.
function extractJsonLd(html: string): string {
  const blocks: string[] = [];
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const nodes = Array.isArray(parsed) ? parsed : (parsed['@graph'] || [parsed]);
      for (const n of nodes) {
        const t = JSON.stringify(n['@type'] || '');
        if (/business|organization|school|store/i.test(t)) blocks.push(JSON.stringify(n).slice(0, 2500));
      }
    } catch { /* invalid JSON-LD — skip */ }
  }
  return blocks.join('\n');
}

// Grays, near-white, near-black — never brand colors.
function isNeutral(hex: string): boolean {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length !== 6) return true;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return Math.max(r, g, b) - Math.min(r, g, b) < 24;
}

// Inline <style> blocks AND up to 3 external stylesheets — site builders put nearly all CSS in external files.
async function collectColorHints(html: string, pageUrl: string): Promise<string> {
  const hints: string[] = [];

  const themeMeta = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']theme-color["']/i);
  if (themeMeta && !isNeutral(themeMeta[1])) hints.push(`theme-color meta: ${themeMeta[1]}`);

  const sheetUrls: string[] = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    if (!/rel=["']?stylesheet/i.test(m[0])) continue;
    const href = m[0].match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    try { sheetUrls.push(new URL(href, pageUrl).href); } catch { /* bad href */ }
    if (sheetUrls.length >= 3) break;
  }
  const sheets = await Promise.all(sheetUrls.map(u => tryFetch(u)));
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n')
    + '\n' + sheets.map(s => s.slice(0, 300000)).join('\n');

  const cssVarRe = /--(?:[a-z-]*(?:primary|accent|brand|main|theme|hero|highlight)[a-z-]*):\s*(#[0-9a-fA-F]{3,8})/gi;
  for (const m of (html + '\n' + css).matchAll(cssVarRe)) {
    if (!isNeutral(m[1])) hints.push(`css-var: ${m[1]}`);
  }

  const freq: Record<string, number> = {};
  for (const m of css.matchAll(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
    const hex = m[0].toLowerCase();
    if (!isNeutral(hex)) freq[hex] = (freq[hex] || 0) + 1;
  }
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 12);
  for (const [color, count] of top) hints.push(`css-freq: ${color} (${count}x)`);

  return hints.join('\n');
}

function findLogoUrl(html: string, pageUrl: string, jsonLd: string): string {
  const ld = jsonLd.match(/"logo"\s*:\s*\{[^}]*"url"\s*:\s*"(https?:[^"]+)"/) || jsonLd.match(/"logo"\s*:\s*"(https?:[^"]+)"/);
  if (ld) return ld[1];
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/logo/i.test(m[0])) continue;
    const src = m[0].match(/\b(?:src|data-src)=["']([^"']+)["']/i)?.[1];
    if (src && !src.startsWith('data:')) {
      try { return new URL(src, pageUrl).href; } catch { /* skip */ }
    }
  }
  return '';
}

// Google Maps on the page → a clean directions link. Share/place links win; embed iframes yield exact coordinates.
function findMapUrl(html: string): string {
  const link = html.match(/https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps|www\.google\.com\/maps\/(?:place|dir|search))[^"'\s<)\\]*/i);
  if (link) return link[0].replace(/&amp;/g, '&');
  const embed = html.match(/<iframe[^>]+src=["']([^"']*google\.com\/maps\/embed[^"']*)["']/i);
  if (embed) {
    const src = embed[1].replace(/&amp;/g, '&');
    const lng = src.match(/!2d(-?\d+\.\d+)/)?.[1];
    const lat = src.match(/!3d(-?\d+\.\d+)/)?.[1];
    if (lat && lng) return `https://www.google.com/maps?q=${lat},${lng}`;
    return src;
  }
  return '';
}

// SVG logo → exact fill colors. Raster logo → base64 for Claude vision.
async function fetchLogo(logoUrl: string): Promise<{ svgHints?: string; image?: { mediaType: string; data: string } }> {
  try {
    const res = await fetch(logoUrl, { headers: { 'User-Agent': UA } });
    if (!res.ok) return {};
    const type = res.headers.get('content-type') || '';
    if (type.includes('svg') || logoUrl.split('?')[0].toLowerCase().endsWith('.svg')) {
      const svg = await res.text();
      const colors = new Set<string>();
      for (const m of svg.matchAll(/(?:fill|stroke|stop-color)\s*[:=]\s*["']?(#[0-9a-fA-F]{3,8})/gi)) {
        const hex = m[1].toLowerCase();
        if (!isNeutral(hex)) colors.add(hex);
      }
      return colors.size ? { svgHints: [...colors].slice(0, 6).map(c => `svg-logo: ${c}`).join('\n') } : {};
    }
    const mediaType = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].find(t => type.includes(t.split('/')[1]));
    if (!mediaType) return {};
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > 1500000) return {};
    let bin = '';
    for (let i = 0; i < buf.length; i += 8192) bin += String.fromCharCode(...buf.subarray(i, i + 8192));
    return { image: { mediaType, data: btoa(bin) } };
  } catch { return {}; }
}

// The model sometimes appends commentary after the JSON — parse the first balanced object.
function parseClaudeJson(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  try { return JSON.parse(cleaned); } catch { /* fall through to brace scan */ }
  const start = cleaned.indexOf('{');
  if (start === -1) throw new Error('no JSON in model output');
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = inStr; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return JSON.parse(cleaned.slice(start, i + 1));
    }
  }
  throw new Error('unbalanced JSON in model output');
}

// Google Places (New) — the business's Google Business Profile: authoritative per-location
// hours, reviews, rating, photos, verified address/phone. Only accept a result we can match
// to this business (city in address, or website domain equals the scraped site).
// deno-lint-ignore no-explicit-any
async function placesLookup(name: unknown, city: unknown, state: unknown, siteHost: string): Promise<any | null> {
  if (!GOOGLE_PLACES_API_KEY || typeof name !== 'string' || !name) return null;
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.regularOpeningHours.weekdayDescriptions,places.rating,places.userRatingCount,places.googleMapsUri,places.reviews,places.photos',
      },
      body: JSON.stringify({ textQuery: [name, city, state].filter(Boolean).join(' '), maxResultCount: 3 }),
    });
    if (!res.ok) return null;
    const { places } = await res.json();
    if (!places?.length) return null;
    const cityStr = typeof city === 'string' ? city.toLowerCase() : '';
    // deno-lint-ignore no-explicit-any
    return places.find((p: any) => cityStr && (p.formattedAddress || '').toLowerCase().includes(cityStr))
      // deno-lint-ignore no-explicit-any
      || places.find((p: any) => {
        try { return siteHost && new URL(p.websiteUri).hostname.replace(/^www\./, '') === siteHost; } catch { return false; }
      })
      || null;
  } catch { return null; }
}

function condenseHours(weekdayDescriptions: string[]): string {
  return weekdayDescriptions
    .map(d => d.replace(/^(\w{3})\w+/, '$1').replace(/:00/g, '').replace(/[   ]/g, ' '))
    .join(' · ');
}

// deno-lint-ignore no-explicit-any
function reviewQuotes(place: any): string[] {
  return (place.reviews || [])
    // deno-lint-ignore no-explicit-any
    .filter((r: any) => (r.rating ?? 0) >= 4 && r.text?.text && r.text.text.length >= 40 && r.text.text.length <= 320)
    .slice(0, 3)
    // deno-lint-ignore no-explicit-any
    .map((r: any) => {
      const text = r.text.text.replace(/\s+/g, ' ').trim();
      const author = r.authorAttribution?.displayName;
      return author ? `${text} — ${author}` : text;
    });
}

// skipHttpRedirect returns the bare googleusercontent URL — safe to store publicly (no API key in it).
// deno-lint-ignore no-explicit-any
async function placePhotoUrls(place: any, max = 4): Promise<string[]> {
  // deno-lint-ignore no-explicit-any
  const names: string[] = (place.photos || []).slice(0, max).map((p: any) => p.name).filter(Boolean);
  const urls = await Promise.all(names.map(async (n) => {
    try {
      const r = await fetch(`https://places.googleapis.com/v1/${n}/media?maxWidthPx=1200&skipHttpRedirect=true&key=${GOOGLE_PLACES_API_KEY}`);
      if (!r.ok) return '';
      const j = await r.json();
      return j.photoUri || '';
    } catch { return ''; }
  }));
  return urls.filter(Boolean);
}

// Anti-hallucination gate: extracted phone/address must literally appear in the grounding text.
function groundIdentityFields(extracted: Record<string, unknown>, groundText: string) {
  const digits = (s: string) => s.replace(/\D/g, '');
  const pageDigits = digits(groundText);
  if (typeof extracted.phone === 'string' && extracted.phone) {
    const phone = digits(extracted.phone).slice(-10);
    if (phone.length === 10 && !pageDigits.includes(phone)) extracted.phone = null;
  }
  if (typeof extracted.address === 'string' && extracted.address) {
    const streetNum = extracted.address.match(/\d{2,6}/)?.[0];
    if (streetNum && !groundText.includes(streetNum)) extracted.address = null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  let url: string;
  try {
    const body = await req.json();
    url = String(body.url || '').trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;  // accept bare domains ("www.site.com/omaha")
    if (!new URL(url).hostname.includes('.')) throw new Error('invalid url');
  } catch {
    return new Response(JSON.stringify({ error: 'invalid request — send { url: string }' }), { status: 400, headers: CORS });
  }

  try {
    // scrape the EXACT pasted URL — never redirect to the homepage
    const mainPage = await fetchPage(url);
    if (!mainPage.text && !mainPage.html) throw new Error('could not fetch site');

    let isLocationPage = false;
    try { isLocationPage = new URL(url).pathname.replace(/\/+$/, '').length > 1; } catch { /* keep false */ }

    const jsonLd = extractJsonLd(mainPage.html);
    const logoUrl = findLogoUrl(mainPage.html, url, jsonLd);
    const aboutUrl    = findSubpageUrl(url, mainPage.html, /href=["']([^"']*?\/about[^"']*?)["']/i);
    const teachersUrl = findSubpageUrl(url, mainPage.html, /href=["']([^"']*?\/(teacher|staff|instructor|team)[^"']*?)["']/i);

    const [aboutPage, teachersPage, cssHints, logo] = await Promise.all([
      aboutUrl    ? fetchPage(aboutUrl)    : Promise.resolve({ text: '', html: '' }),
      teachersUrl ? fetchPage(teachersUrl) : Promise.resolve({ text: '', html: '' }),
      collectColorHints(mainPage.html, url),
      logoUrl ? fetchLogo(logoUrl) : Promise.resolve({}),
    ]);

    const colorHints = [logo.svgHints, cssHints].filter(Boolean).join('\n') || 'No color hints found.';

    const main     = mainPage.text.slice(0, 8000);
    const ld       = jsonLd            ? '\n\n--- STRUCTURED DATA (JSON-LD from the main page) ---\n\n' + jsonLd.slice(0, 4000) : '';
    const about    = aboutPage.text    ? '\n\n--- About Page ---\n\n'          + aboutPage.text.slice(0, 4000)    : '';
    const teachers = teachersPage.text ? '\n\n--- Teachers/Staff Page ---\n\n' + teachersPage.text.slice(0, 4000) : '';
    const locationNote = isLocationPage
      ? `\nNOTE: the pasted URL has the path "${new URL(url).pathname}" — this is likely ONE LOCATION of a multi-location business. Apply the LOCATION RULE strictly.`
      : '';

    const userText = `Extract all school info. The owner pasted this exact URL: ${url}${locationNote}\n\n--- MAIN PAGE (the pasted URL) ---\n\n${main}${ld}${about}${teachers}\n\n--- COLOR HINTS (from CSS) ---\n\n${colorHints}`;

    const content: unknown[] = [];
    if (logo.image) content.push({ type: 'image', source: { type: 'base64', media_type: logo.image.mediaType, data: logo.image.data } });
    content.push({ type: 'text', text: userText });

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content }],
      }),
    });
    if (!claudeRes.ok) throw new Error(`Claude error ${claudeRes.status}`);
    const claudeData = await claudeRes.json();
    const rawText: string = claudeData.content[0].text;
    const extracted = parseClaudeJson(rawText);

    // a location page's identity fields must come from that page; root pages may also use the About page
    groundIdentityFields(extracted, isLocationPage ? mainPage.text : mainPage.text + '\n' + aboutPage.text);

    extracted.logo_url = logoUrl || null;

    // Layer 3: Google Business Profile — fills what the website can't, never overwrites site data
    let siteHost = '';
    try { siteHost = new URL(url).hostname.replace(/^www\./, ''); } catch { /* keep '' */ }
    const place = await placesLookup(extracted.school_name, extracted.city, extracted.state, siteHost);
    if (place) {
      if (!extracted.phone && place.nationalPhoneNumber) extracted.phone = place.nationalPhoneNumber;
      if (!extracted.address && place.formattedAddress) extracted.address = place.formattedAddress;
      if (!extracted.hours && place.regularOpeningHours?.weekdayDescriptions?.length) {
        extracted.hours = condenseHours(place.regularOpeningHours.weekdayDescriptions);
      }
      extracted.google_rating = place.rating ?? null;
      extracted.google_review_count = place.userRatingCount ?? null;
      const quotes = reviewQuotes(place);
      if (quotes.length) {
        // attributed Google reviews first — they carry names and land in the form's visible boxes
        extracted.testimonials = [...new Set([...quotes, ...(Array.isArray(extracted.testimonials) ? extracted.testimonials : [])])];
      }
      extracted.google_photos = await placePhotoUrls(place);
    } else {
      extracted.google_rating = null;
      extracted.google_review_count = null;
      extracted.google_photos = [];
    }
    extracted.map_url = (place?.googleMapsUri) || findMapUrl(mainPage.html) || null;

    return new Response(JSON.stringify(extracted), { status: 200, headers: CORS });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS });
  }
});
