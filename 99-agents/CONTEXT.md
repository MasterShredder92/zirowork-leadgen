# 99-agents — Context

> **JUDGMENT IS NOT PERMITTED.** Follow these rules exactly. Situation not covered? STOP AND ASK.
> This is a **separate Python deployment** from the React CRM. Different language, different server.

## You are here
Agent backend — Python FastAPI server with 11 AI agents. Handles SMS/email sending, lead management, scheduling, and automation. Runs on port 8000.

## Files in this folder
```
agents/          — 11 agents: ziro-admin (orchestrator), ziro-messaging (only one that sends SMS/email),
                   ziro-leads, ziro-client, ziro-schedule, ziro-retention,
                   ziro-invoice, ziro-finance, ziro-staff, ziro-pulse
api-server/      — FastAPI front door: intake/, routes/events.py, scheduler/
tools/           — shared utilities: supabase_client.py, event_types.py, llm.py, gmail_client.py
database/        — 15 SQL migrations (run once in order to build the DB)
tests/           — pytest suite (unit + integration)
knowledge/       — see sub-structure below
  system/        — Zach's methodology: playbooks/, sms-scripts/, VOICE-GUIDE.md, SCRIPTS-INDEX.md, TEST-SCENARIOS.md
  agents/        — what each agent does
  ARCHITECTURE.md    — event flow + agent hierarchy
  AGENT_CONTRACTS.md — what every agent must return
  EVENT_TYPES.md     — master list of all event types
Dockerfile + docker-compose.yml — standalone server deploy
requirements.txt — Python dependencies
README.md        — start here for agent backend orientation
```

## Enter ONLY if
Your task explicitly names: agents, the Python backend, SMS/email logic, FastAPI, a specific agent (ziro-*), or agent backend architecture.

## Do NOT enter if
- Task involves the React CRM frontend (views, shell, design) → that is the main repo, not here
- Task involves Supabase migrations for the CRM → check `94-knowledge/migrations/`
- Task involves the landing pages or client portal → those are separate deployments

## Navigate within this folder
| Task | Load |
|---|---|
| Understand agent hierarchy / event flow | `knowledge/ARCHITECTURE.md` |
| What a specific agent must return | `knowledge/AGENT_CONTRACTS.md` |
| All event type definitions | `knowledge/EVENT_TYPES.md` |
| SMS conversation scripts | `knowledge/system/sms-scripts/` |
| Voice and tone rules | `knowledge/system/VOICE-GUIDE.md` |
| Gold standard behaviors | `knowledge/system/TEST-SCENARIOS.md` |
| Edit a specific agent | `agents/ziro-<name>/` |
| API routes | `api-server/routes/` |
| Run/update DB schema | `database/migrations/` (run in order) |

## Hard stop
Only ziro-messaging sends SMS and email. No other agent may trigger outbound messages.
You may NOT load React CRM files while working in this folder.
If you think you need something not listed — STOP AND ASK first.
