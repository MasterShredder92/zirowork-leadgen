# ROUTING HEADER
# What this file does: Defines one Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging message script or scenario reference for 14_teacher_change.md.
# Depends on: docs/ZIRO_MESSAGING_SCRIPTS_INDEX.md, Ziro Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Admin Messaging customer communication policy
# Do NOT load when working here: agents/, scripts/, tests/, database schemas, secrets, deployment configs unless explicitly approved
# Owning agent: ZiroWork documentation system
# Files that depend on THIS file: Documentation readers and scoped proposal workflows; exact importers not verified under locked read scope

# Script 14 — Teacher Change and Handoff

**Trigger:** Teacher is leaving, student needs reassignment, or parent requests a teacher change
**Agent:** ZIRO_MESSAGING (outbound) — after ZIRO_STAFF generates handoff report
**Framework ID:** `teacher_change`
**Goal:** Handle the transition warmly, protect the student relationship, never reveal internal details.

---

## Teacher Departure — Notifying Student/Parent

```
Hi {first_name}! I wanted to reach out because your teacher is no longer with us. We'd love to find {student_name} a great new match — would you like to come in for a meet and greet with a couple of our teachers? 😊
```

**Rule:** "No longer with us" is the only phrase. Never say fired, quit, left, or any details.

---

## Teacher Departure — Student Has Been with Teacher Long-Term

```
Hi {first_name}! I wanted to personally reach out — your teacher is no longer with us, and I know {student_name} has been with them for a while. We're so grateful for that relationship, and we want to make sure {student_name} has an equally great experience going forward. Would you like to come in and meet a couple of our teachers? 😊
```

---

## Parent Requests a Teacher Change

**Response:**
```
Of course! We want {student_name} to have the best experience possible. I'd love to find a great new match — would you like to come in for a meet and greet with a couple of our teachers? 😊
```

---

## Meet and Greet Offer (After Teacher Change)

```
We'd love to set up a meet and greet so {student_name} can get comfortable with their new teacher before jumping in. We're open Mon–Thu 3:30–9pm and Sat–Sun 10am–3pm. What day works best? 😊
```

---

## New Teacher Introduction (After Match Confirmed)

```
Great news — we've matched {student_name} with a new teacher! They'll be starting {start_date} at {time}. We're excited for this new chapter! 😊
```

---

## Student Expresses Sadness About Teacher Leaving

**Response:**
```
We completely understand — it's hard when you build a great relationship with a teacher! We're going to make sure {student_name} has an equally amazing experience with their new teacher. We're here for you! 😊
```

---

## Branch Logic

```
teacher_change_event (from ZIRO_STAFF)
  → teacher_departure → notify_student → meet_and_greet_offer
  → parent_requests_change → acknowledge → meet_and_greet_offer
  → meet_and_greet_scheduled → confirm_new_teacher → new_teacher_intro
  → student_expresses_sadness → empathetic_response → meet_and_greet_offer
  → student_cancels_after_teacher_leaves → go_to_07_cancellation.md (save_attempt)
```

---

## Rules

- Never reveal why a teacher left — "no longer with us" only
- Never promise a specific new teacher until the match is confirmed
- Always offer a meet and greet — it reduces churn after teacher changes significantly
- Long-term students (1+ year) get the extended empathy message
- New teacher introduction goes out the day before the first session with the new teacher
