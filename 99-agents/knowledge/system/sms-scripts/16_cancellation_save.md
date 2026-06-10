# ROUTING HEADER
# What this file does: Defines one Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging message script or scenario reference for 16_cancellation_save.md.
# Depends on: docs/ZIRO_MESSAGING_SCRIPTS_INDEX.md, Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging customer communication policy
# Do NOT load when working here: agents/, scripts/, tests/, database schemas, secrets, deployment configs unless explicitly approved
# Owning agent: ZiroWork documentation system
# Files that depend on THIS file: Documentation readers and scoped proposal workflows; exact importers not verified under locked read scope

# Script 16: Cancellation Save

## Context
Triggered when a student mentions wanting to cancel. ZIRO_SCHEDULE identifies the intent and passes the specific pivot to ZIRO_MESSAGING.

## The Scripts

### Option A: Schedule Conflict
**Use when:** Student mentions they can't make their current time work.
> "Oh, I am so sorry to hear this! Is there a different day or time that would work better, we are available 6 days a week!"

### Option B: General Dissatisfaction
**Use when:** Student is vague or unhappy with the current setup.
> "We are sorry to hear this! We have {alternate_teacher_name} available to ensure they have the perfect teacher fit to succeed. Why don't you come in for a meet and greet to make sure it will be a good fit for {student_name}?"

### Option C: Final Exit
**Use when:** Student confirms they must leave despite pivots.
> "We completely understand and can cancel your invoices and sessions going forward. That said, please do not hesitate to reach out when you are ready to come back, I would be glad to get you going again with our return student discount! When you are ready of course. :)"

## Discount Follow-up
**Use when:** Student asks "What is the discount?"
> "When you are ready, we will chat about what that discount looks like at that time, as it does vary."
