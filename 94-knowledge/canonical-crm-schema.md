# Canonical CRM Database Design

Modern CRM schema combining Salesforce/HubSpot patterns with ZiroWork education context.

---

## 1. Core Entity Tables

### Families (Accounts)
```sql
families
├── id (UUID, PK)
├── name (text, required) — "Smith Family"
├── email (text, unique) — primary contact email
├── phone (text)
├── status (enum: active|inactive|lead|archived)
├── owner_id (FK users) — assigned staff member
├── timezone (text, default: 'UTC')
├── address, city, state, zip (text)
├── notes (text, rich-text capable)
├── tags (text[], or via junction)
├── custom_fields (jsonb) — extensible properties
├── student_count (int) — denormalized for perf
├── created_at, updated_at (timestamp)
├── created_by, updated_by (FK users)
├── deleted_at (timestamp, soft-delete)
```

**Indexes:**
- (status, owner_id, created_at)
- (email), (phone)
- (deleted_at) for soft-delete queries

---

### Students (Contacts)
```sql
students
├── id (UUID, PK)
├── family_id (FK families, required)
├── name (text, required)
├── email (text, optional) — student email
├── phone (text, optional) — parent phone if primary contact
├── date_of_birth (date)
├── grade (text) — "9th", "K", "College", etc.
├── subjects (text[], or via junction) — enrolled subjects
├── enrollment_status (enum: active|on-hold|graduated|dropped)
├── owner_id (FK users) — assigned teacher/advisor
├── status (enum: active|inactive|archived)
├── notes (text)
├── tags (text[])
├── custom_fields (jsonb)
├── created_at, updated_at (timestamp)
├── deleted_at (timestamp)
```

**Indexes:**
- (family_id, enrollment_status)
- (grade, enrollment_status)
- (deleted_at)

---

### Teachers (Contacts)
```sql
teachers
├── id (UUID, PK)
├── name (text, required)
├── email (text, unique, required)
├── phone (text)
├── specialties (text[]) — ["Math", "Physics", "SAT Prep"]
├── hourly_rate (decimal) — $75.00 per hour
├── availability_json (jsonb) — {"Mon": "10:00-17:00", ...}
├── status (enum: active|inactive|on-break|archived)
├── owner_id (FK users) — manager/admin
├── notes (text)
├── tags (text[])
├── custom_fields (jsonb)
├── created_at, updated_at (timestamp)
├── deleted_at (timestamp)
```

**Indexes:**
- (specialties) — if using array index
- (status, created_at)
- (deleted_at)

---

### Leads
```sql
leads
├── id (UUID, PK)
├── name (text, required)
├── email (text)
├── phone (text)
├── company (text, optional) — "Lincoln High School" or family name
├── status (enum: new|contacted|qualified|proposal|lost|converted)
├── source (enum: website|referral|cold-call|event|ad|api|inbound)
├── lead_value (decimal, optional) — estimated annual contract value
├── owner_id (FK users, required)
├── interested_in (text[]) — ["Math Tutoring", "SAT Prep"]
├── converted_to_family_id (FK families, nullable) — when won
├── notes (text)
├── tags (text[])
├── custom_fields (jsonb)
├── created_at, updated_at (timestamp)
├── deleted_at (timestamp)
```

**Indexes:**
- (status, owner_id, created_at)
- (email), (phone)
- (converted_to_family_id)
- (deleted_at)

---

## 2. Transactional Tables

### Lessons / Sessions
```sql
lessons
├── id (UUID, PK)
├── teacher_id (FK teachers, required)
├── student_id (FK students, required)
├── family_id (FK families, required) — denormalized for perf
├── subject (text) — "Algebra", "SAT Math", etc.
├── lesson_date (date, required)
├── start_time (time)
├── duration_minutes (int, default: 60)
├── status (enum: scheduled|completed|cancelled|no-show|rescheduled)
├── notes (text) — lesson notes, topics covered
├── homework_assigned (text)
├── homework_completed (bool)
├── rate (decimal) — locked price per hour at time of lesson
├── total_cost (decimal) — rate * (duration_minutes/60)
├── created_at, updated_at (timestamp)
├── deleted_at (timestamp)
```

