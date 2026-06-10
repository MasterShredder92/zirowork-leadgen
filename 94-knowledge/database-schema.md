# ZiroWork — Database Schema Reference

Supabase tables. Verify against live schema before any migration or API wiring.
All tables have `studio_id → studios(id)` FK unless otherwise noted.

---

## `families`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | |
| `primary_contact` | text | |
| `email` | text | |
| `phone` | text | |
| `location` | text | |
| `status` | text | `'Active' \| 'Inactive' \| 'Paused'` |
| `billing` | text | `'Paid' \| 'Overdue' \| 'Pending'` |
| `military` | text | `'Yes' \| 'No'` |
| `instruments` | text[] | e.g. `['Piano', 'Violin']` |
| `student_count` | int | |
| `photo_url` | text | nullable |
| `overdue_balance_cents` | int | default 0 |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

## `students`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `family_id` | uuid | FK → families(id), REQUIRED |
| `first_name` | text | |
| `last_name` | text | |
| `status` | text | `'active' \| 'inactive' \| 'graduated' \| 'trial'` |
| `age` | int | |
| `date_of_birth` | date | |
| `student_display_id` | text | human-readable e.g. `'STU-001'` |
| `location_name` | text | |
| `enrollment_date` | date | |
| `instrument` | text | DEPRECATED — use `lessons.instrument` |
| `skill_level` | text | `'Beginner' \| 'Beginner/Intermediate' \| 'Intermediate' \| 'Intermediate/Advanced' \| 'Advanced'` |
| `learning_style` | text | |
| `goals` | text | |
| `bio` | text | |
| `teacher_id` | uuid | nullable, FK → teachers(id) |
| `photo_url` | text | nullable |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

Relationships: `lessons` (1:many via student_id), `student_notes` (1:many via student_id)

---

## `lessons`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `student_id` | uuid | FK → students(id) |
| `teacher_id` | uuid | FK → teachers(id) |
| `instrument` | text | |
| `day` | text | e.g. `'Monday'` |
| `time` | text | e.g. `'4:00 PM'` |
| `level` | text | same enum as student.skill_level |
| `blocks_per_week` | int | |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

## `teachers`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | |
| `email` | text | |
| `phone` | text | |
| `status` | text | `'active' \| 'inactive' \| 'on_leave'` |
| `is_active` | boolean | |
| `active_students` | int | |
| `total_enrollments` | int | |
| `schedule` | jsonb | `{ Monday: { start, end }, ... }` |
| `instruments` | text[] | |
| `primary_instrument` | text | |
| `bio` | text | |
| `photo_url` | text | nullable |
| `w9_form_url` | text | nullable |
| `contract_url` | text | nullable |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

## `leads`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | |
| `email` | text | |
| `phone` | text | |
| `instrument` | text | |
| `referral_source` | text | `'Google' \| 'Facebook' \| 'Instagram' \| 'Referral' \| 'Signage' \| 'Other'` |
| `status` | text | `'new' \| 'contacted' \| 'qualified' \| 'trial_scheduled' \| 'trial_complete' \| 'enrolled' \| 'lost'` |
| `contacts` | int | count of logged contact attempts |
| `date_submitted` | date | |
| `stage_entered_at` | timestamp | drives server-computed `daysInStage` |
| `daysInStage` | int | COMPUTED on API — never compute on frontend |
| `lost_reason` | text | nullable |
| `enrolled_student_id` | uuid | nullable, FK → students(id) |
| `form_responses` | jsonb | `{ experience_level, goals, has_instrument, preferred_days, is_military }` |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

## `student_notes`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `student_id` | uuid | FK → students(id) |
| `author_id` | uuid | FK → auth.users(id) |
| `text` | text | |
| `created_at` | timestamp | |

RLS: authenticated users with role IN (`'admin'`, `'owner'`) can SELECT/INSERT.

---

## `families_timeline` (also called `timeline_events`)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `family_id` | uuid | FK → families(id) |
| `event_type` | text | `'student_enrolled' \| 'document_uploaded' \| 'note_added' \| 'payment_received' \| ...` |
| `actor_name` | text | |
| `actor_id` | uuid | FK → auth.users(id) |
| `description` | text | |
| `metadata` | jsonb | nullable, event-specific |
| `created_at` | timestamp | |

---

## `expenses`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `category` | text | `'Rent' \| 'Utilities' \| 'Insurance' \| 'Supplies' \| 'Marketing' \| 'Equipment' \| 'Maintenance' \| 'Other'` |
| `amount` | decimal(10,2) | |
| `date` | date | |
| `description` | text | nullable |
| `type` | text | `'one-time' \| 'monthly'` default `'one-time'` |
| `created_by` | uuid | FK → users(id), nullable |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |
| `soft_deleted` | boolean | default false |
| `deleted_at` | timestamp | nullable |

---

## Mock Data Locations

| Mock variable | File | Line | Replace with |
|---|---|---|---|
| `MOCK_DATA.students` | index.html | ~122 | `GET /api/students?studio_id={id}` |
| `FAM_MOCK` | index.html | ~1334 | `GET /api/families?studio_id={id}` |
| `MOCK_STUDENTS_FAMILY` | family-roster.jsx | ~15 | `GET /api/students?family_id={id}` |
| `MOCK_DATA.teachers` | index.html | ~1561 | `GET /api/teachers?studio_id={id}` |
| Leads array | index.html | ~2168 | `GET /api/leads?studio_id={id}` |
| Expenses | financials.jsx | ~16 | `GET /api/expenses?studio_id={id}` |
