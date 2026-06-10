# ZiroWork — API Contract Reference

All endpoints are unimplemented. This file is the authoritative spec for wiring. Source: handoff.md §4 + §8.

Every `TODO: Claude Code —` comment in the source maps to an entry here.

---

## Leads

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| GET | `/api/leads?studio_id={id}` | — | `{ leads: Lead[] }` |
| POST | `/api/leads` | `{ name, email, phone, instrument, referral_source, status: 'new', form_responses }` | `{ lead: Lead }` |
| PATCH | `/api/leads/{id}` | Stage move: `{ status, stage_entered_at }` / Lost: `{ status: 'lost', lost_reason }` | `{ lead: Lead }` |
| POST | `/api/leads/{id}/contacts` | `{ type: 'manual', note: '' }` | `{ lead: { contacts: updatedCount } }` |

**Note:** `daysInStage` is always server-computed from `stage_entered_at`. Never compute on frontend.

---

## Students

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| GET | `/api/students?family_id={id}` | — | `{ students: Student[] }` (include nested `lessons`) |
| GET | `/api/students/{id}` | — | `{ student: Student }` |
| POST | `/api/students` | `{ family_id, first_name, last_name, instrument, age }` | `{ student: Student }` |
| PATCH | `/api/students/{id}` | Any field updates | `{ student: Student }` |

---

## Lessons

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| POST | `/api/students/{id}/lessons` | `{ instrument, teacher_id, day, time, level, blocks_per_week }` | `{ lesson: Lesson }` |
| PATCH | `/api/students/{id}/lessons/{lesson_id}` | Field updates | `{ lesson: Lesson }` |
| DELETE | `/api/students/{id}/lessons/{lesson_id}` | — | `{ success: true }` |

---

## Student Notes

| Method | Endpoint | Body | Returns | Auth |
|---|---|---|---|---|
| POST | `/api/student_notes` | `{ student_id, text }` | `{ note: StudentNote }` | admin or owner role |
| GET | `/api/students/{id}/notes` | — | `{ notes: StudentNote[] }` | — |

---

## Families

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| GET | `/api/families?studio_id={id}` | — | `{ families: Family[] }` |
| GET | `/api/families/{id}` | — | `{ family: Family }` |
| PATCH | `/api/families/{id}` | Field updates | `{ family: Family }` |
| GET | `/api/families/{id}/invoices` | — | `{ invoices: Invoice[] }` |
| GET | `/api/families/{id}/timeline` | — | `{ events: TimelineEvent[] }` |
| POST | `/api/families/{id}/notes` | `{ text, author_id }` | `{ note: Note }` |
| POST | `/api/families/{id}/documents` | multipart/form-data | `{ id, name, url, uploaded_by, created_at }` |
| DELETE | `/api/families/{id}/documents/{doc_id}` | — | `{ success: true }` |
| POST | `/api/families/{id}/teachers` | `{ teacher_id }` | `{ family: Family }` |
| PATCH | `/api/families/{id}/teachers/{old_id}` | `{ new_teacher_id }` | `{ family: Family }` |

---

## Teachers

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| GET | `/api/teachers?studio_id={id}` | — | `{ teachers: Teacher[] }` |
| GET | `/api/teachers/{id}` | — | `{ teacher: Teacher }` |
| PATCH | `/api/teachers/{id}` | `{ name, email, phone, bio, photo_url }` | `{ teacher: Teacher }` |
| POST | `/api/teachers/{id}/availability` | `{ schedule: { Monday: { start, end }, ..., Friday: 'closed' } }` | `{ teacher: Teacher }` |
| GET | `/api/teachers/{id}/payroll` | — | `{ payroll: PayrollData }` |

---

## Invoices

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| GET | `/api/invoices?family_id={id}` | — | `{ invoices: Invoice[] }` |
| GET | `/api/invoices/{id}/download` | — | PDF binary |
| POST | `/api/invoices` | Invoice fields | `{ invoice: Invoice }` |
| PATCH | `/api/invoices/{id}` | Field updates | `{ invoice: Invoice }` |

---

## Expenses

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| GET | `/api/expenses?studio_id={id}` | — | `{ expenses: Expense[] }` |
| POST | `/api/expenses` | `{ category, amount, date, description, type: 'one-time' \| 'monthly' }` | `{ expense: Expense }` |
| PATCH | `/api/expenses/{id}` | Field updates | `{ expense: Expense }` |
| DELETE | `/api/expenses/{id}` | — | `{ success: true }` (soft delete) |

---

## Dashboard

| Method | Endpoint | Body | Returns | Notes |
|---|---|---|---|---|
| GET | `/api/dashboard/stats?studio_id={id}` | — | `{ stats: DashboardStats }` | Poll every 30s |

---

## Auth / User

| Method | Endpoint | Returns | Notes |
|---|---|---|---|
| GET | `/api/user` | `{ user: { id, email, full_name, role } }` | Used for timeline + notes author |
| POST | `/api/auth/switch-role` | — | Body: `{ roleId }` |

---

## Enrollment Flow (Lead → Student)

When "Enroll as Student" is triggered from a lead card:

1. `POST /api/students` with `{ lead_id, name, email, phone, instrument, referral_source, form_responses }`
2. On success, `PATCH /api/leads/{id}` with `{ status: 'enrolled', enrolled_student_id: studentId }`

---

## Source File Locations (TODO: Claude Code comments)

| File | Line approx | Endpoint needed |
|---|---|---|
| `index.html` | ~1128 (FDBillingTab) | GET /api/families/{id}/invoices |
| `index.html` | ~921 (FDTimelineTab) | GET /api/families/{id}/timeline |
| `index.html` | ~803 (FDNotesTab) | POST /api/families/{id}/notes |
| `index.html` | ~765 (FDDocumentsTab) | POST + DELETE /api/families/{id}/documents |
| `index.html` | ~532 (FDHouseholdTab) | POST /api/students |
| `index.html` | ~298 (FDInfoTab) | PATCH /api/families/{id} |
| `index.html` | ~2148 (LeadsView) | GET /api/leads + PATCH + POST /api/students |
| `student-profile.jsx` | ~303 (StuProfileTab) | PATCH /api/students/{id} |
| `student-profile.jsx` | ~130 (LessonsSection) | POST + PATCH + DELETE /api/students/{id}/lessons |
| `student-profile.jsx` | ~473 (NotesTab) | POST /api/student_notes |
| `dashboard.jsx` | — | GET /api/dashboard/stats (poll 30s) |
