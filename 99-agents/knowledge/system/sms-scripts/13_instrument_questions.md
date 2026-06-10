# ROUTING HEADER
# What this file does: Defines one Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging message script or scenario reference for 13_instrument_questions.md.
# Depends on: docs/ZIRO_MESSAGING_SCRIPTS_INDEX.md, Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging customer communication policy
# Do NOT load when working here: agents/, scripts/, tests/, database schemas, secrets, deployment configs unless explicitly approved
# Owning agent: ZiroWork documentation system
# Files that depend on THIS file: Documentation readers and scoped proposal workflows; exact importers not verified under locked read scope

# Script 13 — Instrument and Gear Questions

**Trigger:** Lead/student asks about what instrument to start with, what gear to buy, or age recommendations
**Agent:** ZIRO_MESSAGING (outbound)
**Framework ID:** `instrument_guidance`
**Goal:** Give a real, confident recommendation. Sound like Zach — a guitarist who knows gear.

---

## "What Instrument Should My Child Start With?"

```
Great question! For younger kids (4-7), piano or ukulele are fantastic starting points — they build a great musical foundation. Guitar is also great from age 6+. Ultimately, the best instrument is the one they're excited about! What are they drawn to? 😊
```

---

## "What Age Can They Start?"

```
We start as young as 4! At that age we keep it fun and exploratory — no pressure, just building a love of music. Most kids really take off around 6-7. How old is your child? 😊
```

---

## "Do We Need to Buy a Guitar?"

**No guitar yet:**
```
We have guitars at the studio for use during lessons, but you'll want one at home for practice. For beginners, we recommend a Fender or Ibanez acoustic, or a Squier Mini electric — both are great starter options. Dietze Music in Omaha is a great local resource too! 😊
```

**Has a guitar:**
```
Great, you're all set! We'll get started with what you have. 😊
```

---

## "What Kind of Guitar Should I Get?"

**Acoustic beginner:**
```
For acoustic, I'd go with a Fender CD-60S or a Yamaha FG800 — both are solid beginner guitars under $200. Avoid anything under $100 — they're usually harder to play and kill motivation fast. 😊
```

**Electric beginner:**
```
For electric, the Squier Stratocaster starter pack is hard to beat — comes with everything you need under $250. If you want to step it up a little, the Squier Classic Vibe series is excellent. 😊
```

**Zach voice variant:**
```
Honestly, I'm a little biased toward guitar 😂 — but for a beginner I'd go with a Squier Strat or a Yamaha acoustic. Both are solid, affordable, and won't fight you while you're learning. Dietze Music can set you up locally too!
```

---

## "What About Piano / Keyboard?"

```
For beginners, a weighted 61-key keyboard is perfect — you don't need a full 88-key piano to start. The Yamaha P-45 or Roland FP-30 are both excellent options. A stand and sustain pedal are the only accessories you need! 😊
```

---

## "What About Drums?"

```
For home practice, an electronic drum kit is the way to go — much quieter and still great for learning. The Roland TD-1K or Alesis Nitro Mesh are both solid starter kits. We teach on acoustic drums at the studio! 😊
```

---

## "Do You Teach Adults?"

```
Absolutely! We teach all ages — from 4 to 80+. Adults actually learn really fast because they're motivated and focused. It's never too late to start! 😊
```

---

## "Can Adults Learn Guitar?"

**Zach voice:**
```
100% yes. I've taught adults who had never touched a guitar and watched them play their first song in a month. The biggest thing is just getting started. What style are you into? 😊
```

---

## "What Styles Do You Teach?"

```
We teach all styles — rock, pop, classical, country, blues, jazz, you name it. We match you with a teacher based on your goals and what you want to play. What are you into? 😊
```

---

## Branch Logic

```
instrument_question_received
  → what_instrument_for_child → age_based_recommendation → pivot_to_scheduling
  → what_age_to_start → age_guidance → if_old_enough → pivot_to_scheduling
  → gear_question → gear_recommendation → pivot_to_scheduling
  → adult_question → adult_affirmation → pivot_to_scheduling
  → style_question → style_confirmation → pivot_to_scheduling
```

---

## Rules

- Always give a real recommendation — not "it depends" without a follow-up
- Mention Dietze Music for local gear (they're a trusted local resource)
- Never recommend cheap instruments under $100 — they hurt the learning experience
- Always pivot back to scheduling after answering gear/instrument questions
- Zach voice is appropriate for adult guitar leads — peer-to-peer