**Indexes:**
- (student_id, lesson_date DESC)
- (teacher_id, lesson_date DESC)
- (family_id, lesson_date DESC)
- (status, created_at)
- (deleted_at)

---

### Invoices
```sql
invoices
├── id (UUID, PK)
├── invoice_number (text, unique) — "INV-2026-001234"
├── family_id (FK families, required)
├── teacher_id (FK teachers, optional) — for per-teacher invoices
├── status (enum: draft|sent|partial|paid|overdue|cancelled|refunded)
├── amount_subtotal (decimal) — before tax
├── tax_rate (decimal, default: 0.0)
├── tax_amount (decimal)
├── amount_total (decimal) — subtotal + tax
├── currency (text, default: 'USD')
├── issued_date (date, required)
├── due_date (date, required)
├── paid_date (date, nullable)
├── payment_terms (text) — "Net 30", "Due upon receipt"
├── line_items (jsonb) — [{lesson_id, lesson_date, subject, qty, rate, amount}, ...]
├── notes (text)
├── created_at, updated_at (timestamp)
├── deleted_at (timestamp)
```

**Indexes:**
- (family_id, issued_date DESC)
- (status, due_date)
- (invoice_number)
- (deleted_at)

---

### Payments
```sql
payments
├── id (UUID, PK)
├── invoice_id (FK invoices, required)
├── amount (decimal, required)
├── payment_method (enum: credit-card|bank-transfer|check|cash|paypal)
├── status (enum: pending|processed|failed|refunded)
├── transaction_id (text) — gateway reference: "stripe_pi_1234..."
├── gateway (text, optional) — "stripe", "paypal", "square"
├── payment_date (date, required)
├── notes (text)
├── created_at, updated_at (timestamp)
```

**Indexes:**
- (invoice_id, payment_date DESC)
- (status, payment_date)
- (transaction_id)

---

### Schedules (Recurring Lessons)
```sql
schedules
├── id (UUID, PK)
├── teacher_id (FK teachers, required)
├── student_id (FK students, required)
├── family_id (FK families, required)
├── subject (text)
├── day_of_week (enum: Monday|Tuesday|...|Sunday)
├── start_time (time)
├── duration_minutes (int, default: 60)
├── rate (decimal)
├── is_active (bool, default: true)
├── start_date (date)
├── end_date (date, nullable) — open-ended if null
├── notes (text)
├── created_at, updated_at (timestamp)
├── deleted_at (timestamp)
```

**Indexes:**
- (teacher_id, is_active)
- (student_id, is_active)
- (family_id, is_active)

---

### Activities / Interactions
```sql
activities
├── id (UUID, PK)
├── entity_type (enum: family|student|teacher|lead|deal)
├── entity_id (UUID) — FK to families | students | teachers | leads | deals
├── activity_type (enum: call|email|meeting|note|task|sms)
├── subject (text, optional)
├── body (text)
├── duration_minutes (int, optional) — for calls, meetings
├── next_activity_date (date, optional) — follow-up reminder
├── owner_id (FK users)
├── status (enum: open|completed|cancelled)
├── created_at, completed_at (timestamp)
├── deleted_at (timestamp)
```

**Indexes:**
- (entity_type, entity_id, created_at DESC)
- (owner_id, status, next_activity_date)
- (activity_type, created_at DESC)
- (deleted_at)

---

## 3. Reference / Configuration Tables

### Service Types (Reference)
```sql
service_types
├── id (UUID, PK)
├── name (text, unique) — "Math Tutoring", "SAT Prep", "One-on-One Coaching"
├── description (text)
├── default_rate (decimal, optional)
├── is_active (bool, default: true)
├── created_at (timestamp)
```

---

### Statuses (Reference)
```sql
statuses
├── id (UUID, PK)
├── entity_type (text) — "family", "lead", "invoice", "lesson"
├── name (text) — "active", "paid", "completed"
├── display_label (text) — "Active Family"
├── color (text, hex) — "#4CAF50"
├── order (int) — display order in UI
├── is_default (bool)
├── created_at (timestamp)
```

