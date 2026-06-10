# ROUTING HEADER
# What this file does: Defines one Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging message script or scenario reference for 15_retention_checkin.md.
# Depends on: docs/ZIRO_MESSAGING_SCRIPTS_INDEX.md, Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging customer communication policy
# Do NOT load when working here: agents/, scripts/, tests/, database schemas, secrets, deployment configs unless explicitly approved
# Owning agent: ZiroWork documentation system
# Files that depend on THIS file: Documentation readers and scoped proposal workflows; exact importers not verified under locked read scope

# Script 15 — Retention & Milestone Check-ins

**Trigger:** ZIRO_RETENTION detects a red flag or a milestone (3, 6, 9, 12 months)
**Agent:** ZIRO_MESSAGING (outbound)
**Framework ID:** `retention_checkin`
**Goal:** Maintain high-touch engagement and catch churn risks early.

---

## The "Temperature Check" (Risk-Based)

**Use when:** Student has missed 2+ sessions in a month or is changing their schedule frequently.
```
Hey! I was doing student check-ins this week and wanted to see how {student_name} was doing and how lessons were going for him!
```

---

## Rotating Milestone Check-ins

### 3-Month Mark (The "Getting Settled" Check)
```
Hello! Just wanted to do a quick check in and see how lessons are going! {student_name} has been with us for 3 months now and we have loved having them. Anything I can help with? :)
```

### 6-Month Mark (The "Progress" Check)
```
Hi! It's been 6 months since {student_name} started with us and we are so proud of how far they've come! I wanted to reach out and see if you're happy with their progress or if there's anything new they're excited to learn?
```

### 9-Month Mark (The "Long-Term" Check)
```
Hey there! I was just looking at the schedule and realized {student_name} has been part of the family for 9 months now! We love having you guys here. Is there anything we can do to make their sessions even better?
```

### 12-Month Mark (The "Anniversary" Celebration)
```
Happy 1-year Anniversary with Adkins Music Lessons! 🎉 We are so honored that you've chosen us for {student_name}'s musical journey this past year. We can't wait to see what they accomplish in year two!
```

---

## Rules

- Always use the student's name.
- Use proper punctuation; one exclamation point max.
- If a personal fact is known (via ZIRO_CLIENT), always try to include it.
- Never mention "retention" or "churn" — these are "support" messages.
- Use "sessions" instead of "lessons."
