# ZiroWork Agent Layer

Python agent-layer microservice that sits on top of the ZiroWork CRM using plain structured callable agent folders.
Automates everything a human studio director would do.

## Architecture

```
n8n Webhook → POST /events → ZIRO_ADMIN (Orchestrator)
                                ├── ZIRO_SCHEDULE    — Scheduling
                                ├── ZIRO_MESSAGING   — All outbound comms (ONLY external voice)
                                ├── ZIRO_LEADS    — Lead capture
                                ├── ZIRO_CLIENT     — Student profiles
                                ├── ZIRO_RETENTION  — Retention
                                ├── ZIRO_INVOICE     — Billing
                                │   └── ZIRO_FINANCE — Financial integrity
                                └── ZIRO_STAFF   — Teacher coordination
```

## Rules That Never Break

1. ZIRO_MESSAGING is the only agent that sends external messages.
2. All routing goes through ZIRO_ADMIN — agents never call each other directly.
3. ZIRO_INVOICE → ZIRO_FINANCE → ZIRO_ADMIN → ZIRO_MESSAGING is the financial chain.
4. Sessions are 30-minute blocks only.
5. Availability window is 7 days only.
6. Location matching is strict.

## Setup

```bash
cp .env.example .env
# Fill in .env values

pip install -r requirements.txt

uvicorn api.main:app --reload
```