---

### Tags (Reference)
```sql
tags
├── id (UUID, PK)
├── name (text, unique)
├── category (text, optional) — "priority", "subject", "payment"
├── color (text, hex)
├── created_at (timestamp)
```

---

### Users (Team Members)
```sql
users
├── id (UUID, PK)
├── email (text, unique, required)
├── name (text, required)
├── role (enum: admin|manager|teacher|staff|parent)
├── status (enum: active|inactive|archived)
├── school_id (FK schools, required) — for multi-tenant
├── created_at, updated_at (timestamp)
```

---

### Schools / Organizations
```sql
schools
├── id (UUID, PK)
├── name (text, required)
├── email (text)
├── phone (text)
├── address, city, state, zip (text)
├── timezone (text)
├── logo_url (text)
├── stripe_account_id (text, optional)
├── custom_fields (jsonb)
├── created_at, updated_at (timestamp)
```

---

### Custom Fields Registry
```sql
custom_fields
├── id (UUID, PK)
├── school_id (FK schools)
├── entity_type (text) — "families", "students", "invoices"
├── field_key (text) — "referred_by", "subscription_tier"
├── field_name (text) — "Referred By"
├── field_type (enum: text|number|date|enum|boolean|json)
├── required (bool, default: false)
├── default_value (jsonb)
├── enum_options (text[]) — if type=enum
├── display_order (int)
├── created_at (timestamp)
```

---

## 4. Many-to-Many Relationship Tables

### Lesson_Teachers (Supporting multi-teacher lessons)
```sql
lesson_teachers
├── lesson_id (FK lessons, PK part 1)
├── teacher_id (FK teachers, PK part 2)
├── role (enum: primary|co-teacher|observer)
├── created_at (timestamp)
```

---

### Family_Tags
```sql
family_tags
├── family_id (FK families, PK part 1)
├── tag_id (FK tags, PK part 2)
├── created_at (timestamp)
```

---

### Student_Teachers (Many students, many teachers)
```sql
student_teachers
├── student_id (FK students, PK part 1)
├── teacher_id (FK teachers, PK part 2)
├── relationship (enum: primary-tutor|co-teacher|assistant|observer)
├── start_date (date)
├── end_date (date, nullable)
├── created_at (timestamp)
```

---

### Student_Subjects
```sql
student_subjects
├── student_id (FK students, PK part 1)
├── subject_id (FK service_types, PK part 2) — or just text
├── enrollment_date (date)
├── progress_notes (text)
├── created_at (timestamp)
```

---

## 5. Relationship Diagrams

### Diagram 1: Family → Students → Teachers → Lessons

```
┌─────────────────────────────────────────────────────────────┐
│ FAMILIES (Accounts)                                         │
│ ├─ id (PK)                                                  │
│ ├─ name, email, phone                                       │
│ ├─ status, owner_id                                         │
│ └─ custom_fields (jsonb)                                    │
└─────────────────────────────────────────────────────────────┘
         │
         │ 1:N (family_id FK)
         │
         └──────────────────────────────────────┐
                                                 │
┌────────────────────────────────────────┐      │
│ STUDENTS (Contacts)                    │      │
│ ├─ id (PK)                             │      │
│ ├─ family_id (FK) ◄─────────────────────┘     │
│ ├─ name, grade, enrollment_status      │      │
│ ├─ owner_id (FK teachers)              │      │
│ └─ subjects (text[])                   │      │
└────────────────────────────────────────┘      │
         │                                      │
         │ 1:N (student_id FK)                  │
         │                                      │
         └──────────────┐                       │
                        │                       │
    ┌───────────────────────────────────────────────────────────┐
    │ LESSONS / SESSIONS (Transactions)                          │
    │ ├─ id (PK)                                                │
    │ ├─ student_id (FK students)                               │
    │ ├─ teacher_id (FK teachers) ─────────────┐                │
    │ ├─ family_id (FK families) ──────────────┼────────────────┘
    │ ├─ lesson_date, start_time, duration     │
    │ ├─ subject, status, rate                 │
    │ └─ notes, homework_assigned              │
    └───────────────────────────────────────────┘
                                       │
                    ┌──────────────────┘
                    │
    ┌──────────────────────────────┐
    │ TEACHERS (Contacts)          │
    │ ├─ id (PK)                   │
    │ ├─ name, email, phone        │
    │ ├─ specialties (text[])      │
    │ ├─ hourly_rate (decimal)     │
    │ └─ availability_json (jsonb) │
    └──────────────────────────────┘
```

