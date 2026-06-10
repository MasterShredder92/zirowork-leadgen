# ROUTING HEADER
# What this file does: Defines one Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging message script or scenario reference for 02_no_response_followup.md.
# Depends on: docs/ZIRO_MESSAGING_SCRIPTS_INDEX.md, Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging customer communication policy
# Do NOT load when working here: agents/, scripts/, tests/, database schemas, secrets, deployment configs unless explicitly approved
# Owning agent: ZiroWork documentation system
# Files that depend on THIS file: Documentation readers and scoped proposal workflows; exact importers not verified under locked read scope

# Script 02 — No Response Follow-Up Sequence

**Trigger:** Lead has not responded to opener after 24h / 48h / 72h
**Agent:** ZIRO_MESSAGING (outbound drip)
**Framework IDs:** `followup_day2`, `followup_day4`, `followup_day7`
**Goal:** Re-engage without pressure. Keep the door open. Never guilt-trip.

---

## Day 2 Follow-Up (24-48h after opener, no response)

```
Hi {first_name}! Just wanted to check in and see if you had any questions about {instrument} lessons. We'd love to help! 😊
```

**Tone:** Light. No pressure. Assumes they're just busy.

**Variant — slot urgency:**
```
Hi {first_name}! Just wanted to reach back out — we do have some great {preferred_day} availability right now. Would love to get you going! 😊
```

**Use slot urgency variant when:** ZIRO_SCHEDULE confirms availability on their preferred day.

---

## Day 4 Follow-Up (48-72h after Day 2, still no response)

**Option A — Value add:**
```
Hi {first_name}! This is {director_name} from {location_name} again. Just wanted to share a little more about us — we've been open {years} years across 4 locations in the Omaha area. All of our teachers are trained professionals. Lessons are 1-on-1, 30 minutes, $160/month — no contracts. What day works best for you? 😊
```

**Option B — Promo (if active):**
```
Hi {first_name}! {director_name} here from {location_name}. We're currently running a promotion — {promo_text}. Would love to get you started! What day works best? 😊
```

**Option C — Minimal:**
```
Hi {first_name}, do you have any questions I can answer for you? 🙂
```

**Use Option C when:** Day 2 already included value add. Keep it short.

---

## Day 7 Follow-Up (Final — 5-7 days after Day 4, still no response)

```
Hi {first_name}! {director_name} here from {location_name}. Just wanted to reach out one more time — we'd love to be part of your music journey whenever the timing is right. Feel free to reach out anytime! 😊
```

**Rules for Day 7:**
- This is the last automated message. Do not send more after this.
- No pressure, no urgency, no promo.
- Keep the door open. That's it.
- After Day 7, mark lead as `cold` — human review queue.

---

## Cold Lead Re-Engage (Lead went cold weeks/months ago, came back)

```
Hi {first_name}! {director_name} here from {location_name} — so glad you reached back out! We'd love to get you going. Are you still looking for {instrument} lessons? 😊
```

**Use when:** Lead re-engages after going cold (30+ days since last contact).

---

## Seasonal Re-Engage (Proactive outreach to cold leads)

```
Hi {first_name}! This is {director_name} from {location_name}. I know it's been a while, but I wanted to reach out as we're scheduling for {season}. We'd love to have you! Is {instrument} still something you're interested in? 😊
```

**Use when:** ANCHOR seasonal re-engage job fires (back to school, new year, summer).

---

## Branch Logic

```
followup_sent
  → lead_responds → resume from last known stage (pricing / scheduling / close)
  → no response after Day 7 → mark cold, stop automated outreach
  → "not interested" → go to 06_objections.md (hard_no path)
  → "we signed up somewhere else" → graceful exit: "Congrats! We hope you love it. We're here if you ever need us! 😊"
```

---

## Rules

- Never send more than 3 automated follow-ups (Day 2, Day 4, Day 7)
- Never guilt-trip: "I've tried to reach you several times" is banned
- Never mention the number of times you've reached out
- Day 7 is always the soft close — keep the door open, that's all
- If they respond at any point, immediately resume the conversation — do not send the next scheduled follow-up
