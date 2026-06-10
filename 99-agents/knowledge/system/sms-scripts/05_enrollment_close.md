# ROUTING HEADER
# What this file does: Defines one Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging message script or scenario reference for 05_enrollment_close.md.
# Depends on: docs/ZIRO_MESSAGING_SCRIPTS_INDEX.md, Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging customer communication policy
# Do NOT load when working here: agents/, scripts/, tests/, database schemas, secrets, deployment configs unless explicitly approved
# Owning agent: ZiroWork documentation system
# Files that depend on THIS file: Documentation readers and scoped proposal workflows; exact importers not verified under locked read scope

# Script 05 — Enrollment Close

**Trigger:** Lead has agreed to a slot or said any version of "yes"
**Agent:** ZIRO_MESSAGING (outbound)
**Framework ID:** `enrollment_close`
**Goal:** Send the registration form immediately. Do not ask more questions. Close the loop.

---

## Registration Form Send (Primary — Send Immediately on Yes)

```
Please fill out our registration form to lock in your time! Welcome aboard! 😀
{registration_link}
```

**Rule:** The moment they agree to a slot — send this. No extra questions. No more explanation. The link is the close.

---

## Registration Form Send — With Slot Confirmation

```
You got it! Please fill out our registration form to lock in your {day} at {time} spot. Be sure to hit Submit when finished. Welcome aboard! 😀
{registration_link}
```

---

## Form Received Confirmation

```
Form received, thank you! We'll see you {start_date} at {time}. We'll be in touch before then. 👍
```

---

## Welcome to the Studio (After Form Received)

```
Welcome to {location_name}! 🙂 We're so excited to have you. See you {start_date}!
```

---

## Assume the Sale Close (When Lead is Warm but Hasn't Explicitly Said Yes)

```
Are you ready to get started? I can lock in your {day} at {time} right now — just fill out the form below! 😊
{registration_link}
```

**Use when:** Lead has been engaged, pricing is clear, scheduling is agreed, but they haven't explicitly said "yes." Assume the sale. Send the link.

---

## Close After Promo

```
Great news — if you register by {promo_deadline}, you get {promo_benefit}! Here's the form to lock in your spot:
{registration_link}
```

---

## Close for Returning Student (Re-enrollment)

```
Welcome back! So glad to have you again. Here's the registration form to get you back on the schedule:
{registration_link}
```

---

## Close — Parent Enrolling Child

```
Wonderful! Please fill out the registration form for {child_name} to lock in the {day} at {time} spot. Welcome to {location_name}! 😊
{registration_link}
```

---

## Branch Logic

```
registration_link_sent
  → form_received → send form_received confirmation + welcome message
  → no form after 24h → "Hi {first_name}! Just wanted to check — did you get a chance to fill out the registration form? Here it is again: {registration_link} 😊"
  → no form after 48h → "Hi {first_name}! Just a quick reminder — your {day} at {time} spot is still reserved. Fill out the form to lock it in! {registration_link}"
  → lead_says_not_ready → go to 06_objections.md (need_to_think path)
  → lead_cancels_before_first_session → go to 07_cancellation.md
```

---

## Rules

- Send the registration link the moment they agree — no delay, no extra questions
- Never ask "are you sure?" or add friction to the close
- Form received confirmation must go out within minutes of form submission (automated)
- Never promise a specific teacher in the close message
- The welcome message is warm but brief — they're in, they know it, don't over-celebrate
