> **SUPERSEDED (Phase 1+).** Repo structure and the CLAUDE.md it references have changed. Steps below describe cleaning up the pre-migration repo layout. Current repo hygiene lives in `/CLAUDE.md` and `_migration/progress.md`.

# repo-cleanup — Deep Repository Maintenance

**When to use:** Health check flags warnings, end of sprint, or quarterly.

---

## Load

- `.brain/cleanup/repo-health.json` — thresholds + tracked files config
- `.brain/cleanup/cleanup-report.txt` — latest health check output (what's broken)
- `CLAUDE.md` — repo tree (verify paths are current)
- `CONTEXT.md` — validate all references still point to real files

## Do NOT Load

- Any `.jsx` files — code is out of scope
- `.brain/session-log.md` — already handled by automation
- Any file outside `.brain/`, `knowledge/`, or root `*.md`

---

## Process

### 1. Read the health report
Open `.brain/cleanup/cleanup-report.txt`. It flags:
- Broken `CONTEXT.md` references → fix the links
- Files over size limit → trim or split
- Session log > 50 lines → auto-archived by script, verify it ran
- `.brain/*.md` files older than 30 days → candidates for `.brain/archive/`

### 2. Fix broken references
Any link in `CONTEXT.md` pointing to a missing file:
- Check if the file was renamed or deleted
- Update the link or remove it
- Re-run the script to confirm fixed

### 3. Trim bloated docs
Files over limit (see `repo-health.json` → `maxFileSizeKB`):
- Split if covering unrelated topics
- Extract detail to a sub-file, keep the parent as a router
- Update `knowledge/CLAUDE.md` load table if paths change

### 4. Archive orphaned `.brain/` files
Files in `.brain/*.md` not in the essential list AND older than 30 days:
```bash
mv .brain/OLD_FILE.md .brain/archive/OLD_FILE-YYYYMMDD.md
```

Essential — never archive:
- `.brain/CLAUDE.md`
- `.brain/current-state.md`
- `.brain/whats-left.md`
- `.brain/session-log.md`

### 5. Validate how-to guides
Each guide in `.brain/how-to/*/CONTEXT.md` must:
- Exist and be readable
- Reference only real files at correct current paths
- Be under 100 lines

### 6. Update repo-health.json
When done:
- Set `lastCleanup` to today's date
- Update `trackedFiles` if any files were added, removed, or renamed

### 7. Re-run the script
```bash
bash .brain/cleanup/cleanup.sh
```
Verify output shows 0 warnings. If warnings remain, fix and re-run.

---

## Success Criteria

- [ ] 0 broken CONTEXT.md references
- [ ] All files within size limits in repo-health.json
- [ ] Orphaned files archived
- [ ] how-to guides all valid and under 100 lines
- [ ] cleanup.sh exits with 0 warnings
- [ ] repo-health.json `lastCleanup` updated
- [ ] Changes committed

---

## Handoff

Commit with: `"chore: repo maintenance — trim bloat, fix references, archive orphans"`
Note in `.brain/current-state.md` that cleanup ran today.
