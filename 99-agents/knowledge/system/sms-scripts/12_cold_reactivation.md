# ROUTING HEADER
# What this file does: Defines one Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging message script or scenario reference for 12_cold_reactivation.md.
# Depends on: docs/ZIRO_MESSAGING_SCRIPTS_INDEX.md, Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging customer communication policy
# Do NOT load when working here: agents/, scripts/, tests/, database schemas, secrets, deployment configs unless explicitly approved
# Owning agent: ZiroWork documentation system
# Files that depend on THIS file: Documentation readers and scoped proposal workflows; exact importers not verified under locked read scope

# Script 12 — Cold Reactivation

**Trigger:** Past student (cancelled 60+ days ago) or cold lead (no response 30+ days)
**Agent:** ZIRO_MESSAGING (outbound) — triggered by ZIRO_RETENTION or ANCHOR seasonal job
**Framework ID:** `cold_reactivation`
**Goal:** Re-open the door without pressure. One message. Warm, brief, no guilt.

---

## Past Student — Seasonal Re-Engage

```
Hi {first_name}! This is {director_name} from {location_name}. I know it's been a while, but we're scheduling for {season} and thought of {student_name}. We'd love to have them back! Is {instrument} still something they're interested in? 😊
```

---

## Past Student — General Re-Engage

```
Hi {first_name}! {director_name} here from {location_name}. Just wanted to check in and see how {student_name} is doing! We'd love to have them back whenever the timing is right. 😊
```

---

## Cold Lead — Seasonal Re-Engage

```
Hi {first_name}! This is {director_name} from {location_name}. I know we chatted a while back about {instrument} lessons — just wanted to reach out as we're scheduling for {season}. Would you still be interested? 😊
```

---

## Cold Lead — General Re-Engage

```
Hi {first_name}! {director_name} here from {location_name}. Just wanted to reach back out — we'd love to help you get started with {instrument} lessons whenever you're ready! 😊
```

---

## Back to School Re-Engage (August)

```
Hi {first_name}! Back to school season is here — a great time to add music lessons to the routine! We'd love to get {student_name} back on the schedule. Interested? 😊
```

---

## New Year Re-Engage (January)

```
Hi {first_name}! Happy New Year! If music lessons are on the list for {year}, we'd love to help. We're scheduling now — want to grab a spot? 😊
```

---

## Summer Re-Engage (May/June)

```
Hi {first_name}! Summer is a great time for music lessons — more free time, more progress! We'd love to get {student_name} back on the schedule. Interested? 😊
```

---

## Branch Logic

```
reactivation_message_sent
  → responds_yes → resume_from_pricing (03_pricing.md)
  → responds_not_now → graceful_exit: "No worries! We're here whenever you're ready 😊"
  → no_response → no_followup (one reactivation attempt per season only)
  → hard_no → mark_lost → stop_all_outreach
```

---

## Rules

- One reactivation message per season (back to school, new year, summer)
- Never guilt-trip: "We haven't heard from you in a while" is banned
- Never mention how long they've been gone
- If they respond positively, immediately resume from pricing — don't restart the opener
- If they say no or don't respond, do not send another message until next season
- Hard no = mark lost, stop all outreach permanently
