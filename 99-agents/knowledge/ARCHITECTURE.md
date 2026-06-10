# ROUTING HEADER
# What this file does: Documents the ZiroWork operational contract, summary, runbook, or guide for ARCHITECTURE.md.
# Depends on: ZiroWork repository documentation context only
# Do NOT load when working here: agents/, scripts/, tests/, database schemas, secrets, deployment configs unless explicitly approved
# Owning agent: ZiroWork documentation system
# Files that depend on THIS file: Documentation readers and scoped proposal workflows; exact importers not verified under locked read scope

# ZiroWork Agent Layer — Architecture

## Overview

The agent layer is a stateless Python microservice deployed independently from the ZiroWork CRM. It reads from and writes to the same Supabase database as the CRM.

## Event Flow

```
n8n (trigger) 
  → POST /events (FastAPI)
  → ZIRO_ADMIN (receives event, routes to sub-agent)
  → Sub-agent (does work, returns structured summary)
  → ZIRO_ADMIN (validates output)
  → ZIRO_MESSAGING (if external comms needed)
  → OpenPhone SMS (gated by ZIRO_MESSAGING_SMS_ENABLED)
```

## Agent Hierarchy

| Agent | Role | Communicates Externally |
|-------|------|------------------------|
| ZIRO_ADMIN | Orchestrator | No |
| ZIRO_MESSAGING | All outbound comms | Yes (only one) |
| ZIRO_LEADS | Lead capture | No |
| ZIRO_CLIENT | Student profiles | No |
| ZIRO_SCHEDULE | Scheduling | No |
| ZIRO_RETENTION | Retention | No |
| ZIRO_INVOICE | Billing | No |
| ZIRO_FINANCE | Financial audit | No |
| ZIRO_STAFF | Teacher coordination | No |

## Key Constraints

- All sessions: 30-minute blocks only
- Availability window: 7 days only
- Location matching: strict (no cross-location unless `flexible_location=True`)
- Financial chain: ZIRO_INVOICE → ZIRO_FINANCE → ZIRO_ADMIN → ZIRO_MESSAGING
- No agent calls another directly — all routing through ZIRO_ADMIN

## Database

- Supabase (PostgreSQL)
- All reads/writes via `shared/supabase_client.py`
- Service role key used only in scheduled background jobs
- Audit log: `ziro_events` table

## Control Plane

- Custom Director Dashboard (Phase 3) — built inside ZiroWork CRM
- ZIRO_MESSAGING sends gated by `ZIRO_MESSAGING_SMS_ENABLED` env flag
- All agent runs logged to `ziro_events` audit table
