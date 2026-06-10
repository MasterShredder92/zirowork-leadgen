const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Content-Type': 'application/json',
};

const SYSTEM_PROMPT = `You are a data extraction assistant. Extract every piece of useful information about a music school from scraped website text. Content may include a homepage, About page, and Teachers/Staff page.

RULES:
- Ignore navigation menus, copyright notices, cookie banners, and legal boilerplate.
- Focus on: name, location, contact, programs, pricing, bio, staff, technology, and social presence.
- If a field is not present in the content, return null or [] — never guess or hallucinate.
- state: 2-letter US state abbreviation or null.
- phone: format (XXX) XXX-XXXX. Use primary/main number. Null if not found.
- email: primary contact or booking email or null.
- city/state/address: primary location only. Do NOT return arrays.
- programs: array of instrument/lesson type names only (e.g. ["Piano","Guitar","Voice"]). No descriptions.
- teachers: array of { name, instrument, bio } objects for each teacher or staff member named on the site. instrument and bio may be null. Return [] if none found.
- pricing_notes: one sentence on lesson pricing/rates, or null.
- tagline: short marketing motto/tagline explicitly stated by the school, or null.
- about: 3-5 sentences covering identity, mission, teaching philosophy, founding story, and differentiators. Pull from About/bio sections. Be specific and rich — this trains the AI agent.
- testimonials: array of real verbatim customer quotes found anywhere on the site (reviews, testimonials sections, Google review snippets, etc.). Include as many as you find. Return [] if none.
- director_name: owner, director, or founder's name, or null.
- platform: website builder or scheduling software they appear to use. Look for footer credits, booking widget branding, or CMS signatures. Examples: "WordPress", "Squarespace", "Wix", "Jackrabbit", "iClassPro", "Music Teacher's Helper", "Studio Helper". Null if undetectable.
- social_facebook: full Facebook page URL if found, or null.
- social_instagram: full Instagram profile URL if found, or null.
- primary_color: the school's main brand color as a 6-digit hex (e.g. "#c0392b"). You will receive a COLOR HINTS section with CSS data — use it to identify the dominant non-white, non-black, non-gray brand color. Return null if none is clearly a brand color.
- accent_color: a secondary brand color as a 6-digit hex, distinct from primary_color. Return null if not identifiable.
- confidence per field: "high" = clearly stated, "medium" = inferred, "low" = guessed, "not_found" = absent.

Return ONLY this exact JSON shape — no extra fields, no markdown:
{
  "school_name": string | null,
  "city": string | null,
  "state": string | null,
  "address": string | null,
  "phone": string | null,
  "email": string | null,
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
  "confidence": { "school_name": string, "city": string, "state": string, "address": string, "phone": string, "email": string, "director_name": string, "programs": string, "teachers": string, "pricing_notes": string, "tagline": string, "about": string, "testimonials": string, "platform": string, "primary_color": string, "accent_color": string }
}`;

function extractColorHints(html: string): string {
  const hints: string[] = [];

  // 1. theme-color meta tag — most reliable signal
  const themeMeta = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']theme-color["']/i);
  if (themeMeta) hints.push(`theme-color meta: ${themeMeta[1]}`);

  // 2. CSS custom properties with brand-sounding names
  const cssVarRe = /--(?:[a-z-]*(?:primary|accent|brand|main|theme|hero|highlight)[a-z-]*):\s*(#[0-9a-fA-F]{3,8})/gi;
  for (const m of html.matchAll(cssVarRe)) hints.push(`css-var: ${m[1]}`);

  // 3. Frequent non-neutral hex colors across all <style> blocks
  const styleBlocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n');
  const freq: Record<string, number> = {};
  const neutrals = new Set(['#ffffff','#fff','#000000','#000','#f8f8f8','#fafafa','#eeeeee','#eee','#dddddd','#ddd','#cccccc','#ccc','#333333','#333','#222222','#222','#111111','#111','#444','#444444','#555','#555555','#666','#666666','#777','#777777','#888','#888888','#999','#999999','#aaa','#aaaaaa','#bbb','#bbbbbb']);
  for (const m of styleBlocks.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
    const hex = m[0].toLowerCase();
    if (!neutrals.has(hex)) freq[hex] = (freq[hex] || 0) + 1;
  }
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 12);
  for (const [color, count] of top) hints.push(`css-freq: ${color} (${count}x)`);

  return hints.length ? hints.join('\n') : 'No color hints found.';
}

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
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZiroWork/1.0; +https://zirowork.com)' },
    });
    return res.ok ? await res.text() : '';
  } catch { return ''; }
}

function findSubpageUrl(baseUrl: string, html: string, pattern: RegExp): string {
  const match = html.match(pattern);
  if (!match) return '';
  let href = match[1];
  if (href.startsWith('http')) return href;
  if (href.startsWith('/')) {
    try { return new URL(baseUrl).origin + href; } catch { return ''; }
  }
  return '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  let url: string;
  try {
    const body = await req.json();
    url = body.url;
    if (!url || !url.startsWith('http')) throw new Error('invalid url');
  } catch {
    return new Response(JSON.stringify({ error: 'invalid request — send { url: string }' }), { status: 400, headers: CORS });
  }

  try {
    const homeHtml = await tryFetch(url);
    if (!homeHtml) throw new Error('could not fetch site');

    // fetch about + teachers pages in parallel
    const aboutUrl    = findSubpageUrl(url, homeHtml, /href=["']([^"']*?\/about[^"']*?)["']/i);
    const teachersUrl = findSubpageUrl(url, homeHtml, /href=["']([^"']*?\/(teacher|staff|instructor|team)[^"']*?)["']/i);

    const [aboutHtml, teachersHtml] = await Promise.all([
      aboutUrl    ? tryFetch(aboutUrl)    : Promise.resolve(''),
      teachersUrl ? tryFetch(teachersUrl) : Promise.resolve(''),
    ]);

    // extract color hints from raw HTML before stripping
    const colorHints = extractColorHints(homeHtml);

    const main     = stripHtml(homeHtml).slice(0, 8000);
    const about    = aboutHtml    ? '\n\n--- About Page ---\n\n'    + stripHtml(aboutHtml).slice(0, 4000)    : '';
    const teachers = teachersHtml ? '\n\n--- Teachers/Staff Page ---\n\n' + stripHtml(teachersHtml).slice(0, 4000) : '';
    const combined = main + about + teachers + '\n\n--- COLOR HINTS (from CSS) ---\n\n' + colorHints;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Extract all school info from ${url}:\n\n${combined}` }],
      }),
    });
    if (!claudeRes.ok) throw new Error(`Claude error ${claudeRes.status}`);
    const claudeData = await claudeRes.json();
    const rawText: string = claudeData.content[0].text;
    const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const extracted = JSON.parse(jsonText);

    return new Response(JSON.stringify(extracted), { status: 200, headers: CORS });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS });
  }
});
