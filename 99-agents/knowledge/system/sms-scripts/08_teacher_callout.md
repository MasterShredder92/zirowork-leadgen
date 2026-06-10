# ROUTING HEADER
# What this file does: Defines one Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging message script or scenario reference for 08_teacher_callout.md.
# Depends on: docs/ZIRO_MESSAGING_SCRIPTS_INDEX.md, Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging customer communication policy
# Do NOT load when working here: agents/, scripts/, tests/, database schemas, secrets, deployment configs unless explicitly approved
# Owning agent: ZiroWork documentation system
# Files that depend on THIS file: Documentation readers and scoped proposal workflows; exact importers not verified under locked read scope

# Script 08 — Teacher Call-In Handling

**Trigger:** Teacher calls in sick / unavailable for a session
**Agent:** ZIRO_MESSAGING (outbound) — after ZIRO_STAFF identifies sub coverage
**Framework ID:** `teacher_callout`
**Goal:** Notify family fast, confirm cancellation, and state invoice adjustment.

---

## Standard Teacher Call-In — With Sub Available

```
Hi {first_name}! This is {director_name}. Your teacher is under the weather today, but we found a great substitute named {sub_name} to cover your lesson at {lesson_time}! We'll see you then.
```

**Rule:** Never use the absent teacher's name in the message. "Your teacher" only. Always include the sub's first name.

---

## Standard Teacher Call-In — No Sub Available (The Andrea Standard)

```
Hi {first_name}! This is {director_name}. Your teacher is under the weather today, so we have to cancel your lesson for this afternoon and your invoice has been adjusted to reflect this cancellation. We'll see you at your normal time next week!
```

---

## Teacher Permanently Leaving (Human Only)
**Rule:** ZIRO_STAFF and ZIRO_MESSAGING are strictly prohibited from automated messaging when a teacher is leaving permanently. 
**Action:** ZIRO_STAFF must immediately alert Andrea/Zach to handle the transition personally. No automated "meet and greet" offers or departure notices are allowed.

---

## Rules

- Never use the absent teacher's name — "your teacher" only.
- Never use the word "pause" for teacher call-ins — use "cancel."
- Always explicitly state: "your invoice has been adjusted to reflect this cancellation."
- Never offer to reschedule for a teacher call-in.
- One exclamation point max.
- Use proper punctuation (periods/question marks).
