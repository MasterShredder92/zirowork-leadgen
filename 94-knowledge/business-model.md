# ZiroWork — Business Model

**Read this before ZiroWork-Client-Flow. It defines the frame everything else sits inside.**

---

## What ZiroWork Is

ZiroWork is a **done-for-you student acquisition service** for music schools.

The client buys enrolled students. Not software. Not a dashboard. Not a seat.

ZiroWork and the AI do all the work. The music school owner receives new students.

---

## What ZiroWork Is Not

| Not This | Why It Matters |
|---|---|
| SaaS | Clients never log in, never learn a tool, never manage a workflow |
| AI tool / chatbot product | The AI is how ZiroWork fulfills the service — not the thing being sold |
| CRM for music schools | The CRM is Zach's internal ops tool, invisible to clients |
| Marketing agency | ZiroWork owns the full chain from ad click to enrolled student — not just traffic |
| Lead gen company | Leads alone are not the product. Enrolled students are. |

---

## The Business Model in One Sentence

ZiroWork is paid because music schools make money — not because they use software.

---

## What the Client Pays For

The client's question is: **"Will my schedule fill up?"**

They do not ask about:
- Which AI model is running
- How the CRM is structured
- What the SMS follow-up cadence looks like
- Whether it's Twilio or anything else

They ask one thing: are students enrolling?

ZiroWork answers that question with a number. Everything else is internal.

---

## Pricing Logic

Performance or retainer. Never per-seat.

| Model | Structure |
|---|---|
| Performance | Charge per enrolled student — ZiroWork eats the cost until it delivers |
| Retainer | Fixed monthly fee, guaranteed X leads worked to close — client knows the number |

Either way, the school owner is buying a **result**, not access.

---

## The Internal Stack Is Not the Product

The CRM, the agents, the Supabase tables, the landing pages, the SMS automation — these are **ZiroWork's operational infrastructure**. They are how Zach runs the service at scale. They are not what gets sold or shown to clients.

Implication for building:
- Every CRM feature should make Zach faster or more accurate at delivering enrollments
- If a feature doesn't help Zach deliver the result, cut it
- Client-facing surfaces (landing pages, intake forms, onboard.html) are part of the service delivery — not a product portal

---

## The Analogy That Helps

Hiring a sales rep who:
- Responds to every inquiry within 60 seconds, 24/7
- Never forgets to follow up on day 2, 4, or 7
- Knows the school's offer, programs, teachers, and pitch
- Escalates the hard stuff to Zach immediately
- Costs a fraction of a human rep

The AI is that rep. ZiroWork is the agency that employs it.

---

## What Makes This Hard to Replicate

Not the AI. Any competitor can access the same models.

The moat is the **full stack**:
- Landing pages owned by ZiroWork (not the school)
- Intake forms ZiroWork controls
- SMS conversations ZiroWork runs
- Scripts trained on Zach's methodology
- CRM visibility the school never has to touch
- Follow-up cadence dialed in from real conversions

A school owner cannot bolt this onto their existing setup. ZiroWork brings the whole system.

---

## The Only Metric That Proves the Model

**Enrolled students.** That is what gets reported. That is what earns the retainer. That is what creates referrals.

Trials, conversations, impressions, open rates — none of these are the win.

See `ZiroWork-Client-Flow` → "The Only Win That Counts" for the full doctrine.

---

## Build Filter

Before building anything, ask:

> Does this help ZiroWork enroll more students, prove ROI to a client, or let Zach operate more schools with the same effort?

If no — cut it.
