# ZiroWork — Domain Model & Invariants

> RULE FOR THIS DOC: no field lists, no view lists, no provider names, no status, no agent internals.
> If a fact has a machine SSOT, point to it — never copy it.
> schemas → src/lib/derive/types.ts + Postgres · status → harness/state/progress.md · integrations/config → integrations layer

---

## §1 — INVARIANTS (the rules that never change)

**North Star**
> ZiroWork turns music-school inquiries into enrolled, paying students — without replacing the school's CRM.

Not a dashboard company. Not a chat tool. An **AI front desk and enrollment engine** for music schools.
Every decision answers one question: *does this respond faster, enroll more, prove ROI, or earn deeper trust?* If no — cut it.

**Who's who**
- Client = the music school (pays ZiroWork monthly)
- Lead = the parent who submitted the inquiry (ZiroWork works them on the school's behalf)
- Student = the enrolled child (the school's, after handoff — never ZiroWork's)

ZiroWork never owns the student relationship. Its job ends at enrollment.

**Does / does not**
| Does | Does not |
|---|---|
| Localized landing pages/funnels per school, per instrument | Manage teachers, schedules, staff |
| Receive every lead, respond fast | Run billing or invoices |
| Qualify the parent, pitch enrollment, book the slot | Handle existing-student relationships |
| Send reminders, recover no-shows | Replace the school's CRM |
| Report leads → enrolled → revenue | Take custody of the calendar (reads protected slots only) |

**What ZiroWork Is Not**
| Not This | Why It Matters |
|---|---|
| SaaS | Clients never log in, never learn a tool, never manage a workflow |
| AI tool / chatbot product | The AI is how ZiroWork fulfills the service — not the thing being sold |
| CRM for music schools | The CRM is Zach's internal ops tool, invisible to clients |
| Marketing agency | ZiroWork owns the full chain from ad click to enrolled student — not just traffic |
| Lead gen company | Leads alone are not the product. Enrolled students are. |

**The only win that counts: Enrolled.**
A trial is not a win — it's a last-resort fallback offered only after the follow-up sequence fails. Never lead with trial; always lead with enrollment. Trials are tracked separately so we know if the lead enrolled after; `enrolled` on the Lead record is the SSOT for ZiroWork's success.

**What AI can't touch** — AI handles new-enrollment conversations only.
| Situation | Action |
|---|---|
| New inquiry · reschedule inside enrollment flow · pricing w/ approved answer | AI handles |
| Pricing w/o approved answer · billing/refund · complaint · current-student change · cancellation | Escalate |
| Unclear intent | One clarifying question, then escalate |

Every escalation logged with severity, reason, open/resolved. Zach resolves manually.

**What to reject**
| Reject | Why |
|---|---|
| Full CRM replacement as first sale | Too much trust before value is proven |
| Trial as default close | Enrolled is the goal |
| Generic AI for all service businesses | Music-school authority is the edge |
| Deep calendar dependency day one | Start with protected slots |
| Taking custody of funds early | Use the school's own payment link |
| Feature usage as the main score | Booked enrollments + revenue recovered are what matter |

---

## §2 — WHY IT WORKS

Acquisition.com's ALAN automated the painful part of brick-and-mortar acquisition — working leads — and crossed $1.4M/mo in six months by getting ~1.9x more leads to show than the average front-desk clerk. The lesson isn't "copy ALAN," it's: **lead work is the money bottleneck.** Whoever works leads faster and more consistently than the school's own team wins.

Operating principles (Hormozi): get paid because clients make money, not because they use software · clients buy enrolled students and visible ROI, not dashboards · speed creates leverage · remove client effort · niche first (own music schools) · earn trust before asking for migration/calendar/funds · proof unlocks expansion (reactivation → payments → retention → scheduling, in that order).

---

## §3 — THE FLOW
Music School → Instrument Program → Campaign → Landing Page → Lead

→ AI responds fast → qualify (student, instrument, schedule)

→ pitch enrollment directly → slot booked + payment link → confirm + remind

→ ENROLLED ← the win → client report updated → school takes over

FALLBACK (only if no commitment after the primary sequence):

follow-up days 2–N → operator manually offers trial → trial happens

→ operator records Enrolled / Lost → report updated

ZiroWork owns **Lead → Enrolled**. Before and after is the school's domain. Trial is an operator-entered fallback, never an AI default and never a pipeline stage.

Every lead is isolated to its client — the inbound event's location/client id selects which slots, scripts, and SMS number apply.

---

## §4 — SPEED DOCTRINE

Speed is the first operational law: a lead's buying intent peaks the second they submit.
| Rule | Standard |
|---|---|
| First response | Fast — minutes, not hours |
| Qualification | Ask only what's needed to book the right slot |
| Enrollment CTA | Move toward a slot; don't over-chat |
| Payment | Use the school's existing link to cut no-shows |
| Reminders | Confirm immediately, remind at 24hr + day-of |
| Escalation | Not enrollment-safe? Escalate and log — never guess |

---

## §5 — GO-LIVE CHECKLIST

Anything missing blocks campaign launch:
- SMS number assigned to the school
- Lead-form webhook posting to ZiroWork
- Protected booking slots defined
- Payment link (the school's own)
- Client assets (logo, bios, voice, offer, testimonials)
- Automation rules (what AI handles vs escalates)
- Integrations verified (connected / broken / not connected)

---

## §6 — METRICS THAT MATTER

| Metric | Why |
|---|---|
| Lead response time | The core speed-to-lead edge |
| Enrolled rate | The only win — primary revenue motion |
| Show rate | Measures reminder quality + commitment |
| Revenue generated per client | Main retention proof |
| Escalation volume | Where AI needs better guardrails or client data |

Leads stalled past the stale threshold get an amber flag — something's stuck.

---

## §7 — POINTERS (don't duplicate these here)

- Data object schemas → `src/lib/derive/types.ts` + Postgres
- Live status / phase / decisions → `harness/state/progress.md`
- Integrations + provider config → integrations layer (code)
