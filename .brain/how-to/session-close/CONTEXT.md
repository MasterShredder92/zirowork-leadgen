> **SUPERSEDED (Phase 1+).** Session-close + commit flow now live in `/CLAUDE.md` and `_migration/progress.md`. Ignore the steps below; they describe the pre-migration app.

# Stage 00 — End of Session

Run at the end of every working session. Non-negotiable.

---

## Input

| Resource | Load When | What You Gain |
|---|---|---|
| `.brain/current-state.md` | Every run | Current state to continue from — what's in progress, what's broken |
| Root `CLAUDE.md` Repo Tree | If folder structure changed | Verify File Map reflects all new/deleted folders |

**Pre-condition:** You know what files changed, what's unfinished, and anything unexpected or broken this session.

---

## Process

1. Note every file that was modified, created, or deleted this session.
2. Note anything that was started but not finished — partial edits, uncommitted changes, features mid-build.
3. Note anything that is broken or behaving unexpectedly.
4. Decide what the next session should do first — one concrete action, not a vague goal.
5. Check if any new folders were added or removed. If yes, update root `CLAUDE.md` Repo Tree.
6. **For every numbered folder you entered this session:** open its `CONTEXT.md` and verify the cross-load table matches what you actually used. If you loaded a folder not listed — add it. If you never needed a listed cross-load — leave it (it may be needed by other tasks). If a listed file no longer exists — remove it.
7. Append a new entry to `.brain/session-log.md` at the TOP of the file, following the format below.

**Entry format:**
```markdown
## Session — YYYY-MM-DD

### What Changed
- [file]: [what changed in one line]

### In Progress
- [anything unfinished]

### Broken / Weird
- [anything not working, or "Nothing"]

### Next
- [first thing next session should do]

### Repo Tree
- Updated: [yes/no] — [if yes, what new folder was added or removed]
```

Write repo state, not narrative. "family-roster.jsx now uses window.getStudentStatusColors" not "I updated the status colors".

---

## Output

**Dual-write pattern** (critical):
1. Prepend new entry to `.brain/session-log.md` (archive grows, full history preserved)
2. **Overwrite** `.brain/current-state.md` with ONLY the new entry (this is what gets loaded on next session startup)
   - Keep the header comment intact: "Loaded on startup. Contains only the current session entry..."
   - Replace the session entry section (everything after `---`)
3. If repo structure changed: update root `CLAUDE.md` Repo Tree section to match.
4. **CRITICAL: Commit and push `.brain/session-log.md`, `.brain/current-state.md`, and root `CLAUDE.md` (if tree changed) to GitHub** (via `git add`, `git commit`, `git push origin main`)
   - Without this step, the next session reads stale data from the last committed version
   - This is non-negotiable — if you skip it, the system breaks

---

## Completion

Done when:
1. Session log has been updated with an accurate entry describing current repo state
2. `.brain/current-state.md` has been overwritten with only the current session entry
3. Every numbered folder entered this session has had its `CONTEXT.md` cross-load table verified and updated if needed
4. All changed files (session-log.md, current-state.md, any updated folder CONTEXT.md files, and CLAUDE.md if tree changed) have been committed and pushed to GitHub

Next: close the session. The next agent reads `.brain/current-state.md` on startup to orient.
