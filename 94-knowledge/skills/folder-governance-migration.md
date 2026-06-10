# SKILL SPEC: Folder Governance Migration Engine (v1.1)

## 1. Trigger Conditions

**Manual:** User or orchestration layer explicitly executes the migration command.

**Autonomous:** Invoked by the workflow harness when `audit_result.flags.flat_bag_detected == true` OR `audit_result.flags.naming_lies` is non-empty.

**Sequencing Rule:** Must execute exclusively after `god_file_thinner` completes. Never run migration on a file currently flagged as a god file.

**Execution Constraint:** Two-phase verification lock:

| Phase | `dry_run` | Expected Input | Behavior |
|---|---|---|---|
| Phase 1 | `true` | `audit_result` | Classify locations, map destinations, trace import references. Writes blocked. |
| Phase 2 | `false` | `audit_result` + `migration_plan` | Execute re-locations and rewrite import syntax globally. Writes are live. |

---

## 2. Complete Tool Interface Schema (Strict MCP Compliance)

```json
{
  "name": "folder_governance_migration",
  "description": "Bulk-migrates misplaced source files into governed layers using git mv. Rewrites all affected import paths. Employs a strict two-phase dry_run gate.",
  "input_schema": {
    "type": "object",
    "properties": {
      "current_date": { "type": "string", "description": "ISO 8601 extended timestamp injected by the calling harness." },
      "directory_path": { "type": "string", "description": "Target repository root. Defaults to '.' if omitted." },
      "audit_result": { "type": "object", "description": "Unmodified JSON payload from router_pattern_audit." },
      "dry_run": { "type": "boolean", "description": "True generates migration plan without mutations. False executes the passed migration_plan." },
      "migration_plan": { "type": "array", "description": "Required if dry_run is false.", "items": { "type": "object" } }
    },
    "required": ["current_date", "audit_result"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "migration_meta": {
        "type": "object",
        "properties": {
          "target_directory":           { "type": "string" },
          "router_pattern_version":     { "type": "string" },
          "date_executed":              { "type": "string" },
          "execution_mode":             { "type": "string", "enum": ["dry_run","live"] },
          "git_mv_available":           { "type": "boolean" },
          "module_resolution_dialect":  { "type": "string", "enum": ["ESM","CJS","TS_Alias","UNKNOWN"] }
        },
        "required": ["target_directory","router_pattern_version","date_executed","execution_mode","git_mv_available","module_resolution_dialect"]
      },
      "migration_plan": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "source_path":    { "type": "string" },
            "target_path":    { "type": "string" },
            "target_layer":   { "type": "string", "enum": ["L1","L2","L3","L4"] },
            "violation_type": { "type": "string", "enum": ["flat_bag","naming_lie","both"] },
            "reason":         { "type": "string" },
            "import_sites":   { "type": "array", "items": { "type": "string" } },
            "naming_correction": {
              "type": ["object","null"],
              "properties": {
                "old_name": { "type": "string" },
                "new_name": { "type": "string" },
                "reason":   { "type": "string" }
              }
            },
            "resolvable":      { "type": "boolean" },
            "block_reason":    { "type": ["string","null"] },
            "is_barrel_file":  { "type": "boolean" },
            "uses_path_alias": { "type": "boolean" }
          },
          "required": ["source_path","target_path","target_layer","violation_type","reason","import_sites","naming_correction","resolvable","block_reason","is_barrel_file","uses_path_alias"]
        }
      },
      "execution_results": {
        "type": "object",
        "properties": {
          "files_moved":                { "type": "array", "items": { "type": "string" } },
          "import_sites_rewritten":     { "type": "integer" },
          "naming_corrections_applied": { "type": "integer" }
        },
        "required": ["files_moved","import_sites_rewritten","naming_corrections_applied"]
      },
      "rollback_manifest": {
        "type": "object",
        "properties": {
          "backup_files":      { "type": "array", "items": { "type": "string" } },
          "git_mv_operations": { "type": "array", "items": { "type": "object", "properties": { "from": { "type": "string" }, "to": { "type": "string" } }, "required": ["from","to"] } }
        },
        "required": ["backup_files","git_mv_operations"]
      },
      "unresolvable_migrations": { "type": "array", "items": { "type": "string" } },
      "migration_status": { "type": "string", "enum": ["plan_ready","migrated","partially_migrated","failed"] },
      "workflow_routing": {
        "type": "object",
        "properties": {
          "requires_re_audit":       { "type": "boolean" },
          "next_recommended_skills": { "type": "array", "items": { "type": "string" } }
        },
        "required": ["requires_re_audit","next_recommended_skills"]
      },
      "report_markdown": { "type": "string" }
    },
    "required": ["migration_meta","migration_plan","execution_results","rollback_manifest","unresolvable_migrations","migration_status","workflow_routing","report_markdown"]
  }
}
```

