# ROUTING HEADER
# What this file does: Documents the ZiroWork operational contract, summary, runbook, or guide for AGENT_CONTRACTS.md.
# Depends on: ZiroWork repository documentation context only
# Do NOT load when working here: agents/, scripts/, tests/, database schemas, secrets, deployment configs unless explicitly approved
# Owning agent: ZiroWork documentation system
# Files that depend on THIS file: Documentation readers and scoped proposal workflows; exact importers not verified under locked read scope

# Agent Contracts

Every agent must return a `ZiroState` dict with these fields populated:

| Field | Required | Description |
|-------|----------|-------------|
| `agent_output` | Yes | Structured summary of what the agent did |
| `status` | Yes | `"complete"` or `"failed"` |
| `messaging_payload` | If comms needed | Dict with `recipient_id`, `message_type`, `data` |
| `error` | If failed | Human-readable error message |

## ZIRO_SCHEDULE Contract

Input: `entity_id` = student UUID, `event_type` = `session_scheduled` or `session_cancelled`

Output:
```json
{
  "student_name": "Wyatt Smith",
  "teacher_name": "Jane Doe",
  "day": "2026-05-01",
  "time": "15:00:00",
  "location_id": "uuid",
  "session_type": "student_session"
}
```

## ZIRO_MESSAGING Contract

Input: `messaging_payload.message_type` determines message template.

Supported message types:
- `session_confirmation`
- `payment_reminder`

## ZIRO_INVOICE → ZIRO_FINANCE Contract

ZIRO_INVOICE must set `agent_output` with financial summary before returning to ZIRO_ADMIN.
ZIRO_FINANCE receives ZIRO_INVOICE's output, audits it, and either approves or flags it.
ZIRO_FINANCE must set `status = "complete"` (approved) or `status = "failed"` (flagged).
