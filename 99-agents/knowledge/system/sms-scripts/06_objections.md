# ROUTING HEADER
# What this file does: Defines one Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging message script or scenario reference for 06_objections.md.
# Depends on: docs/ZIRO_MESSAGING_SCRIPTS_INDEX.md, Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging customer communication policy
# Do NOT load when working here: agents/, scripts/, tests/, database schemas, secrets, deployment configs unless explicitly approved
# Owning agent: ZiroWork documentation system
# Files that depend on THIS file: Documentation readers and scoped proposal workflows; exact importers not verified under locked read scope

# Script 06 — Objection Handling

**Trigger:** Lead raises an objection at any point in the conversation
**Agent:** ZIRO_MESSAGING (outbound)
**Framework ID:** `objection_handling`
**Goal:** Acknowledge, address, and re-engage — never argue, never pressure.

---

## Objection 1 — Budget / "Too Expensive"

**Lead says:** "That's out of our budget," "I can't afford that," "That's too much," "$160 is too expensive"

**Response A — Military check (if not yet asked):**
```
I completely understand! Before I let you go — is anyone in your household military or a veteran? We do offer a discounted rate for military families. 🙂
```

**Response B — After military check, still too expensive:**
```
We completely understand! We hope you find the perfect fit for your family, and we wish you nothing but the best on your music journey! 😊
```

**Response C — Hardship (current student):**
```
We completely understand and are so sorry to hear that. Please take care, and reach out anytime you're ready to come back — we'd love to have you! 😊
```

**Rule:** Never negotiate price below the military rate. Never offer payment plans unless Zach has explicitly authorized one. Keep the door open — budget situations change.

---

## Objection 2 — "Need to Think About It" / "I'll Get Back to You"

**Lead says:** "Let me think about it," "I need to talk to my husband/wife," "I'll get back to you"

**Response:**
```
Of course! Take your time. Feel free to reach out with any questions — I'm happy to help! 😊
```

**Follow-up if no response in 48h:**
```
Hi {first_name}! Just wanted to check in and see if you had any more questions. We'd love to get you started! 😊
```

**Rule:** One follow-up only after "need to think." If still no response, go to 02_no_response_followup.md Day 4 path.

---

## Objection 3 — "Finishing Another Activity First"

**Lead says:** "We have baseball until June," "We're finishing swim season," "Too busy right now"

**Response:**
```
That makes total sense! Reach out whenever you're ready — we'd love to have you when the timing is right. 😊
```

**Proactive re-engage (when their activity season ends):**
```
Hi {first_name}! {director_name} here from {location_name}. Just wanted to reach out now that {season} is winding down — are you still interested in {instrument} lessons? We'd love to get you started! 😊
```

---

## Objection 4 — "Wrong Day / Time Doesn't Work"

**Lead says:** "I can't do Tuesdays," "That time doesn't work," "Do you have anything on weekends?"

**Response:**
```
No problem! Let me check what else I have available. What days generally work best for you? 😊
```

**After checking ZIRO_SCHEDULE:**
```
I also have a {alt_day} at {alt_time} available — would that work? 😊
```

**If nothing works:**
```
I don't have anything that matches your schedule right now, but I'd love to keep you in mind if something opens up. Can I reach out if a {preferred_day} slot becomes available? 😊
```

---

## Objection 5 — "Too Young / Not Ready"

**Lead says:** "She's only 3," "I don't think he's ready," "Maybe when she's older"

**Response:**
```
Totally understand! We generally start students at age 4-5, so whenever you feel ready, we'd love to have them. Reach out anytime! 😊
```

**If child is 4-5:**
```
We actually start as early as 4! At that age we keep it fun and exploratory — no pressure, just building a love of music. Would you like to come in for a meet and greet to see if it's a good fit? 😊
```

---

## Objection 6 — "We Already Signed Up Somewhere Else"

**Response:**
```
Congrats! We hope you love it. We're here if you ever need us! 😊
```

**Rule:** No counter-pitch. No asking why. Graceful exit only.

---

## Objection 7 — "Do You Have a Guitar / Do We Need to Buy One?"

**Response — No guitar yet:**
```
We have one at the studio for use during lessons, but you'd need one at home to practice. For beginners, we recommend a Fender or Ibanez acoustic, or a Squier Mini electric — both are great starter options. Dietze Music is a great local resource too! 😊
```

**Response — Has a guitar:**
```
Great, you're all set! We'll get started with what you have. 😊
```

---

## Objection 8 — "Do You Offer Trials / Free Lessons?"

**Response (if no trial offered):**
```
We don't offer free trials, but we are month-to-month with no contracts — so there's no risk. If it's not the right fit after the first month, you can stop anytime! 😊
```

**Response (if meet and greet is available):**
```
We don't do free lessons, but we do offer a free meet and greet where you can see the studio, meet a teacher, and ask any questions before committing. Would you like to set one up? 😊
```

---

## Objection 9 — "Can We Do Every Other Week?" / "Bi-Weekly"

**Response:**
```
Our lessons are set up as weekly — same day and time every week. That consistency is what makes the biggest difference in progress! Most students find the weekly rhythm works really well. What day would work best for you? 😊
```

---

## Objection 10 — Hard No / "Not Interested"

**Lead says:** "No thanks," "Not interested," "Please stop texting me"

**Response:**
```
Of course! We're sorry to bother you. We wish you all the best! 😊
```

**Action:** Mark lead as `lost`, stop all automated outreach immediately.

---

## Branch Logic

```
objection_received
  → budget → military_check → if still no → graceful_exit
  → need_to_think → one_followup_48h → if still no → cold
  → finishing_activity → graceful_exit + seasonal_reengage_scheduled
  → wrong_day → check_ziro_schedule_alternates → offer_alternates → if nothing → waitlist_offer
  → too_young → age_guidance → meet_and_greet_offer
  → signed_elsewhere → graceful_exit
  → hard_no → mark_lost → stop_all_outreach
```

---

## Rules

- Never argue with an objection — acknowledge and pivot or exit gracefully
- Never mention price again after a hard "too expensive" — graceful exit only
- Never guilt-trip on cancellation or objection
- "We're here whenever you're ready" is the universal graceful exit line — use it
- Hard no = stop immediately, mark lost, no more messages
