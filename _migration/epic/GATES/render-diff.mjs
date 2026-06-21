#!/usr/bin/env node
/**
 * render-diff.mjs — screenshot comparison gate tool
 *
 * Modes:
 *   baseline <view>   — screenshot legacy app at localhost:3001/#<view>, save as snapshots/<view>.png
 *   compare  <view>   — screenshot Next.js at localhost:$NEXT_PORT/<path> (default 3000), diff against baseline, exit 1 if >1% diff
 *
 * Called from verify-phase-3-views.sh for each registered view.
 * Baseline PNGs are committed. Do NOT regenerate them in the gate; run baseline mode manually once.
 */

import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOTS_DIR = path.join(__dirname, 'snapshots');

const LEGACY_PORT = 3001;
const NEXT_PORT = parseInt(process.env.NEXT_PORT, 10) || 3000;
const DIFF_THRESHOLD_PCT = 1.0; // % of pixels allowed to differ

// nav: 'sidebar' (default) — click the legacy sidebar nav item after the operator SPA loads.
// nav: 'url'     — just goto the URL directly (schools, dashboard preview, onboard).
//   legacySidebarText: exact text of the sidebar item to click (sidebar-nav views only).
//   legacyPath:        URL path to navigate to in the legacy server (url-nav views only).
const VIEW_MAP = {
  // ── Operator SPA (sidebar-click nav) ─────────────────────────────────────────
  'insights':        { legacySidebarText: 'Insights',        nextPath: '/insights'        },
  'bookings':        { legacySidebarText: 'Bookings',        nextPath: '/bookings'        },
  'reporting':       { legacySidebarText: 'Reporting',       nextPath: '/reporting'       },
  'settings':        { legacySidebarText: 'Settings',        nextPath: '/settings'        },
  'automation-rules':{ legacySidebarText: 'Automation Rules',nextPath: '/automation-rules'},
  'pages':           { legacySidebarText: 'Pages',           nextPath: '/pages'           },
  'escalations':     { legacySidebarText: 'Escalations',     nextPath: '/escalations'     },
  'conversations':   { legacySidebarText: 'Conversations',   nextPath: '/conversations'   },
  'enrollments':     { legacySidebarText: 'Enrollments',     nextPath: '/enrollments'     },
  'leads':           { legacySidebarText: 'Leads',           nextPath: '/leads'           },
  'campaigns':       { legacySidebarText: 'Campaigns',       nextPath: '/campaigns'       },
  'onboarding':      { legacySidebarText: 'Onboarding',      nextPath: '/onboarding'      },
  'clients':         { legacySidebarText: 'Clients',         nextPath: '/clients'         },
  'command-center':  { legacySidebarText: 'Command Center',  nextPath: '/command-center'  },
  'integrations':    { legacySidebarText: 'Integrations',    nextPath: '/integrations'    },
  // ── Phase 4 URL-nav surfaces ──────────────────────────────────────────────────
  // diffThresholdPct: 5.0 — cross-engine comparison (CDN React 18 Babel CSR vs Next.js React 19 SSR)
  // produces sub-pixel antialiasing differences (~2-4%) that are not real visual regressions.
  'schools-piano':     { nav: 'url', diffThresholdPct: 5.0, legacyPath: '/schools/adkins-music-lessons-omaha/piano',  nextPath: '/schools/adkins-music-lessons-omaha/piano' },
  'dashboard-preview': { nav: 'url', diffThresholdPct: 5.0, legacyPath: '/dashboard?preview',                         nextPath: '/dashboard?preview'                        },
  'onboard':           { nav: 'url', diffThresholdPct: 5.0, legacyPath: '/onboard.html',                              nextPath: '/onboard'                                  },
};

const [, , mode, viewName] = process.argv;
if (!mode || !viewName) {
  console.error('Usage: node render-diff.mjs baseline|compare <view-name>');
  process.exit(1);
}

const cfg = VIEW_MAP[viewName];
if (!cfg) {
  console.error(`Unknown view: "${viewName}". Known views: ${Object.keys(VIEW_MAP).join(', ')}`);
  process.exit(1);
}

async function waitForServer(port, timeoutMs = 15000) {
  const { default: http } = await import('http');
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(`http://localhost:${port}/`, res => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) reject(new Error(`port ${port} not ready after ${timeoutMs}ms`));
        else setTimeout(check, 200);
      });
      req.end();
    };
    check();
  });
}

