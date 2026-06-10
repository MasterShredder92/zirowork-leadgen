# SKILL SPEC: Repository Router Audit (v2.5)

## 1. Trigger Conditions

**Manual:** User or agent orchestration layer explicitly invokes the audit command.

**Autonomous:** Automatically invoke this skill if and only if:
- An active modification, build, or deployment command is issued (e.g., create, edit, wire, compile, test)
- AND a root-level CLAUDE.md is absent

**Re-Audit Trigger:** Automatically re-verify if a saved audit artifact exists at `.brain/audit-report.json` but the repository's git log history indicates greater than 20 commits have been checked in since the `date_evaluated` timestamp stored inside that file.

---

## 2. Complete Tool Interface Schema (Strict MCP Compliance)

```json
{
  "name": "router_pattern_audit",
  "description": "Analyzes a repository architecture against the 7-layer Router Pattern governance model without mutating code.",
  "input_schema": {
    "type": "object",
    "properties": {
      "current_date": {
        "type": "string",
        "description": "ISO 8601 extended timestamp injected directly by the calling harness or orchestration system. Required for deterministic temporal verification."
      },
      "directory_path": {
        "type": "string",
        "description": "The absolute or relative path to the target repository root directory. Defaults to the current working directory ('.') if omitted."
      }
    },
    "required": ["current_date"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "audit_meta": {
        "type": "object",
        "properties": {
          "target_directory":        { "type": "string" },
          "router_pattern_version":  { "type": "string" },
          "date_evaluated":          { "type": "string" }
        },
        "required": ["target_directory", "router_pattern_version", "date_evaluated"]
      },
      "scores": {
        "type": "object",
        "properties": {
          "router_score": { "type": "string", "enum": ["pass", "fail", "absent"] },
          "top_blockers": { "type": "array", "items": { "type": "string" } },
          "layer_grades": {
            "type": "object",
            "properties": {
              "L0": { "type": "string", "enum": ["A","B","C","D","F"] },
              "L1": { "type": "string", "enum": ["A","B","C","D","F"] },
              "L2": { "type": "string", "enum": ["A","B","C","D","F"] },
              "L3": { "type": "string", "enum": ["A","B","C","D","F"] },
              "L4": { "type": "string", "enum": ["A","B","C","D","F"] },
              "L5": { "type": "string", "enum": ["A","B","C","D","F"] },
              "L6": { "type": "string", "enum": ["A","B","C","D","F"] }
            },
            "required": ["L0","L1","L2","L3","L4","L5","L6"]
          }
        },
        "required": ["router_score", "top_blockers", "layer_grades"]
      },
      "flags": {
        "type": "object",
        "properties": {
          "flat_bag_detected":  { "type": "boolean" },
          "god_files_found":    { "type": "array", "items": { "type": "string" } },
          "suspected_orphans":  { "type": "array", "items": { "type": "string" } },
          "naming_lies":        { "type": "array", "items": { "type": "string" } }
        },
        "required": ["flat_bag_detected", "god_files_found", "suspected_orphans", "naming_lies"]
      },
      "workflow_routing": {
        "type": "object",
        "properties": {
          "requires_immediate_refactor":  { "type": "boolean" },
          "next_recommended_skills":      { "type": "array", "items": { "type": "string" } }
        },
        "required": ["requires_immediate_refactor", "next_recommended_skills"]
      },
      "report_markdown": { "type": "string" }
    },
    "required": ["audit_meta", "scores", "flags", "workflow_routing", "report_markdown"]
  }
}
```

---

## 3. Constraints & Behavioral Safeguards

**Strict Read-Only Rule:** Under no circumstances may this skill edit, move, create, or delete any files or directories. Persistence of the JSON output payload to `.brain/audit-report.json` must be managed entirely by the calling orchestration harness, not this tool.

**Path Verification Rule:** DO NOT guess or hallucinate file paths or import linkages. Unverified targets must be explicitly flagged as `UNVERIFIED`.

**Stack Agnostic / Approximate Sweep:** Structural layers are mapped conceptually, not via platform-specific syntax. Orphan file analysis must be treated as best-effort / approximate because import/require/include syntax varies drastically across programming languages.

---

## 4. Execution Protocol

**Step 1: Structure Discovery**
Resolve `directory_path` (defaulting to `.` if null or omitted). Scan the root directory for `CLAUDE.md` or equivalent router files. Generate an internal map of the directory tree down to 3 levels deep.

**Step 2: Layer Analysis & Grading**

Grading rubric:
- **A:** Explicit, dedicated contract file or clear router definition exists
- **B:** Implicit structure exists and follows a consistent naming convention
- **C:** Mixed or ambiguous contents
- **D:** Layer is physically absent, but directory layout makes intent inferable
- **F:** Contradictory organization, completely missing files, or total architectural chaos

Layers to evaluate:
- **L0:** Router — CLAUDE.md map and load rules presence
- **L1:** Entry Points — Direct user/system invocation files: views, commands, routes
- **L2:** Building Blocks — Shared internal structures: components, services, controllers
- **L3:** Infrastructure — Stateless helpers, configurations, utilities
- **L4:** Data Layers — Mock data, fixtures, seeds
- **L5:** Stable Reference — Read-only architectural knowledge, schemas, API contracts inside `knowledge/`
- **L6:** Session State — Writable agent memory, task logs, and stage contracts inside `.brain/`

**Step 3: Anti-Pattern Sweep**
- **The Flat Bag:** >5 source files sitting loosely in a single directory without governance
- **The God File:** Any single file containing >300 lines of code or combining configuration, UI, and business logic
- **Silent Orphans (Best-Effort):** Verified files on disk that have zero detectable import references or route registrations
- **Naming Lies:** Files whose contents directly contradict their folder names

**Step 4: Downstream Workflow Routing Logic**

- `requires_immediate_refactor` = `true` if: L0 == "F" OR `flat_bag_detected` == `true` OR `god_files_found.length > 0`
- `router_score`:
  - `"absent"` — No CLAUDE.md found
  - `"fail"` — CLAUDE.md present AND (L0 grade is C/D/F OR `requires_immediate_refactor` == `true`)
  - `"pass"` — L0 grade is A or B AND `requires_immediate_refactor` == `false`
- Append `"router_pattern_architect"` to `next_recommended_skills` if L0 grade is C, D, or F
- Append `"god_file_thinner"` to `next_recommended_skills` if `god_files_found.length > 0`
- Append `"folder_governance_migration"` to `next_recommended_skills` if `flat_bag_detected` == `true`

**Step 5: Output**
Return a single JSON object. `date_evaluated` is a direct passthrough of `current_date`. During output, all array fields must return `[]` rather than being omitted to satisfy schema validation.
