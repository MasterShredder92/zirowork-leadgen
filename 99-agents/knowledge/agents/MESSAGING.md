# ROUTING HEADER
# What this file does: Documents the ZiroWork operational contract, summary, runbook, or guide for ZIRO_MESSAGING_DIAGNOSTIC_RUNBOOK.md.
# Depends on: ZiroWork repository documentation context only
# Do NOT load when working here: agents/, scripts/, tests/, database schemas, secrets, deployment configs unless explicitly approved
# Owning agent: ZiroWork documentation system
# Files that depend on THIS file: Documentation readers and scoped proposal workflows; exact importers not verified under locked read scope

# ZIRO_MESSAGING Diagnostic Runbook: Form Submit to SMS Delivery

This runbook documents the exact chain of events from a new lead form submission to ZIRO_MESSAGING sending an SMS. It details the data flow, the root causes of the bugs fixed during Phase 12 integration, and provides a step-by-step self-healing checklist to diagnose and restore the system if it ever breaks again.

## The Data Flow Chain (End-to-End)

When a lead submits a form on the website, the following sequence executes:

1.  **Intake Webhook (`POST /intake/form`)**
    *   Receives form data.
    *   Writes a `new_lead_created` event to `ziro_events`.
2.  **ANCHOR Scheduler**
    *   Picks up the pending `new_lead_created` event.
    *   Dispatches it to `/events/`.
3.  **ZIRO_ADMIN Orchestrator**
    *   Receives the event, validates it, and routes it to **ZIRO_LEADS**.
4.  **ZIRO_LEADS (Lead Qualification)**
    *   Fetches the raw lead data from the CRM.
    *   Scores the lead and determines the recommended stage.
    *   **Crucial Step:** Builds the `messaging_payload`. It hoists `recipient_phone`, `recipient_email`, and `recipient_name` to the top level of this payload.
    *   Returns the payload to ZIRO_ADMIN.
5.  **ZIRO_ADMIN (Outcome Logging)**
    *   Reads the `messaging_payload` from ZIRO_LEADS.
    *   If `requires_outbound` is true, ZIRO_ADMIN writes a *new* row to `ziro_events` with `event_type = ziro_messaging_send_requested`.
    *   The `messaging_payload` is saved in the `input_summary` column of this new row.
6.  **ANCHOR Scheduler (Second Pass)**
    *   Picks up the pending `ziro_messaging_send_requested` event.
    *   **Crucial Step:** Dispatches it directly to `/events/ziro-messaging/process` (bypassing ZIRO_ADMIN), using the `messaging_event_id` as the `entity_id`.
7.  **ZIRO_MESSAGING (Message Generation & Sending)**
    *   `/events/ziro-messaging/process` reads the `messaging_payload` from the `input_summary` of the `ziro_events` row.
    *   ZIRO_MESSAGING checks for duplicates (`check_duplicate`).
    *   ZIRO_MESSAGING composes the message (`compose_message`) and audits it (`audit_message`).
    *   ZIRO_MESSAGING writes the drafted message to `ziro_message_log` with `status = pending_approval`.
    *   `send_or_gate` checks if the message is approved (or if the gate is removed for testing).
    *   If approved, it sends the SMS via OpenPhone.
    *   **Crucial Step:** Updates the `ziro_message_log` row to `status = sent` and sets `sent_at`.
    *   Updates the `ziro_events` row to `status = complete`.

## Root Causes Fixed (May 2026)

During the initial integration, the chain broke at multiple points. Here are the specific bugs and how they were fixed:

