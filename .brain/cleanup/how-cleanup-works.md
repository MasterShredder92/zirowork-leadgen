# How Cleanup Works

Three-tier system. Tiers 1 and 2 are automatic. Tier 3 is manual.

---

## Tier 1 — Auto health check (runs every session start)

Hook in `.claude/settings.json` → `SessionStart` → runs `.brain/cleanup/cleanup.sh`

Checks:
1. Archives old session-log.md entries (keeps only recent)
2. Validates CONTEXT.md references (reports broken links)
3. Detects bloated files (warns if > 30KB)
4. Flags orphaned artifacts (> 30 days old)

Output → `.brain/cleanup/cleanup-report.txt`

---

## Tier 2 — Metadata tracking (repo-health.json)

Config file at `.brain/cleanup/repo-health.json`. Controls thresholds for Tier 1.

Update it when:
- Folder structure changes significantly
- You want to adjust size limits or archive thresholds
- Quarterly maintenance

---

## Tier 3 — Manual deep cleanup

Run when health check shows warnings, or quarterly.

How to invoke:
```
"Run a deep repo cleanup"
Agent reads: .brain/how-to/repo-cleanup/CONTEXT.md
```

---

## The Loop

```
Session starts
    ↓
cleanup.sh runs (Tier 1)
    ↓
0 warnings → continue normally
warnings   → flagged for user
    ↓
User: "deep cleanup"
    ↓
how-to/repo-cleanup/CONTEXT.md runs (Tier 3)
    ↓
Re-run cleanup.sh → verify 0 warnings
```

---

## Files

| File | Purpose | Who touches it |
|---|---|---|
| `.brain/cleanup/cleanup.sh` | Auto health check script | Auto only |
| `.brain/cleanup/cleanup-report.txt` | Latest report output | Auto only |
| `.brain/cleanup/repo-health.json` | Size + age thresholds config | User (quarterly) |
| `.brain/how-to/repo-cleanup/CONTEXT.md` | Manual deep cleanup guide | Agent when triggered |
| `.brain/archive/` | Archived old files | Auto + manual cleanup |
