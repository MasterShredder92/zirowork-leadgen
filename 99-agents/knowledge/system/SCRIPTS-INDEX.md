# ROUTING HEADER
# What this file does: Documents the ZiroWork operational contract, summary, runbook, or guide for ZIRO_MESSAGING_SCRIPTS_INDEX.md.
# Depends on: ZiroWork repository documentation context only
# Do NOT load when working here: agents/, scripts/, tests/, database schemas, secrets, deployment configs unless explicitly approved
# Owning agent: ZiroWork documentation system
# Files that depend on THIS file: Documentation readers and scoped proposal workflows; exact importers not verified under locked read scope

# ZIRO_MESSAGING Scripts Index

This is the master index of all ZIRO_MESSAGING conversation scripts. Every path a conversation can take is covered here. ZIRO_MESSAGING never improvises — she selects from these scripts and adapts the variables.

**Voice:** Andrea (primary) + Zach (adult peer-to-peer). See `ZIRO_MESSAGING_VOICE_GUIDE.md` for full rules.

---

## Script Library

| # | File | Framework ID | Trigger | Goal |
|---|---|---|---|---|
| 01 | `scripts/01_lead_opener.md` | `lead_opener` | `new_lead_created` | First contact — confirm identity, confirm instrument, get a response |
| 02 | `scripts/02_no_response_followup.md` | `followup_day2`, `followup_day4`, `followup_day7` | No response after 24h/48h/72h | Re-engage without pressure — 3 attempts max |
| 03 | `scripts/03_pricing.md` | `pricing_delivery` | Lead asks about price, or after opener | State price clearly, pivot to scheduling |
| 04 | `scripts/04_scheduling.md` | `scheduling_offer` | Lead agrees to pricing or asks about availability | Offer specific slots, get commitment |
| 05 | `scripts/05_enrollment_close.md` | `enrollment_close` | Lead agrees to a slot | Send registration link immediately, close |
| 06 | `scripts/06_objections.md` | `objection_handling` | Any objection at any stage | Acknowledge, address, re-engage or exit gracefully |
| 07 | `scripts/07_cancellation.md` | `cancellation_tree` | Active student cancels | Soft save attempt, graceful exit, keep door open |
| 08 | `scripts/08_teacher_callout.md` | `teacher_callout` | Teacher calls out | Notify family fast, offer sub/reschedule/credit |
| 09 | `scripts/09_complaint.md` | `complaint_handling` | Any dissatisfaction expressed | Acknowledge, apologize, fix or escalate |
| 10 | `scripts/10_review_request.md` | `review_request` | 30+ days enrolled, high engagement | Direct Google review link, one ask only |
| 11 | `scripts/11_payment.md` | `payment_overdue` | Invoice overdue, payment failed | Friendly reminder, escalate to ZIRO_INVOICE |
| 12 | `scripts/12_cold_reactivation.md` | `cold_reactivation` | Past student or cold lead (30+ days) | Re-open the door, one message per season |
| 13 | `scripts/13_instrument_questions.md` | `instrument_guidance` | Gear/instrument/age questions | Real recommendation, pivot to scheduling |
| 14 | `scripts/14_teacher_change.md` | `teacher_change` | Teacher leaving or parent requests change | Warm transition, meet and greet offer |
| 15 | `scripts/15_retention_checkin.md` | `retention_checkin` | ZIRO_RETENTION flags at-risk student | Andrea's 3-month check-ins and risk-based outreach |
| 16 | `scripts/16_cancellation_save.md` | `cancellation_save` | Student mentions cancelling | High-precision save attempts using Andrea's scripts |
| 17 | `scripts/17_billing_reminder.md` | `billing_reminder` | Invoice overdue | Friendly but firm reminders with the Week 2 rule |

---

## Master Conversation Flow

```
NEW LEAD
  └─ 01_lead_opener
       ├─ responds → 03_pricing
       │    ├─ yes → 04_scheduling
       │    │    └─ slot agreed → 05_enrollment_close → ENROLLED
       │    └─ objection → 06_objections
       │         ├─ budget → military check → graceful exit
       │         ├─ need to think → one followup → cold
       │         ├─ wrong day → alternate slots → close or exit
       │         └─ hard no → LOST
       └─ no response → 02_no_response_followup
            ├─ Day 2 → Day 4 → Day 7 → COLD
            └─ responds at any point → resume from last stage

ENROLLED STUDENT
  ├─ teacher callout → 08_teacher_callout
  ├─ complaint → 09_complaint → escalate if serious
  ├─ payment issue → 11_payment → escalate to ZIRO_INVOICE
  ├─ cancellation → 07_cancellation → save attempt → graceful exit
  ├─ teacher change → 14_teacher_change → meet and greet
  ├─ at-risk (ZIRO_RETENTION) → 15_retention_checkin → Stage 2→3→4→human
  ├─ milestone (30d/90d/1yr) → 15_retention_checkin (proactive)
  └─ review request → 10_review_request (30+ days, high engagement)

COLD / PAST STUDENT
  └─ 12_cold_reactivation (seasonal: back to school / new year / summer)
       ├─ responds → resume from 03_pricing
       └─ no response / hard no → LOST
```

---

## Objection Quick Reference

| Objection | Script | Response Type |
|---|---|---|
| Too expensive | 06 | Military check → graceful exit |
| Need to think | 06 | One followup → cold |
| Finishing another activity | 06 | Graceful exit + seasonal re-engage |
| Wrong day/time | 06 | Check ZIRO_SCHEDULE alternates → offer or waitlist |
| Too young | 06 | Age guidance → meet and greet |
| Signed up elsewhere | 06 | Graceful exit only |
| No guitar/gear | 13 | Gear recommendation → pivot to scheduling |
| Bi-weekly request | 06 | Weekly policy explanation → pivot to scheduling |
| Hard no | 06 | Mark lost → stop all outreach |

---

## ZIRO_MESSAGING Decision Rules

1. **Never send a message with an unresolved variable** — escalate to human review
2. **Never improvise tone** — always use the closest script and adapt variables
3. **Never make billing decisions** — escalate to ZIRO_INVOICE
4. **Never make teacher decisions** — escalate to human
5. **Hard no = stop immediately** — mark lost, no more messages
6. **Serious complaints = escalate immediately** — ZIRO_MESSAGING holds, human takes over
7. **One save attempt on cancellation** — never push twice
8. **Three follow-up attempts max** — Day 2, Day 4, Day 7, then cold
9. **Registration link on yes** — send immediately, no extra questions
10. **Military check before every price quote** — every time

---

## Framework IDs (for ziro_messaging_knowledge_base lookup) [table dropped 2026-06-10 — see migration 023; this DB lookup no longer exists]

```
lead_opener
followup_day2
followup_day4
followup_day7
pricing_delivery
scheduling_offer
enrollment_close
objection_handling
cancellation_tree
teacher_callout
complaint_handling
review_request
payment_overdue
cold_reactivation
instrument_guidance
teacher_change
retention_checkin
cancellation_save
billing_reminder
```
