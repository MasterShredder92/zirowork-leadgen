# ROUTING HEADER
# What this file does: Documents the ZiroWork operational contract, summary, runbook, or guide for EVENT_TYPES.md.
# Depends on: ZiroWork repository documentation context only
# Do NOT load when working here: agents/, scripts/, tests/, database schemas, secrets, deployment configs unless explicitly approved
# Owning agent: ZiroWork documentation system
# Files that depend on THIS file: Documentation readers and scoped proposal workflows; exact importers not verified under locked read scope

# Event Types

All event types are defined in `shared/event_types.py`.

| Event Type | Owning Agent | Description |
|------------|-------------|-------------|
| `new_lead_created` | ZIRO_LEADS | New inquiry submitted |
| `lead_qualified` | ZIRO_LEADS | Lead marked ready for enrollment |
| `student_enrolled` | ZIRO_CLIENT | New student record created |
| `onboarding_complete` | ZIRO_CLIENT | Student onboarding flow finished |
| `session_scheduled` | ZIRO_SCHEDULE | New session booking requested |
| `session_cancelled` | ZIRO_SCHEDULE | Session cancellation received |
| `teacher_note_submitted` | ZIRO_STAFF | Teacher submitted a lesson note |
| `payment_received` | ZIRO_INVOICE | Payment processed successfully |
| `payment_failed` | ZIRO_INVOICE | Payment attempt failed |
| `payment_overdue` | ZIRO_INVOICE | Invoice past due date |
| `invoice_generated` | ZIRO_INVOICE | New invoice created |
| `student_attendance_dropped` | ZIRO_RETENTION | Attendance below threshold |
| `student_inactive_flagged` | ZIRO_RETENTION | Student flagged as at-risk |

## Payload Schema

Every event from n8n must include:

```json
{
  "event_type": "session_scheduled",
  "entity_id": "uuid-of-primary-entity",
  "location_id": "uuid-of-location",
  "metadata": {}
}
```
