# What We Ask — The Lead Signup Form

When a lead fills out the Adkins signup page, here's everything we know about them the moment they hit submit.

---

## Who It's For

The lead tells us if they're signing up for:
- **Themselves** (adult)
- **Their kid** (one child)
- **Multiple kids**
- **A gift** (they give us the recipient's name)

> This tells the agent whether to address the parent or the student directly in texts.

---

## The Student

| What We Know | What It's Called |
|---|---|
| First name | `student_first_name` |
| Last name | `student_last_name` |
| Age | `student_age` |
| Experience level | `experience` — None / 1-2 years / 2-4 years / 4+ years |
| Goals and personality | `personality_notes` — free text they write |

---

## What They Want to Learn

| What We Know | What It's Called |
|---|---|
| Instrument(s) | `instrument` — piano, guitar, vocals, drums, violin, other |
| Already have an instrument? | `has_instrument` — Yes / No / Need Help Purchasing / N/A |

> If they picked vocals-only, we skip the "do you have an instrument" question.

---

## When and Where

| What We Know | What It's Called |
|---|---|
| Days that work | `preferred_days` — Mon–Thu 3:30–9p, Sat 10am–3p, Any, None |
| Preferred location | `preferred_location` — gretna, elkhorn, omaha, bellevue |
| Other locations they'd consider | `secondary_locations` — optional |

---

## Who to Contact

| What We Know | What It's Called |
|---|---|
| Parent first name | `parent_first_name` (blank if signing up for themselves) |
| Parent last name | `parent_last_name` |
| Phone | `phone` |
| Email | `email` |
| Military household? | `is_military` — true / false |

> **Military flag matters.** It changes the price we quote ($160 vs $180/month).

---

## How They Found Us

| What We Know | What It's Called |
|---|---|
| Referral source | `referral_source` — Facebook/Instagram, Google, Signage/Driving By, Referral, Other |

> If source is "Referral" — the opener script asks who referred them.

---

## Additional Students

They can add up to 3 more students after the first. Each one gets:
- First and last name
- Instrument(s)
- Goals
- Short bio

> More students = multi-student pricing ($160/mo per student instead of $180).

---

## What the Agent Has on First Text

The moment a form comes in, the agent knows:
- Who to address (parent or student)
- What instrument they want
- What days they can come
- Which location they prefer
- Their experience level
- Whether they're military
- How they heard about us

**The first text is never generic.** It uses their name, their instrument, and their situation.