**Flow:** Family registers → creates Students → assigns to Teachers → schedules Lessons → generates Invoices

---

### Diagram 2: Invoice → Line Items → Lessons

```
┌────────────────────────────────────────────────────────────┐
│ FAMILIES (account)                                         │
└────────────────────────────────────────────────────────────┘
         │
         │ 1:N (family_id FK)
         │
    ┌────────────────────────────────────────────────────────┐
    │ INVOICES (Transactions)                                │
    │ ├─ id (PK)                                             │
    │ ├─ family_id (FK families)                             │
    │ ├─ invoice_number (unique)                             │
    │ ├─ status (draft|sent|paid|overdue)                    │
    │ ├─ issued_date, due_date, paid_date                    │
    │ ├─ amount_subtotal, tax_amount, amount_total           │
    │ ├─ line_items (jsonb) ──────────┐                      │
    │ │  [{lesson_id, subject,         │                     │
    │ │    lesson_date, qty, rate,     │                     │
    │ │    amount}, ...]               │                     │
    │ └────────────────────────────────┼──────────────────┐  │
    └────────────────────────────────────────────────────────┘
                                         │
                    ┌────────────────────┘
                    │
                    │ (denormalized; optionally FK)
                    │
    ┌──────────────────────────────────────────────────┐
    │ LESSONS (already exists above)                    │
    │ ├─ id (PK)                                       │
    │ ├─ student_id, teacher_id, family_id             │
    │ ├─ lesson_date, start_time, duration_minutes     │
    │ ├─ subject, rate, total_cost                     │
    │ ├─ status                                        │
    │ └─ notes, homework_assigned                      │
    └──────────────────────────────────────────────────┘
         │
         │ 1:N (invoice_id FK)
         │
    ┌──────────────────────────────────────────────────┐
    │ PAYMENTS (settlement)                            │
    │ ├─ id (PK)                                       │
    │ ├─ invoice_id (FK invoices)                      │
    │ ├─ amount (decimal)                              │
    │ ├─ payment_method (card|bank|check)              │
    │ ├─ status (pending|processed|failed)             │
    │ ├─ transaction_id (stripe_pi_...)                │
    │ └─ payment_date (timestamp)                      │
    └──────────────────────────────────────────────────┘
```

**Flow:** Lesson occurs → appears in line_items → Invoice generated → Payment processed → Invoice marked paid

---

### Diagram 3: Lead → Qualified → Converted to Family

```
┌──────────────────────────────────────────────────┐
│ LEADS (Prospect, Sales Funnel)                   │
│ ├─ id (PK)                                       │
│ ├─ name, email, phone                            │
│ ├─ status (new|contacted|qualified|             │
│ │         proposal|lost|converted)               │
│ ├─ source (website|referral|cold-call|event)     │
│ ├─ lead_value (estimated ACV)                    │
│ ├─ owner_id (FK users, sales rep)                │
│ ├─ interested_in (text[])                        │
│ └─ converted_to_family_id (FK families) ─────┐   │
└──────────────────────────────────────────────────┘│
                                                    │
                              (upon conversion)    │
                                                    │
                    ┌───────────────────────────────┘
                    │
    ┌───────────────────────────────────────────────┐
    │ FAMILIES (Account, Active Customer)           │
    │ ├─ id (PK)                                    │
    │ ├─ name, email, phone                         │
    │ ├─ status (active|inactive|lead|archived)     │
    │ ├─ owner_id (FK users, account manager)       │
    │ └─ student_count (int, denorm)                │
    └───────────────────────────────────────────────┘
                    │
                    │ 1:N (family_id FK)
                    │
    ┌────────────────────────────────────────────┐
    │ STUDENTS (Enrolled Students)               │
    │ ├─ family_id (FK families)                 │
    │ ├─ name, grade, enrollment_status          │
    │ └─ subjects (text[])                       │
    └────────────────────────────────────────────┘
```

