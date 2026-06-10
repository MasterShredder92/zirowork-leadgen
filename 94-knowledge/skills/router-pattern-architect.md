# SKILL SPEC: Repository Router Architect (v1.1)

## 1. Trigger Conditions

**Invoked by workflow** when `audit_result.workflow_routing.next_recommended_skills` contains `"router_pattern_architect"`.

Operates in one of two modes, determined by the audit result:

| `router_score` | Mode | Behavior |
|---|---|---|
| `"absent"` | **CREATE** | Generate all artifacts from scratch |
| `"fail"` | **PATCH** | Repair only missing or broken sections in existing CLAUDE.md — do not overwrite valid content |

---

## 2. Complete Tool Interface Schema (MCP Compliant)

```json
{
  "name": "router_pattern_architect",
  "description": "Generates or repairs a CLAUDE.md router and agent-memory scaffolding based on a prior audit result. The only write-capable skill in the router pattern suite.",
  "input_schema": {
    "type": "object",
    "properties": {
      "current_date": {
        "type": "string",
        "description": "ISO 8601 timestamp injected by the calling harness. Required for temporal stamping."
      },
      "directory_path": {
        "type": "string",
        "description": "Target repository root. Defaults to current working directory if omitted."
      },
      "audit_result": {
        "type": "object",
        "description": "The complete, unmodified JSON output from router_pattern_audit. Required. Must not be re-run — consume the existing audit payload."
      }
    },
    "required": ["current_date", "audit_result"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "architect_meta": {
        "type": "object",
        "properties": {
          "target_directory":        { "type": "string" },
          "router_pattern_version":  { "type": "string" },
          "date_created":            { "type": "string" },
          "architect_mode":          { "type": "string", "enum": ["create", "patch"] },
          "confidence_score":        { "type": "number", "minimum": 0.0, "maximum": 1.0 }
        },
        "required": ["target_directory", "router_pattern_version", "date_created", "architect_mode", "confidence_score"]
      },
      "artifacts_created": {
        "type": "object",
        "properties": {
          "claude_md_path":       { "type": "string" },
          "brain_scaffolded":     { "type": "boolean" },
          "knowledge_scaffolded": { "type": "boolean" }
        },
        "required": ["claude_md_path", "brain_scaffolded", "knowledge_scaffolded"]
      },
      "unresolved_fields":  { "type": "array", "items": { "type": "string" } },
      "architect_status":   { "type": "string", "enum": ["created", "patched", "partial", "failed"] },
      "workflow_routing": {
        "type": "object",
        "properties": {
          "requires_re_audit":        { "type": "boolean" },
          "next_recommended_skills":  { "type": "array", "items": { "type": "string" } }
        },
        "required": ["requires_re_audit", "next_recommended_skills"]
      },
      "report_markdown": { "type": "string" }
    },
    "required": ["architect_meta", "artifacts_created", "unresolved_fields", "architect_status", "workflow_routing", "report_markdown"]
  }
}
```

---

## 3. Constraints & Behavioral Safeguards

**Write Scope Rule:** This skill may write ONLY to: `CLAUDE.md`, `.brain/current-state.md`, `.brain/stages/00-session-close/` (directory scaffold), `knowledge/architecture.md`. Recursive parent directory creation is permitted for all allowed targets. No other files may be created, modified, or deleted.

**PATCH Mode Integrity Rule:** In PATCH mode, evaluate sections structurally — regenerate a section only if that specific heading is missing, completely empty, or contains explicit `UNVERIFIED` flags. Do not use L-layer grades to determine which sections to patch.

**No Hallucinated Paths Rule:** Every path written into CLAUDE.md must be verified as existing on disk. Any unverified path must be marked `UNVERIFIED` inline.

**Token Budget Rule:** Generated CLAUDE.md must target 400–600 tokens. Hard cap: 800 tokens. Content exceeding this belongs in `knowledge/` — not in the router.

**Consume Audit Rule:** Do not re-run discovery. All structural knowledge comes from `audit_result`.

**Confidence Tiers:** Deductions for missing descriptive metadata (stack summaries, project descriptions) are metadata warnings only — they never drop the score below 0.6. Only true structural failures (missing layer folders, unresolvable paths) reduce the score below 0.6.

---

## 4. Execution Protocol

**Step 1: Mode Determination**
Read `audit_result.scores.router_score`. Set `architect_mode` to `"create"` or `"patch"`.

**Step 2: Project Fingerprinting**
Determine: project type, entry point folder name, stack summary (from package.json / requirements.txt / etc.), project description seed (from README.md if present). Mark any undetermined field as `UNKNOWN` and add to `unresolved_fields`.

**Step 3: CLAUDE.md Generation (CREATE mode)**
Generate exactly 6 sections: What This Is · Workspaces · Folder Structure · Load Rules · Safety Gates · Current State.

Safety Gates fallback when no god files found: `| None identified | No hyper-critical global files detected at this time. |`

**Step 4: CLAUDE.md Patching (PATCH mode)**
Read existing CLAUDE.md. For each of the 6 sections: if missing, empty, or contains `UNVERIFIED` → regenerate that section only. Prepend: `<!-- PATCHED by router_pattern_architect v1.1 on [current_date] -->`

**Step 5: Agent-Memory Scaffolding (both modes)**

| Condition | Action |
|---|---|
| `.brain/` absent | Create `.brain/` + `current-state.md` stub + `stages/00-session-close/` directory |
| `knowledge/` absent | Create `knowledge/` + `architecture.md` stub |
| Both present | Skip |

**Step 6: Confidence Scoring**
Start at 1.0. Subtract 0.15 per UNKNOWN structural field (missing layer folders). Subtract 0.10 per unverifiable Safety Gate path. Floor at 0.1. Metadata warnings (no README, no package.json) log only — never reduce score.

**Step 7: Status Determination**

| Condition | `architect_status` |
|---|---|
| CREATE mode AND `confidence_score >= 0.6` | `"created"` |
| PATCH mode AND all critical sections resolved | `"patched"` |
| `confidence_score < 0.6` OR `unresolved_fields` non-empty | `"partial"` |
| CLAUDE.md could not be written | `"failed"` |

**Step 8: Workflow Routing**
`requires_re_audit: true` if `architect_status == "partial"` or `"failed"`. `requires_re_audit: false` if `"created"` or `"patched"`.

---

## 5. Generated Artifact Templates

**CLAUDE.md target (6 sections, 400–600 tokens):**
```
# [Project Name] — [One-sentence description]
[Stack line]

---

## Workspaces
| Path | What | Purpose |

## Folder Structure
[code block — verified paths only]

## Load Rules
| Task | Load |

## Safety Gates
| File | Risk |

## Current State ([current_date])
- [What is built]
- [What is not yet connected]
```

**`.brain/current-state.md` stub:**
```
# Current State
Last updated: [current_date]
Status: Initial scaffold — populate after first working session.
```

**`knowledge/architecture.md` stub:**
```
# Architecture
Status: STUB — populate with project architecture decisions after first session.
```
