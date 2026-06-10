# WORKFLOW SPEC: repo-readiness (v1.0)

## Purpose

Master orchestrator for the Router Pattern Suite. Runs once against any repository. Determines what is broken, fires the right skills in the right order, enforces all two-phase locks and re-audit gates, and exits with a verified final state or a human escalation report.

**Entry point for the entire suite.** No skill should ever be invoked directly outside this workflow except in manual testing.

---

## 1. Inputs

```json
{
  "name": "repo_readiness",
  "description": "Orchestrates the full Router Pattern Suite against a target repository.",
  "input_schema": {
    "type": "object",
    "properties": {
      "current_date": {
        "type": "string",
        "description": "ISO 8601 timestamp. Injected once by the calling harness at workflow start. Passed immutably to every skill invocation — never re-generated mid-run."
      },
      "directory_path": {
        "type": "string",
        "description": "Target repository root. Defaults to current working directory if omitted."
      },
      "max_thinner_passes": {
        "type": "integer",
        "description": "Hard cap on god_file_thinner execution cycles per god file. Defaults to 3."
      }
    },
    "required": ["current_date"]
  }
}
```

---

## 2. Orchestration State

| Variable | Type | Purpose |
|---|---|---|
| `active_audit` | object | Most recent audit result. Refreshed after any re-audit. |
| `skill_queue` | string[] | Derived from `active_audit.workflow_routing.next_recommended_skills`. Rebuilt after every re-audit. |
| `escalation_flags` | string[] | Accumulates unresolvable issues. Never cleared mid-run. |
| `thinner_pass_count` | integer | Per-file counter. Resets per god file. Enforces `max_thinner_passes` cap. |
| `workflow_status` | enum | `running` → `pass` → `partial` → `escalated` |
| `phase_log` | object[] | Append-only record of every skill invoked, its status, and timestamp. |

---

## 3. Execution Phases

### PHASE 0 — Bootstrap
1. Validate `current_date` is present. If absent → abort with `workflow_status: "escalated"`.
2. Resolve `directory_path`. Default to `.`.
3. Set `max_thinner_passes` to `3` if not provided.
4. Initialize all state variables.
5. Create `.brain/` directory if absent — the audit is read-only, this is the workflow's responsibility.

### PHASE 1 — Initial Audit
1. Invoke `router_pattern_audit` with `current_date` and `directory_path`.
2. Store as `active_audit`. Persist to `.brain/audit-report.json`.
3. Set `skill_queue = active_audit.workflow_routing.next_recommended_skills`.

**Early exit:** If `router_score == "pass"` → set `workflow_status: "pass"` → skip to Phase 6.

### PHASE 2 — Architect (Conditional)
```
IF "router_pattern_architect" NOT IN skill_queue → SKIP
```
1. Invoke `router_pattern_architect(current_date, directory_path, active_audit)`.
2. If `architect_status == "failed"` → add `"router_build_failed"` to `escalation_flags` → set `workflow_status: "escalated"` → skip to Phase 6.
3. If `architect_status == "partial"` → add `"router_partial_build"` to `escalation_flags` → proceed.
4. If `requires_re_audit == true` → RE-AUDIT → rebuild `skill_queue`.

### PHASE 3 — God File Thinner (Conditional)
```
IF "god_file_thinner" NOT IN skill_queue → SKIP
```
For each god file in `active_audit.flags.god_files_found`:

**Phase 3A — Dry Run:**
1. Invoke `god_file_thinner(dry_run: true, current_date, directory_path, active_audit)`.
2. If `thinner_status == "failed"` → add `"[filename]: unresolvable_god_file"` to `escalation_flags` → continue to next file.

**Phase 3B — Live:**
1. Invoke `god_file_thinner(dry_run: false, current_date, directory_path, active_audit, extraction_plan)`.
2. Increment `thinner_pass_count` for this file.
3. If `thinner_status == "partially_thinned"` OR `requires_re_audit`:
   - If `thinner_pass_count < max_thinner_passes` → RE-AUDIT → loop back to Phase 3A
   - If `thinner_pass_count >= max_thinner_passes` → add `"[filename]: max_passes_reached"` to `escalation_flags`
