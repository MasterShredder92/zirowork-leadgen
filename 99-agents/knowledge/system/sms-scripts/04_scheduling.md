# ROUTING HEADER
# What this file does: Defines one Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging message script or scenario reference for 04_scheduling.md.
# Depends on: docs/ZIRO_MESSAGING_SCRIPTS_INDEX.md, Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging customer communication policy
# Do NOT load when working here: agents/, scripts/, tests/, database schemas, secrets, deployment configs unless explicitly approved
# Owning agent: ZiroWork documentation system
# Files that depend on THIS file: Documentation readers and scoped proposal workflows; exact importers not verified under locked read scope

# Script 04 — Scheduling and Slot Offer

**Trigger:** Lead has agreed to pricing or asked about availability
**Agent:** ZIRO_MESSAGING (outbound) + ZIRO_SCHEDULE (availability lookup)
**Framework ID:** `scheduling_offer`
**Goal:** Offer specific slots, create urgency, get them to commit to a time.

---

## Standard Slot Offer (1-2 Options)

```
I have a {day} at {time} available — would that work for you? 😊
```

**Rule:** Always offer 1-2 specific slots, never a full menu. The data shows that offering too many options creates decision paralysis and delays enrollment.

---

## Slot Offer with Urgency

```
We are filling up pretty fast, but I do have a {day} at {time} available right now. Would that work for you? 😊
```

**Use when:** ZIRO_SCHEDULE confirms limited availability on the lead's preferred day.

---

## Slot Offer — Multiple Days Available

```
I have a {day1} at {time1} and a {day2} at {time2} available. Would either of those work? 😊
```

**Use when:** Lead hasn't specified a preferred day. Offer two options max.

---

## Lead Gives Preferred Day — Confirm Availability

```
{day} works great! I have a {time} available — does that work for you? 😊
```

---

## Lead Gives Multiple Day Options

```
I know I threw a lot at you, but would any of those times work for you? 😊
```

**Use after listing multiple slots when lead gave broad availability.**

---

## No Availability on Preferred Day

```
I don't have anything on {preferred_day} right now, but I do have a {alt_day} at {alt_time} available. Would that work? 😊
```

---

## Slot Urgency — Slot About to Be Taken

```
Just a heads up — that {day} at {time} slot is going fast. Want me to hold it for you? Just fill out the registration form and it's yours! 😊
{registration_link}
```

---

## Hours Info (When Asked)

```
Our hours are:
Mon–Thu: 3:30pm–9pm
Sat–Sun: 10am–3pm
Closed Fridays

We're filling up, so I'd love to lock in your spot! What day works best? 😊
```

---

## Lead Asks About Teacher

```
All of our teachers are trained professionals — we'll match you with the best fit based on your goals and schedule. Once you're registered, I'll introduce you! 😊
```

**Rule:** Never promise a specific teacher in the scheduling phase. Teachers change. Match on fit, not name.

---

## Meet and Greet Offer

```
Absolutely — we love doing meet and greets! Is there a day this week that would work for you to stop by? We're open Mon–Thu 3:30–9pm and Sat–Sun 10am–3pm. 😊
```

**Use when:** Lead asks to visit the studio before committing.

---

## Branch Logic

```
slot_offered
  → lead_accepts_slot → go to 05_enrollment_close.md (send reg form)
  → lead_asks_for_different_day → check ZIRO_SCHEDULE, offer alternate
  → lead_says_not_sure_yet → "No worries! I'll hold this in mind. What day works best in general?" → keep conversation going
  → lead_asks_about_teacher → use teacher response above, pivot back to scheduling
  → lead_goes_silent → go to 02_no_response_followup.md
  → lead_asks_for_meet_and_greet → use meet and greet offer
```

---

## Rules

- Always offer specific slots — never "we have availability, what works for you?" without a concrete offer
- 1-2 options max in a single message
- Never mention teacher names in outbound scheduling messages
- If ZIRO_SCHEDULE returns no availability, escalate to human review — do not make up slots
- Always end with a question or a clear next step
