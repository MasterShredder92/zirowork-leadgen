#!/usr/bin/env node
/**
 * render-diff.mjs — screenshot comparison gate tool
 *
 * Modes:
 *   baseline <view>   — screenshot legacy app at localhost:3001/#<view>, save as snapshots/<view>.png
 *   compare  <view>   — screenshot Next.js at localhost:3000/<path>, diff against baseline, exit 1 if >1% diff
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
const NEXT_PORT   = 3000;
const DIFF_THRESHOLD_PCT = 1.0; // % of pixels allowed to differ

// legacySidebarText: exact visible text of the sidebar nav item to click after the app loads.
// The legacy app uses React state routing (navHistory), not real URL hash routing — the hash
// in the goto URL is ignored; navigation must happen via sidebar click.
const VIEW_MAP = {
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
  'studio-map':      { legacySidebarText: 'Studio Map',      nextPath: '/studio-map'      },
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

    // Intercept window.sb assignment (index.html:125) and fake an operator session so
    // Session.jsx's role check (app_metadata.role === 'operator') passes and the real
    // render path runs instead of OperatorLogin.  LEGACY CAPTURE ONLY — never applied
    // to the compare path (Next.js has its own auth layer).
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

    // Load the app root (hash is irrelevant — legacy uses React state routing).
    // Wait for the sidebar to appear, then click the correct nav item.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://localhost:${LEGACY_PORT}/`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000); // Session.jsx auth check + initial render

    // Click the sidebar nav item by its visible text label.
    // Use .first() because the button element and its inner span both match the text.
    await page.getByText(cfg.legacySidebarText, { exact: true }).first().click({ timeout: 8000 });
    await page.waitForTimeout(1500); // view transition + data hydration

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

    console.log(`[compare] diff pixels: ${numDiff} / ${width * height} = ${pct.toFixed(2)}% (threshold ${DIFF_THRESHOLD_PCT}%)`);
    if (pct > DIFF_THRESHOLD_PCT) {
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
