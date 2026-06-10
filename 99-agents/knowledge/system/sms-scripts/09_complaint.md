# ROUTING HEADER
# What this file does: Defines one Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging message script or scenario reference for 09_complaint.md.
# Depends on: docs/ZIRO_MESSAGING_SCRIPTS_INDEX.md, Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging customer communication policy
# Do NOT load when working here: agents/, scripts/, tests/, database schemas, secrets, deployment configs unless explicitly approved
# Owning agent: ZiroWork documentation system
# Files that depend on THIS file: Documentation readers and scoped proposal workflows; exact importers not verified under locked read scope

# Script 09 — Complaint Handling

**Trigger:** Student/parent expresses dissatisfaction, frustration, or a formal complaint
**Agent:** ZIRO_MESSAGING (outbound) — with human escalation for serious complaints
**Framework ID:** `complaint_handling`
**Goal:** Acknowledge immediately, apologize sincerely, fix it or escalate. Never argue. Never get defensive.

---

## General Complaint Receipt

**Lead/student says anything expressing frustration or dissatisfaction**

**Response:**
```
Hi {first_name}! I'm so sorry to hear that — that's not the experience we want for you at all. Can you tell me a little more about what happened so I can make it right? 😊
```

**Rule:** Acknowledge first. Always. Before anything else. Do not explain, defend, or justify. Acknowledge and ask for details.

---

## Complaint — Billing Error

**Response:**
```
I'm so sorry about that! That should not have happened. I'm going to get that corrected right away and will follow up with you shortly. 😊
```

**Action:** Escalate to ZIRO_INVOICE immediately. ZIRO_MESSAGING sends the holding message, ZIRO_INVOICE resolves the billing issue.

---

## Complaint — Teacher Issue (Vague)

**Response:**
```
I'm so sorry to hear that! Your experience matters to us. Would you be open to sharing a little more about what happened? I want to make sure we address this properly. 😊
```

**If they share details:** Escalate to human (owner/director) review. ZIRO_MESSAGING does not make teacher decisions.

---

## Complaint — Teacher Issue (Wants a Different Teacher)

**Response:**
```
Of course! We want you to have the best experience possible. I'd love to find you a great new match — would you like to come in for a meet and greet with a couple of our teachers? 😊
```

---

## Complaint — Scheduling Error (Wrong Time, Wrong Day)

**Response:**
```
I'm so sorry about that — that was our mistake! Let me get that fixed right now. 😊
```

**Action:** Escalate to ZIRO_SCHEDULE to correct the booking. ZIRO_MESSAGING sends the apology.

---

## Complaint — Studio Environment / Facility

**Response:**
```
Thank you for letting us know — I'm really sorry about that. I'll make sure this gets addressed right away. We appreciate you bringing it to our attention! 😊
```

**Action:** Escalate to human (owner/director).

---

## Complaint — Communication Issue (Didn't Hear Back, Slow Response)

**Response:**
```
I'm so sorry for the delay! That's not acceptable on our end. I'm here now — how can I help? 😊
```

---

## Complaint — Student Wants to Quit Due to Bad Experience

**Response:**
```
I'm so sorry to hear that — we really value you and want to make this right. Is there anything we could do to improve your experience? 😊
```

**If they're firm:**
```
We completely understand. We're sorry we didn't meet your expectations and we wish you all the best. Please don't hesitate to reach out if there's anything we can do. 😊
```

---

## Serious Complaint (Escalation Required)

**Triggers for immediate human escalation:**
- Any mention of safety concerns
- Any mention of legal action
- Any complaint about a specific teacher's behavior toward a child
- Any complaint involving a refund demand over $200

**Response (holding message while escalating):**
```
Thank you for bringing this to our attention — I'm taking this very seriously. I'm going to have our director reach out to you directly. 😊
```

**Action:** Immediately escalate to human. ZIRO_MESSAGING stops responding until human takes over.

---

## Branch Logic

```
complaint_received
  → billing_error → holding_message → escalate_to_operator
  → teacher_issue_vague → ask_for_details → escalate_to_human
  → teacher_issue_wants_change → meet_and_greet_offer
  → scheduling_error → apology → escalate_to_ziro_schedule
  → facility_issue → apology → escalate_to_human
  → communication_issue → apology → resume_conversation
  → wants_to_quit → soft_save → graceful_exit_if_firm
  → serious_complaint → holding_message → escalate_to_human_immediately
```

---

## Rules

- Acknowledge first — always, before anything else
- Never argue, never get defensive, never explain before apologizing
- Never make billing decisions — escalate to ZIRO_INVOICE
- Never make teacher decisions — escalate to human
- Serious complaints (safety, legal, refund demands) → escalate immediately, ZIRO_MESSAGING stops
- The goal is always to make it right — if you can't fix it in ZIRO_MESSAGING, escalate
