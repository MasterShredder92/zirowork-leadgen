# How the Agent Gets Better Over Time

The agent learns from what actually works. Here's how that happens and what you do to make it happen faster.

---

## What the Agent Learns From

Every conversation has an outcome. The agent tracks:

| Outcome | What It Means |
|---|---|
| Enrolled | The full sequence worked — first text → questions → booking → sign-up |
| Cold (Day 7) | Lead never responded — opener or follow-up didn't land |
| Lost (said no) | Lead responded but didn't convert — pricing, timing, or fit issue |
| Objection resolved | Lead pushed back but agent got them past it |
| Objection not resolved | Lead pushed back and left |

Over time, patterns emerge. Which opener gets the most replies? Which follow-up brings cold leads back? Which pricing script converts best?

---

## The Simple Feedback Loop

**Step 1 — Check outcomes weekly**

Go to Supabase → `leads` and look at the last 7-14 days:
- How many enrolled?
- How many went cold?
- How many said no?
- Where in the conversation did the lost leads drop off?

**Step 2 — Spot the pattern**

If leads consistently go cold after the Day 2 follow-up → the Day 2 script needs work.
If leads consistently drop off after pricing → the pricing delivery script needs work.
If the referral variant opener gets more responses than the standard one → use it more.

**Step 3 — Update the script**

Open the right file in `02-the-texts/`, edit the script copy, save it.
The next time the agent runs that script, it uses the new version.

---

## What You Should Review Monthly

1. **Opener response rate** — what % of first texts get a reply?
   - Healthy target: 40-60% response rate within 48 hours
   - Below 30% → rewrite the opener

2. **Follow-up re-engage rate** — what % of cold leads come back after Day 2/4?
   - Even 10-15% is good — these are already-warm leads
   - Below 5% → rewrite the follow-up

3. **Conversion rate** — of leads who respond, what % enroll?
   - Healthy target: 30-50% of responding leads enroll
   - Below 20% → look at where they drop (pricing? scheduling? close?)

4. **Objection patterns** — what's the #1 reason leads say no?
   - Price → revisit pricing delivery
   - Timing → revisit urgency in booking
   - "Already went somewhere else" → may need faster first-text response time

---

## When to Rewrite a Script

Rewrite when:
- The same script consistently fails 2+ weeks in a row
- A new pattern emerges (new objection you haven't seen before)
- You get a response like "this felt scripted" from a lead
- A variation outperforms the standard version by a lot

Don't rewrite:
- After one bad week (could be noise)
- Because you personally don't like the wording — test it first

---

## How to Add a New Script Variation

1. Open the right folder in `02-the-texts/`
2. Add the new version under a new heading
3. Note when to use it (trigger condition)
4. Run it for 2-3 weeks alongside the current version
5. Keep whichever one performs better, remove the other

---

## The One Metric That Matters Most Right Now

**Enrolled / Forms Submitted**

Everything else is upstream of this number. If forms are coming in and turning into enrolled students — the system is working. If forms come in and students don't show up or drop off before the first session — that's a different problem to solve later.

Focus here first.
