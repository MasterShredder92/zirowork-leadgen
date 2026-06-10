# ROUTING HEADER
# What this file does: Defines one Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging message script or scenario reference for 03_pricing.md.
# Depends on: docs/ZIRO_MESSAGING_SCRIPTS_INDEX.md, Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging customer communication policy
# Do NOT load when working here: agents/, scripts/, tests/, database schemas, secrets, deployment configs unless explicitly approved
# Owning agent: ZiroWork documentation system
# Files that depend on THIS file: Documentation readers and scoped proposal workflows; exact importers not verified under locked read scope

# Script 03 — Pricing Delivery

**Trigger:** Lead asks about price, or ZIRO_MESSAGING is ready to deliver pricing after opener
**Agent:** ZIRO_MESSAGING (outbound)
**Framework ID:** `pricing_delivery`
**Goal:** State price clearly, no apology, immediately pivot to scheduling.

---

## Military Check (Always Ask First)

Before quoting price, always ask (unless the form already says NO):

```
Are you or anyone in your household military or a veteran? 🙂
```

**Why:** Military discount ($160 vs $180) creates a personalized moment and often converts hesitant leads. 

**Exception:** Skip if lead has already mentioned they are not military, or if the inquiry explicitly states civilian.

---

## Standard Pricing (Non-Military)

```
The way lessons work is: you get one 30 minute session every week, on the same day and time. We offer flat-rate pricing at $180/month. No long-term contracts; just month to month!

Invoices go out the 1st of every month and are due by your first session of the month. When there's a 5th week in the month, those are your built-in makeup sessions or free lessons, on us, if no makeups are needed! 😊

What day of the week works best for you?
```

---

## Military Pricing

```
The way lessons work is: you get one 30 minute session every week, on the same day and time. We offer flat-rate pricing at $160/month for our military families. No long-term contracts; just month to month!

Invoices go out the 1st of every month and are due by your first session of the month. When there's a 5th week in the month, those are your built-in makeup sessions or free lessons, on us, if no makeups are needed! 😊

What day of the week works best for you?
```

---

## Multi-Student / Multi-Session Pricing

**Use for 2-3 students or 2-3 sessions per week:**
```
For families with 2-3 students or sessions, we offer a discounted flat-rate of $160/month per student. No long-term contracts; just month to month!

What day works best for your family? 😊
```

**Use for 4 or more students or sessions per week:**
```
For families with 4 or more students or sessions, we offer our highest discount at $150/month per student. No long-term contracts; just month to month!

What day works best for your family? 😊
```

---

## Short Pricing Answer (Lead just asked "how much?")

```
Lessons are $180/month. That's four 30-minute sessions, one per week. No contracts, month to month. What day works best for you? 😊
```

**Use when:** Lead's only question was price and they haven't asked for more detail.

---

## Rules

- Always pivot to scheduling after quoting price; never end on price.
- Never apologize for the price.
- Always mention no long-term contracts.
- Always mention the 5th-week policy.
- Military check before quoting; every time (unless form says NO).
- One exclamation point max.
- Use proper punctuation (commas, colons, semicolons). No dashes.
- Use "lessons" to introduce the concept, but "sessions" to define the weekly commitment and billing.