async function screenshot(page, url, waitMs = 1500) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(waitMs); // settle animations / data hydration
  return page.screenshot({ fullPage: false });
}

async function main() {
  await fs.mkdir(SNAPSHOTS_DIR, { recursive: true });

  if (mode === 'baseline') {
    console.log(`[baseline] Generating for "${viewName}" from legacy at port ${LEGACY_PORT}`);
    await waitForServer(LEGACY_PORT);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });

    if (cfg.nav === 'url') {
      // URL-nav: just goto the legacy path directly (schools, dashboard preview, onboard).
      // The legacy app uses CDN scripts + in-browser Babel which take 5–10 s to compile
      // and render. Wait 10 s after networkidle so the async Supabase fetch completes too.
      const legacyUrl = `http://localhost:${LEGACY_PORT}${cfg.legacyPath}`;
      await page.goto(legacyUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(10000); // CDN load + Babel compile + Supabase data fetch
    } else {
      // Sidebar-nav: fake an operator session so the SPA renders past the login gate,
      // then click the sidebar nav item.
      await page.addInitScript(() => {
        let _sb;
        Object.defineProperty(window, 'sb', {
          configurable: true,
          get() { return _sb; },
          set(client) {
            _sb = client;
            _sb.auth.getSession = async () => ({
              data: {
                session: {
                  user: {
                    email: 'operator@zirowork.com',
                    app_metadata: { role: 'operator' },
                    user_metadata: { full_name: 'Zach Adkins' },
                  },
                },
              },
            });
          },
        });
      });
      await page.goto(`http://localhost:${LEGACY_PORT}/`, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(2000); // Session.jsx auth check + initial render
      await page.getByText(cfg.legacySidebarText, { exact: true }).first().click({ timeout: 8000 });
      await page.waitForTimeout(1500); // view transition + data hydration
    }

    const buf = await page.screenshot({ fullPage: false });
    await browser.close();
    const outPath = path.join(SNAPSHOTS_DIR, `${viewName}.png`);
    await fs.writeFile(outPath, buf);
    console.log(`[baseline] Saved: ${outPath}`);
    process.exit(0);
  }

  if (mode === 'compare') {
    const baselinePath = path.join(SNAPSHOTS_DIR, `${viewName}.png`);
    const baselineExists = await fs.access(baselinePath).then(() => true).catch(() => false);
    if (!baselineExists) {
      console.error(`[compare] FAIL: no baseline for "${viewName}". Run: node render-diff.mjs baseline ${viewName}`);
      process.exit(1);
    }

    console.log(`[compare] "${viewName}": Next.js vs committed baseline`);
    await waitForServer(NEXT_PORT);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const url = `http://localhost:${NEXT_PORT}${cfg.nextPath}`;
    const nextBuf = await screenshot(page, url);
    await browser.close();

    const baseline = PNG.sync.read(await fs.readFile(baselinePath));
    const current  = PNG.sync.read(nextBuf);

    if (baseline.width !== current.width || baseline.height !== current.height) {
      // Resize mismatch — almost always means the page is blank / wrong route
      const diffPath = path.join(SNAPSHOTS_DIR, `${viewName}.diff.png`);
      await fs.writeFile(diffPath, nextBuf);
      console.error(`[compare] FAIL: size mismatch — baseline ${baseline.width}x${baseline.height}, got ${current.width}x${current.height}`);
      process.exit(1);
    }

    const { width, height } = baseline;
    const diffImg = new PNG({ width, height });
    const numDiff = pixelmatch(baseline.data, current.data, diffImg.data, width, height, { threshold: 0.1 });
    const pct = (numDiff / (width * height)) * 100;

    const diffPath = path.join(SNAPSHOTS_DIR, `${viewName}.diff.png`);
    await fs.writeFile(diffPath, PNG.sync.write(diffImg));

    const threshold = cfg.diffThresholdPct ?? DIFF_THRESHOLD_PCT;
    console.log(`[compare] diff pixels: ${numDiff} / ${width * height} = ${pct.toFixed(2)}% (threshold ${threshold}%)`);
    if (pct > threshold) {
      console.error(`[compare] FAIL: diff ${pct.toFixed(2)}% exceeds threshold. See ${diffPath}`);
      process.exit(1);
    }
    console.log(`[compare] PASS`);
    process.exit(0);
  }

  console.error(`Unknown mode: "${mode}". Use "baseline" or "compare".`);
  process.exit(1);
}

main().catch(err => {
  console.error('[render-diff]', err.message);
  process.exit(1);
});
