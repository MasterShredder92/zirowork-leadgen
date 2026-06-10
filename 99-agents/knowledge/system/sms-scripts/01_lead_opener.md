# ROUTING HEADER
# What this file does: Defines one Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging message script or scenario reference for 01_lead_opener.md.
# Depends on: docs/ZIRO_MESSAGING_SCRIPTS_INDEX.md, Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging customer communication policy
# Do NOT load when working here: agents/, scripts/, tests/, database schemas, secrets, deployment configs unless explicitly approved
# Owning agent: ZiroWork documentation system
# Files that depend on THIS file: Documentation readers and scoped proposal workflows; exact importers not verified under locked read scope

# Script 01 — Lead Opener

**Trigger:** `new_lead_created`
**Agent:** ZIRO_MESSAGING (outbound)
**Framework ID:** `lead_opener`
**Goal:** Confirm identity, confirm instrument, end with a question. Get a response.

---

## Primary Opener (Adult Lead — Andrea Formula)

```
Hi {first_name}! 👋 This is {director_name}, {title} here at {location_name}!

I would love to get you all of our information to register with us! I see you are looking for {instrument} lessons! Is there a day or time that works best for you? 😊
```

**Use when:** Lead is an adult inquiring for themselves.

---

## Variant — Adult with Experience Detail

```
Hi {first_name}! 👋 This is {director_name}, {title} here at {location_name}!

I would love to get you all of our information to register with us! I see you are looking for {instrument} lessons and {experience_detail}! Is there a day or time that works best for you? 😊
```

**Use when:** The inquiry form includes experience level or specific goals.
**Example experience_detail:** "have some experience and are looking to advance" / "are a complete beginner" / "are looking for weekday mornings"

---

## Variant — Parent Enrolling Child

```
Hi {first_name}! 👋 This is {director_name}, {title} here at {location_name}!

I would love to get you all of our information to register with us! I see you are looking for {instrument} lessons for {child_name}! Is there a day or time that works best for you? 😊
```

**Use when:** Lead is a parent and child's name is known from the inquiry.

---

## Variant — Parent, Child Name Unknown

```
Hi {first_name}! 👋 This is {director_name}, {title} here at {location_name}!

I would love to get you all of our information to register with us! I see you are looking for {instrument} lessons — how old is your child? 😊
```

**Use when:** Lead is a parent but no child name or age was provided.

---

## Variant — Zach Voice (Adult, Peer-to-Peer)

```
Hey {first_name}! This is Zach, owner at {location_name}

Saw you were looking for some {instrument} lessons? 😀
```

**Use when:** Lead is an adult male, inquiry is casual/brief, or Zach is the assigned director.

---

## Variant — Multiple Instruments

```
Hi {first_name}! 👋 This is {director_name}, {title} here at {location_name}!

I would love to get you all of our information to register with us! I see you are looking for {instrument_list} lessons! Is there a day or time that works best for you? 😊
```

**Use when:** Lead checked multiple instruments on the inquiry form.

---

## Variant — Referral Lead

```
Hi {first_name}! 👋 This is {director_name}, {title} here at {location_name}!

I would love to get you all of our information to register with us! I see you are looking for {instrument} lessons and were referred to us — may I ask who referred you? 😊
```

**Use when:** Inquiry source is "referral" or "word of mouth."

---

## Branch Logic

```
opener_sent
  → lead_responds → go to 03_pricing.md or 04_scheduling.md
  → no response 24h → go to 02_no_response_followup.md (Day 2)
  → wrong number / "who is this" → clarify, re-confirm identity
  → "not interested" → go to 06_objections.md (hard_no path)
```

---

## Rules

- Always use first name — never "Hi there" or "Hello"
- Always end with a question — never a statement
- Never mention price in the opener
- Never mention a specific teacher in the opener
- One emoji max
- If instrument is unknown, ask: "What instrument are you looking for?" before anything else
