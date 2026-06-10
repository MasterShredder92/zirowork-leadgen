# ROUTING HEADER
# What this file does: Defines one Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging message script or scenario reference for 11_payment.md.
# Depends on: docs/ZIRO_MESSAGING_SCRIPTS_INDEX.md, Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging customer communication policy
# Do NOT load when working here: agents/, scripts/, tests/, database schemas, secrets, deployment configs unless explicitly approved
# Owning agent: ZiroWork documentation system
# Files that depend on THIS file: Documentation readers and scoped proposal workflows; exact importers not verified under locked read scope

# Script 11 — Payment and Billing

**Trigger:** Invoice overdue, payment failed, billing question, hardship request
**Agent:** ZIRO_MESSAGING (outbound) — ZIRO_INVOICE handles actual invoice logic
**Framework ID:** `payment_overdue`
**Goal:** Friendly reminder, assume it's an oversight, resolve without pressure.

---

## Invoice Reminder (1st Notice — Due Date Passed)

```
Hi {first_name}! Just a friendly reminder that your invoice for {month} is due. If you have any questions or need help, just let me know! 😊
```

---

## Invoice Reminder (2nd Notice — 5 Days Overdue)

```
Hi {first_name}! Just following up on your {month} invoice — we want to make sure everything is good on your end. Let us know if you have any questions! 😊
```

---

## Payment Failed (Card Declined)

```
Hi {first_name}! It looks like your payment for {month} didn't go through. Could you update your payment info when you get a chance? Just let me know if you need help! 😊
```

---

## Payment Failed — Second Attempt

```
Hi {first_name}! Just checking in — we tried your payment again and it didn't go through. Want to give us a call or update your info? We want to make sure {student_name} stays on the schedule! 😊
```

---

## Financial Hardship (Student Reaches Out)

**Student says:** "We're going through a hard time," "I can't pay right now," "We need to pause"

**Response:**
```
We completely understand and are so sorry to hear that. Please don't worry — we'll take care of it. Take care of your family first, and reach out whenever you're ready to come back. We'd love to have you! 😊
```

**Action:** Escalate to ZIRO_INVOICE to pause/cancel invoice. ZIRO_MESSAGING sends the message, ZIRO_INVOICE handles the billing.

---

## Student Asks to Cancel Invoice After Stopping Lessons

**Response:**
```
Of course! I'll get that taken care of for you right away. You won't owe anything for lessons you haven't attended. 😊
```

**Action:** Escalate to ZIRO_INVOICE immediately.

---

## Student Asks About Invoice Timing / 5th Week

**Response:**
```
Great question! Invoices go out on the 1st of every month for 4 lessons. If your day falls on a 5th week that month, that lesson is free — it's built into the price as a bonus! 😊
```

---

## Student Disputes a Charge

**Response:**
```
I'm so sorry about that! Let me look into it right away. I'll follow up with you shortly. 😊
```

**Action:** Escalate to ZIRO_INVOICE. ZIRO_MESSAGING holds, ZIRO_INVOICE investigates and resolves.

---

## Branch Logic

```
payment_event_received (from ZIRO_INVOICE)
  → invoice_overdue_1st → friendly_reminder
  → invoice_overdue_5days → second_notice
  → payment_failed → card_declined_message
  → payment_failed_2nd → second_attempt_message → escalate_to_human_if_still_fails
  → hardship_reported → holding_message → escalate_to_operator
  → dispute → holding_message → escalate_to_operator
  → invoice_cancel_request → holding_message → escalate_to_operator
```

---

## Rules

- Always assume it's an oversight — never threatening, never aggressive
- Never say "your account is past due" — say "your invoice for [month]"
- Never make billing decisions in ZIRO_MESSAGING — always escalate to ZIRO_INVOICE
- Hardship situations: warm exit, no pressure, keep the door open
- After 2 failed payment notices with no response, escalate to human
- ZIRO_MESSAGING sends the message. ZIRO_INVOICE does the math. Never the other way around.