4. If `thinner_status == "failed"` → add to `escalation_flags` → continue.

After all god files: RE-AUDIT once. Rebuild `skill_queue`.

### PHASE 4 — Folder Governance Migration (Conditional)
```
IF "folder_governance_migration" NOT IN skill_queue → SKIP
```
**Sequencing check:** Exclude any file that is still in `active_audit.flags.god_files_found` from the migration candidate set. Log warning.

**Phase 4A — Dry Run:**
1. Invoke `folder_governance_migration(dry_run: true, current_date, directory_path, active_audit)`.
2. If `migration_status == "failed"` → add `"folder_migration_unresolvable"` to `escalation_flags` → skip to Phase 5.

**Phase 4B — Live:**
1. Invoke `folder_governance_migration(dry_run: false, ..., migration_plan)`.
2. If `migration_status == "partially_migrated"` OR `requires_re_audit`:
   - RE-AUDIT → rebuild `skill_queue`
   - If still partially_migrated after one retry → add `"partial_migration_remains"` to `escalation_flags`
3. If `"architecture_review"` in result's `next_recommended_skills` → add `"architecture_review_required: [file list]"` to `escalation_flags`.

### PHASE 5 — Final Verification Audit
Run unconditionally.
1. Invoke `router_pattern_audit(current_date, directory_path)`.
2. Overwrite `active_audit`. Persist final result to `.brain/audit-report.json`.

**Status determination:**
- `router_score == "pass"` AND `escalation_flags` empty → `workflow_status: "pass"`
- `router_score == "pass"` AND `escalation_flags` non-empty → `workflow_status: "partial"`
- `router_score != "pass"` → `workflow_status: "partial"`, add `"final_audit_not_passing"` to `escalation_flags`

### PHASE 6 — Final Report
Return workflow summary JSON with `workflow_meta`, `phase_log`, `final_audit_summary`, `escalation_report`, and `report_markdown`.

---

## 4. Re-Audit Subroutine

Called whenever a skill returns `requires_re_audit: true`:
1. Invoke `router_pattern_audit(current_date, directory_path)`.
2. Overwrite `active_audit`. Persist to `.brain/audit-report.json`.
3. Rebuild `skill_queue`.
4. Append to `phase_log` with label `"re-audit"`.

---

## 5. Escalation Protocol

| Flag | Meaning | Human Action |
|---|---|---|
| `router_build_failed` | Architect could not create CLAUDE.md | Inspect for permissions or encoding issues |
| `[file]: unresolvable_god_file` | Thinner found zero extractable seams | Manually decompose — likely circular coupling |
| `[file]: max_passes_reached` | Thinner hit the pass cap | Review remaining inline code manually |
| `architecture_review_required` | Barrel files or alias paths blocked migration | Update tsconfig/webpack alias registry, then re-run |
| `partial_migration_remains` | Some files couldn't be moved | Review `unresolvable_migrations` from migration output |
| `final_audit_not_passing` | Repo still not at "pass" after full run | Run audit manually and review remaining grades |

`escalation_flags` non-empty → `workflow_status` is never `"pass"` — minimum `"partial"`.

---

## 6. Execution Flow

```
START
  │
  ├─ PHASE 0: Bootstrap
  ├─ PHASE 1: Audit ──► router_score == "pass"? ──► Phase 6
  │                          │
  │                     fail/absent
  │                          │
  ├─ PHASE 2: Architect? ────┤  (fails hard → escalate)
  ├─ PHASE 3: Thinner? ──────┤  (loop per file, max 3 passes)
  ├─ PHASE 4: Migration? ────┤  (single retry on partial)
  ├─ PHASE 5: Final Verification Audit
  └─ PHASE 6: Final Report
               workflow_status: pass | partial | escalated
```

---

## 7. Skill Suite Reference

| Skill | Version | Spec File |
|---|---|---|
| `router_pattern_audit` | v2.5 | `knowledge/skills/router-pattern-audit.md` |
| `router_pattern_architect` | v1.1 | `knowledge/skills/router-pattern-architect.md` |
| `god_file_thinner` | v1.1 | `knowledge/skills/god-file-thinner.md` |
| `folder_governance_migration` | v1.1 | `knowledge/skills/folder-governance-migration.md` |
