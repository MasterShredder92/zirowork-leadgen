# ROUTING HEADER
# What this file does: Defines one Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging message script or scenario reference for 10_review_request.md.
# Depends on: docs/ZIRO_MESSAGING_SCRIPTS_INDEX.md, Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging customer communication policy
# Do NOT load when working here: agents/, scripts/, tests/, database schemas, secrets, deployment configs unless explicitly approved
# Owning agent: ZiroWork documentation system
# Files that depend on THIS file: Documentation readers and scoped proposal workflows; exact importers not verified under locked read scope

# Script 10 — Review Request

**Trigger:** Student has been enrolled 30+ days, no complaints on record, high engagement
**Agent:** ZIRO_MESSAGING (outbound)
**Framework ID:** `review_request`
**Goal:** Get a Google review. Direct link. One ask. No pressure.

---

## Primary Review Request

```
Hi {first_name}! We hope {student_name} is loving lessons! If you've had a great experience, we'd be so grateful for a Google review — it means the world to us! 😊
{google_review_link}
```

---

## Zach Voice Variant

```
Hey {first_name}! Hope things are going great. If you've been happy with lessons, would you mind leaving us a quick Google review? It really helps us out! 😊
{google_review_link}
```

---

## After a Particularly Good Moment (Recital, Milestone, Compliment)

```
Hi {first_name}! So glad to hear {student_name} is doing so well! If you've had a great experience with us, we'd love it if you could share it on Google — it really helps other families find us! 😊
{google_review_link}
```

**Use when:** Student/parent has just expressed enthusiasm, mentioned a milestone, or given a compliment in the conversation.

---

## Rules

- Only ask for reviews from students who have been enrolled 30+ days
- Only ask if there are no open complaints or billing issues on the account
- One ask only — never follow up on a review request
- Direct link only — no elaborate ask, no explanation of how to leave a review
- Never ask for a "5-ziro-leads review" explicitly — just "a review" or "share your experience"
- The best time to ask is right after a positive moment in the conversation
- Do not automate this for every student — ZIRO_RETENTION should flag high-engagement students for ZIRO_MESSAGING to ask

---

## Branch Logic

```
review_request_sent
  → student_leaves_review → log_positive_feedback → no_further_action
  → student_says_will_do_it → no_followup_needed
  → student_ignores → no_followup (one ask only)
  → student_expresses_concern_instead → go_to_09_complaint.md
```
