# ROUTING HEADER
# What this file does: Defines one Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging message script or scenario reference for 07_cancellation.md.
# Depends on: docs/ZIRO_MESSAGING_SCRIPTS_INDEX.md, Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging customer communication policy
# Do NOT load when working here: agents/, scripts/, tests/, database schemas, secrets, deployment configs unless explicitly approved
# Owning agent: ZiroWork documentation system
# Files that depend on THIS file: Documentation readers and scoped proposal workflows; exact importers not verified under locked read scope

# Script 07 — Cancellation Handling

**Trigger:** Active student notifies of cancellation or requests to stop lessons
**Agent:** ZIRO_MESSAGING (outbound)
**Framework ID:** `cancellation_tree`
**Goal:** Acknowledge warmly, attempt a soft save, exit gracefully if they're firm. Keep the door open always.

---

## Initial Cancellation Receipt

**Lead/student says:** "We need to cancel," "We're going to stop lessons," "We won't be continuing"

**Response:**
```
Oh no! We're so sorry to hear that — we've really loved having {first_name} with us. Is there anything we could do to make it work? 😊
```

**Rule:** One soft save attempt only. If they say no, go straight to graceful exit. Never push twice.

---

## Save Attempt — Schedule Conflict

**If reason is schedule:**
```
We totally understand! Would a different day or time work better? We might be able to find something that fits your schedule. 😊
```

---

## Save Attempt — Budget

**If reason is budget:**
```
We completely understand. Is anyone in your household military or a veteran? We do offer a discounted rate that might help! 😊
```

---

## Save Attempt — Teacher Issue

**If reason is teacher-related:**
```
We're so sorry to hear that! We'd love to find a better fit — would you be open to trying a different teacher? 😊
```

---

## Save Attempt — Taking a Break

**If reason is "taking a break" / "too busy":**
```
Of course! We completely understand. We'll keep your spot in mind — reach out whenever you're ready to come back! 😊
```

---

## Graceful Exit (After Save Attempt Fails or No Save Needed)

```
We completely understand and will miss {first_name}! Please take care, and reach out anytime you'd like to start back up — we'd love to have you! 😊
```

---

## Graceful Exit — Financial Hardship

```
We completely understand and are so sorry to hear that. Please take care, and we're here whenever things turn around. We'd love to have you back! 😊
```

---

## Pause Request (Student wants to pause, not fully cancel)

**Response:**
```
Of course! I'll put {first_name} on pause. Just reach out when you're ready to come back and we'll get you right back on the schedule! 😊
```

**Action:** Mark student as `paused`, do not cancel billing until confirmed. Flag for human review if billing is active.

---

## Cancellation Mid-Month (Billing Question)

**If student asks about invoice after cancelling:**
```
No worries at all! I'll take care of that for you — you won't owe anything for lessons you haven't attended. 😊
```

**Rule:** ZIRO_MESSAGING does not make billing decisions. This response is a holding message — escalate to ZIRO_INVOICE/human for actual invoice adjustment.

---

## 2-Week Notice Policy (When Applicable)

**If studio policy requires 2-week notice:**
```
We do ask for 2 weeks' notice before stopping lessons — just so we can plan accordingly. That means {first_name}'s last lesson would be {last_lesson_date}. Does that work? 😊
```

**Rule:** Only invoke this if the student signed an agreement with this policy. Do not enforce it on students who were never informed.

---

## Re-Engage After Cancellation (Seasonal / Proactive)

```
Hi {first_name}! This is {director_name} from {location_name}. We're scheduling for {season} and thought of you — would {first_name} be interested in coming back? We'd love to have them! 😊
```

**Timing:** Fire 60-90 days after cancellation, or at the start of a new season.

---

## Branch Logic

```
cancellation_received
  → soft_save_attempt (one time only)
    → save_successful → resume enrollment, update status
    → save_failed → graceful_exit → mark_cancelled → schedule_reactivation_check (60 days)
  → pause_request → mark_paused → schedule_reactivation_check (30 days)
  → billing_question → holding_message → escalate_to_operator
  → re_engage_fired → if_responds → resume_from_pricing
```

---

## Rules

- One save attempt only — never push twice
- Never guilt-trip: "We'll miss you so much, are you sure?" is too much
- Always keep the door open — "we're here whenever you're ready" is the exit line
- Never make billing decisions in ZIRO_MESSAGING — escalate to ZIRO_INVOICE
- Graceful exit is the default — warm, no pressure, no guilt
- After cancellation, schedule a re-engage check for 60 days out
