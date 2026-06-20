#!/usr/bin/env node
// flip-state.mjs — STATE AUTHORITY for feature_list.json.
// The gate writes `state`; the agent never does (L08). Enforces WIP=1 per lane (L07).
// Pure node — no jq, no external deps. Run from repo root:  node flip-state.mjs
//
// A view flips to `passing` only when global gates (tsc + eslint) are green AND its
// `verify` command exits 0. A view that was `passing` but now fails is demoted to
// `not_started` (regression caught).
// Requires a Next dev server on :3000 and legacy on :3001 for views with baselines.
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const FL = "feature_list.json";
const fl = JSON.parse(readFileSync(FL, "utf8"));
const views = fl.views;
const run = (cmd) => { try { execSync(cmd, { stdio: "ignore" }); return 0; } catch { return 1; } };

// ── L07: WIP=1 per lane — fail if any lane has more than one active view ──
const byLane = {};
for (const v of views) if (v.state === "active" && v.lane != null) (byLane[v.lane] = byLane[v.lane] || []).push(v.id);
const dupes = Object.entries(byLane).filter(([, ids]) => ids.length > 1);
if (dupes.length) {
  console.error(`FAIL (WIP=1): lane(s) with >1 active — ${dupes.map(([l, ids]) => `${l}:[${ids.join(",")}]`).join(", ")}. Finish one before starting another.`);
  process.exit(1);
}

// ── Global gates: if the repo doesn't type-check / lint, NOTHING is passing ──
console.log("=== global gates ===");
if (run("npx tsc --noEmit")) { console.error("GLOBAL FAIL: tsc — states unchanged."); process.exit(1); }
if (run("npx eslint ."))     { console.error("GLOBAL FAIL: eslint — states unchanged."); process.exit(1); }

// ── Per-view: run verify, write state (only this script does) ──
console.log("=== per-view verify ===");
for (const v of views) {
  const ok = run(v.verify) === 0;
  const next = ok ? "passing" : (v.state === "passing" ? "not_started" : v.state); // demote regressions
  console.log(`${v.id.padEnd(18)} → ${next}`);
  v.state = next;
}
writeFileSync(FL, JSON.stringify(fl, null, 2) + "\n");
console.log("=== done — state written by the gate, not the agent ===");
for (const v of [...views].sort((a, b) => a.state.localeCompare(b.state))) console.log(`  ${v.state}\t${v.id}`);
