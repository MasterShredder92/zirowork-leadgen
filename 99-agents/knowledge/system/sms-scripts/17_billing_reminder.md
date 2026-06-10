# ROUTING HEADER
# What this file does: Defines one Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging message script or scenario reference for 17_billing_reminder.md.
# Depends on: docs/ZIRO_MESSAGING_SCRIPTS_INDEX.md, Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging customer communication policy
# Do NOT load when working here: agents/, scripts/, tests/, database schemas, secrets, deployment configs unless explicitly approved
# Owning agent: ZiroWork documentation system
# Files that depend on THIS file: Documentation readers and scoped proposal workflows; exact importers not verified under locked read scope

# Script 17: Billing Reminder

## Context
Triggered by ZIRO_INVOICE when an invoice is overdue.

## The Script

### Option A: Friendly Overdue (The Andrea Standard)
**Use when:** Invoice is 1-7 days overdue.
> "Hi, it's Andrea! It looks like your invoice is overdue and we really need to see about getting that paid today, if possible. Let me know if I can do anything to help!"

### Option B: Week 2 Warning
**Use when:** Invoice is 8-14 days overdue.
> "Hi, it's Andrea again. Just a heads up that since the invoice is still unpaid, we'll have to pause sessions starting next week until we're caught up. Let me know if you need any help with the payment!"

## Decision Rules
1.  **One Exclamation Point Max:** Maintain the "Andrea Standard" energy but keep punctuation disciplined.
2.  **Instant Escalation:** If the parent replies with a question or dispute, STOP and alert a human.