| Component | Bug | The Fix |
| :--- | :--- | :--- |
| **ANCHOR** | Dispatched `ziro_messaging_send_requested` with `entity_id=None`. | Updated `jobs.py` to extract `messaging_event_id` from `input_summary` and pass it as the `entity_id`. |
| **ANCHOR** | Dispatched `ziro_messaging_send_requested` to the general `/events/` endpoint, causing legacy framework checkpoint collisions. | Rewrote the dispatch in `jobs.py` to call `/events/ziro-messaging/process` directly, bypassing ZIRO_ADMIN. |
| **ZIRO_MESSAGING API** | `/events/ziro-messaging/process` queried non-existent columns (`messaging_payload`, `location_slug`) in `ziro_message_log`. | Removed these columns from the `select()` query. Rebuilt a minimal `messaging_payload` from existing columns (`recipient_phone`, `channel`, etc.). |
| **ZIRO_MESSAGING Tools** | `check_duplicate` queried a non-existent `outbound_type` column in `ziro_message_log`. | Removed the `.eq("outbound_type")` filter. Deduplication now relies on recipient and time window. |
| **ZIRO_LEADS** | Buried the lead's phone number deep inside `messaging_payload.raw_lead_data.lead.phone`. | Updated `build_messaging_handoff` in ZIRO_LEADS to hoist `recipient_phone`, `recipient_email`, and `recipient_name` to the top level of `messaging_payload`. |
| **ZIRO_MESSAGING Graph** | Messages stayed stuck in `pending_approval` even after being sent successfully. | Added a database update in `send_or_gate` to change the `ziro_message_log` row status to `sent` (or `send_failed`) after the send attempt. |

## Self-Healing Checklist (How to Diagnose)

If SMS delivery stops working, follow these exact steps to isolate the failure point:

### 1. Check Intake to ZIRO_ADMIN (`new_lead_created`)
*   **Action:** Query `ziro_events` for the latest `new_lead_created` event.
*   **Command:** `client.table('ziro_events').select('*').eq('event_type', 'new_lead_created').order('created_at', desc=True).limit(1).execute()`
*   **Expected:** `status` should be `complete`.
*   **If Failed:** Check Docker logs for Uvicorn errors on `POST /intake/form` or `/events/`.

### 2. Check ZIRO_LEADS's Output (`messaging_payload`)
*   **Action:** Inspect the `output_summary` of the `new_lead_created` event.
*   **Expected:** It should contain the qualification score.
*   **Crucial Check:** Look for the subsequent `ziro_messaging_send_requested` event in `ziro_events`. Inspect its `input_summary`. It **must** contain `recipient_phone` at the top level.
*   **If Failed:** ZIRO_LEADS's steps are failing to hoist the contact data. Check `agents/ziro-leads/steps.py`.

### 3. Check ANCHOR Dispatch (`ziro_messaging_send_requested`)
*   **Action:** Query `ziro_events` for the latest `ziro_messaging_send_requested` event.
*   **Expected:** `status` should transition from `pending` to `processing` to `complete`.
*   **If Failed (Stuck in Pending):** ANCHOR scheduler is dead. Check `api/scheduler/jobs.py` and Uvicorn worker logs.
*   **If Failed (Status Failed):** The `/events/ziro-messaging/process` endpoint crashed. Check Docker logs for stack traces.

### 4. Check ZIRO_MESSAGING Message Log (`ziro_message_log`)
*   **Action:** Query `ziro_message_log` for the latest entries.
*   **Command:** `client.table('ziro_message_log').select('*').order('created_at', desc=True).limit(1).execute()`
*   **Expected:** A row should exist with the drafted message.
*   **Crucial Check:** The `status` should be `sent`.
*   **If Failed (Status `pending_approval`):** The human approval gate is active, OR `send_or_gate` failed silently. Check `agents/ziro-messaging/steps.py`.
*   **If Failed (Status `send_failed`):** OpenPhone API rejected the send. Check the `error_message` column.

### 5. Check Safety Guards
*   **Action:** Check the `.env` file on the droplet.
*   **Crucial Check:** Is `TEST_PHONE_ONLY` set? If so, all SMS are being redirected to that number. Remove it for production sends.

## Standard Operating Procedure for Fixes

1.  **Never guess.** Use the database queries above to find exactly which node failed.
2.  **Fix precisely.** Do not rewrite entire graphs if a single dictionary key is missing.
3.  **Verify locally.** Run `python3 -m pytest tests/` before deploying.
4.  **Deploy cleanly.** Use `docker build --no-cache` if necessary to ensure the latest code runs.