---

## 3. Constraints & Behavioral Safeguards

**Two-Phase Lock:** Abort with `migration_status: "failed"` if `dry_run == false` and `migration_plan` is absent, empty, or contains zero `resolvable: true` entries.

**History Preservation:** File re-allocations must use `git mv`. If git is unavailable, fall back to file system move and explicitly log history loss in `report_markdown`.

**Immutable Snapshots:** Write `[source_path].[current_date].bak` before any migration. Never overwrite existing backups.

**Operational Path Principle:** When rewriting imports, if a consuming file was itself moved during execution, open it at its new destination coordinate — not its original path.

**Relative Path Calculation Rule:** Import rewrites must dynamically calculate the relative path from the post-migration consumer location to the post-migration target location. Never write absolute paths or unadjusted fragments.

**Barrel File Freeze:** Files detected as barrel exports (`index.js`, files consisting predominantly of re-exports) must be flagged `is_barrel_file: true` and `resolvable: false`.

**Alias Encapsulation Rule:** Files requiring global alias registry adjustments (tsconfig paths, webpack aliases) must be flagged `uses_path_alias: true` and `resolvable: false`.

**Deadlock Shield:** If Phase 1 yields zero actionable migrations, set `migration_status: "failed"`, remove self from `next_recommended_skills`, terminate.

**CLAUDE.md Dependency Rule:** All target paths must be verified against the CLAUDE.md layer map. If CLAUDE.md is absent or graded F, abort with `requires_re_audit: true`.

---

## 4. Execution Protocol

### Phase 1 — Dry Run

1. Load targeted flags from `audit_result`. Review CLAUDE.md for strict folder definitions.
2. Verify git availability. Identify module resolution dialect.
3. Classify misplaced files by content: UI renders → L2, stateless helpers → L3, data constants → L4, route/command registrations → L1. Flag ambiguous files `resolvable: false`.
4. Filter barrel files and aliased paths → `resolvable: false`.
5. Scan codebase for all import sites per candidate. Flag dynamic string-concatenated imports `resolvable: false`.
6. Check candidates against CLAUDE.md naming conventions. Compute `naming_correction` where needed.
7. Deadlock check: if zero resolvable candidates → `migration_status: "failed"`, remove self from queue.
8. Return plan with all execution arrays as `[]` / `0`.

### Phase 2 — Live Execution

1. Confirm plan structure and verify all source/target paths still exist on disk.
2. Write `[path].[current_date].bak` snapshots. Build full `git_mv_operations` list before first write.
3. Execute `git mv [source] [target]` in topological order. Log each to `rollback_manifest`.
4. Iterate import sites. Look up consumer's current location (new path if moved). Calculate relative distance from new consumer to new target. Rewrite using detected `module_resolution_dialect`.
5. Scan repo for remaining old path references. Flag `migration_status: "partially_migrated"` if found; `"migrated"` if clean.
6. Update CLAUDE.md Folder Structure section (only permitted router write).

---

## 5. Downstream Routing Logic

- `requires_re_audit: true` if `migration_status` is `"partially_migrated"` or `"failed"`
- If `unresolvable_migrations` contains barrel/alias-blocked files → append `"architecture_review"` to `next_recommended_skills`
- If `migration_status == "failed"` → remove `"folder_governance_migration"` from `next_recommended_skills`
