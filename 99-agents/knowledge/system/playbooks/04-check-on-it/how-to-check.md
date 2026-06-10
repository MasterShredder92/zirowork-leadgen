# How to Check on What's Happening

Use this when you want to see what the agent is doing, catch a problem, or dig into a specific lead.

---

## The 4 Things You'll Ever Need to Check

### 1. Is the Agent Actually Running?

Check the session log — it shows every time the agent processed something.

**File:** `.agent/session-log.md`

What to look for:
- Recent entries with today's date = agent is active
- No entries in 24+ hours = something stopped, investigate

---

### 2. Did Anything Break?

Check the failure log — every error gets written here automatically.

**File:** `.agent/failure-index.md`

What to look for:
- A lead ID + error message = something went wrong for that specific lead
- Repeated same error = something is broken in the system, needs a fix
- Empty file = nothing has broken, good

---

### 3. What Did the Agent Say to a Specific Lead?

The agent logs every message it sends and every response it gets.

**Where:** Supabase → `ziro_message_log` table, filter by phone number or lead ID

What you'll see:
- Timestamp of every message sent
- The exact text that went out
- The lead's reply (if any)
- What stage the conversation is in (opener / follow-up / booking / closed)

---

### 4. Where Is Each Lead Right Now?

**Where:** Supabase → `leads` table

Each lead has a status:
- `new` — form just came in, first text not sent yet
- `contacted` — first text sent, waiting for response
- `in_conversation` — lead is responding, agent is working them
- `slot_offered` — agent offered a time, waiting for yes/no
- `form_sent` — lead said yes, registration link sent
- `enrolled` — form received, done
- `cold` — hit Day 7 with no response, no more outreach
- `lost` — said no or hard no, no more outreach ever

---

## Quick Fix — The Agent Said Something Wrong

1. Go to `.agent/failure-index.md` to see if there's a logged error
2. Go to the right script file in `02-the-texts/` and correct the copy
3. If the wrong message already went out to a real lead, you'll need to manually follow up from the owner's phone — note it in `failure-index.md`

---

## Quick Fix — A Lead Is Stuck

A lead is "stuck" if they've been in `contacted` or `in_conversation` for more than 7 days with no movement.

1. Find them in Supabase → `leads`
2. Look at their messages in `ziro_message_log`
3. Either: manually text them from the owner's phone, or update their status to `cold` to stop outreach

---

## Red Flags to Watch For

| What You See | What It Means |
|---|---|
| Same error appearing 5+ times in failure-index.md | Something is broken in code, not just a one-off |
| A lead status stuck on `new` for 10+ minutes | Intake pipeline isn't triggering, check the webhook |
| Messages going out at weird hours | Check the send time rules in the agent config |
| Agent sending the same message twice | Dedup system may have failed, check `ziro_message_log` for duplicates |
