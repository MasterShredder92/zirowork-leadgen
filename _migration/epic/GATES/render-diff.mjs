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

const VIEW_MAP = {
  'insights':        { legacyHash: 'insights',        nextPath: '/insights'        },
  'bookings':        { legacyHash: 'bookings',         nextPath: '/bookings'        },
  'reporting':       { legacyHash: 'reporting',        nextPath: '/reporting'       },
  'settings':        { legacyHash: 'settings',         nextPath: '/settings'        },
  'automation-rules':{ legacyHash: 'automation-rules', nextPath: '/automation-rules'},
  'pages':           { legacyHash: 'pages',            nextPath: '/pages'           },
  'escalations':     { legacyHash: 'escalations',      nextPath: '/escalations'     },
  'conversations':   { legacyHash: 'conversations',    nextPath: '/conversations'   },
  'enrollments':     { legacyHash: 'enrollments',      nextPath: '/enrollments'     },
  'leads':           { legacyHash: 'leads',            nextPath: '/leads'           },
  'campaigns':       { legacyHash: 'campaigns',        nextPath: '/campaigns'       },
  'onboarding':      { legacyHash: 'onboarding',       nextPath: '/onboarding'      },
  'clients':         { legacyHash: 'clients',          nextPath: '/clients'         },
  'command-center':  { legacyHash: 'command-center',   nextPath: '/command-center'  },
  'studio-map':      { legacyHash: 'studio-map',       nextPath: '/studio-map'      },
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
    const url = `http://localhost:${LEGACY_PORT}/#${cfg.legacyHash}`;
    const buf = await screenshot(page, url);
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