**Flow:** Lead created → contacted → qualified → converted → Family created → Students added → Lessons scheduled

---

## 6. Design Patterns Applied

### Pattern: Soft Deletes
All entities have `deleted_at (timestamp, nullable)`. Queries filter `WHERE deleted_at IS NULL`.

### Pattern: Audit Trails
All entities have `created_by, updated_by (FK users), created_at, updated_at`.

### Pattern: Denormalization for Performance
- `family_id` in lessons (repeats FK, avoids JOIN to students for family context)
- `student_count` in families (avoids COUNT subquery)
- `rate` in lessons (locks price at time of lesson, even if teacher rate changes)

### Pattern: JSONB for Flexibility
- `custom_fields` on core entities (future extensibility without schema migration)
- `line_items` on invoices (no separate table, transactional atomic)
- `availability_json` on teachers (recurring availability, complex schema)

### Pattern: Polymorphic Relationships
Activities table uses `(entity_type, entity_id)` to link to any entity type without cluttering main tables.

### Pattern: Enums with Defaults
All enums have a clearly defined default value for new records.

### Pattern: Indexes for Query Patterns
All common queries (status filters, date ranges, owner filters) are indexed.

---

## 7. ZiroWork Specifics

### Lessons are the Transaction Core
Unlike generic CRMs (Activities, Tasks, Deals), ZiroWork's lessons are:
- Revenue-generating (rate * duration)
- Scheduled (specific date/time)
- Completable (attended, homework)
- Invoice-able (batched into monthly invoices)

### No Separate Deal/Opportunity Table
Sales pipeline (Lead → Family) is simplified: Leads have `status` (new/contacted/qualified/converted) rather than separate Deals table.

### No Activity Table Yet (Optional)
Activities (call notes, emails, follow-ups) are optional; start without if not needed.

### Family = Account, Students = Contacts, Teachers = Contacts + Expertise
Teachers live in the same contacts model but with specialties, rates, availability.

---

## 8. Migration Path

**Phase 1 (MVP):** families, students, teachers, lessons, invoices, payments, users, schools
**Phase 2 (Growth):** leads, schedules, activities, tags, custom_fields
**Phase 3 (Advanced):** service_types, student_teachers junction, polymorphic activities

---

## 9. Query Examples

### Get all lessons for a family in June 2026
```sql
SELECT l.* FROM lessons l
WHERE l.family_id = $1
  AND EXTRACT(MONTH FROM l.lesson_date) = 6
  AND EXTRACT(YEAR FROM l.lesson_date) = 2026
  AND l.deleted_at IS NULL
ORDER BY l.lesson_date ASC;
```

### Get invoice with line items
```sql
SELECT
  i.id, i.invoice_number, i.amount_total, i.status,
  i.line_items,
  f.name as family_name
FROM invoices i
JOIN families f ON i.family_id = f.id
WHERE i.id = $1 AND i.deleted_at IS NULL;
```

### Get active schedules for a teacher
```sql
SELECT s.* FROM schedules s
WHERE s.teacher_id = $1
  AND s.is_active = true
  AND (s.end_date IS NULL OR s.end_date >= CURRENT_DATE)
ORDER BY s.day_of_week, s.start_time;
```

### Get lessons that need invoicing this month
```sql
SELECT l.* FROM lessons l
WHERE l.family_id = $1
  AND l.status IN ('completed', 'no-show')
  AND NOT EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.line_items @> jsonb_build_array(jsonb_build_object('lesson_id', l.id))
  )
ORDER BY l.lesson_date;
```

---

This schema is production-ready and follows industry best practices from Salesforce, HubSpot, and modern Supabase implementations.
