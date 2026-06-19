> **SUPERSEDED (Phase 1+).** Tasks below are API wiring items for the pre-migration Babel/`window.*` app. They are not the migration backlog. Current work lives in `_migration/progress.md`.

# Production Wiring Checklist

**Read this when you're ready to go live.** These are all the API endpoints and integrations that need to be wired to Supabase. Ignore until production.

## Code TODO Locations

Inline TODOs have been consolidated here. Code locations that reference these:

| Code Location | Task | Checklist Ref |
|---|---|---|
| `04-families/family-detail-drawer.jsx:314` | Assign new teacher | Line 61 |
| `04-families/family-detail-drawer.jsx:358` | Switch teacher | Line 62 |
| `04-families/family-detail-drawer.jsx:367` | Save teacher switch | Line 62 |
| `04-families/family-detail-drawer.jsx:400,466` | Fetch family schedule | Line 64 |
| `04-families/family-detail-drawer.jsx:530,544` | Document operations | Lines 67-68 |
| `04-families/family-detail-drawer.jsx:824` | Supabase Storage upload | Line 70 |
| `03-leads/lead-detail.jsx:97` | Form responses | Line 99 |
| `90-shell/role-switcher.jsx:12` | Switch role | Line 105 |
| `00-dashboard/dashboard.jsx:291,372,387` | Saved views + stats | Lines 101-104 |
| `14-settings/settings.jsx:131` | Permissions matrix | Line 98 |

---

## Invoices (`08-invoices/invoices.jsx`)

- [ ] **POST /api/invoices/{detail.id}/send** — Generate PDF, store in Supabase Storage, send email + SMS to family, update status to "outstanding"
- [ ] **Pagination: GET /api/invoices?page=N&limit=50&status=&search=&sort=** — Wire paginated invoice list with filters
- [ ] **Bulk "Send Reminder"** — Email + SMS to all selected families

---

## Payroll (`09-payroll/payroll.jsx`)

- [ ] **POST /api/payroll/export { format, method, period }** — Export teacher hours as CSV/ACH/PDF with Direct Deposit or Check payment

---

## Financials (`10-financials/financials.jsx`)

- [ ] **POST /api/financials/expenses** — Create expense record
- [ ] **POST /api/financials/import-bank** — Bank import modal integration

---

## Services / Studio Settings (`07-services/services.jsx`)

- [x] **GET studio_settings** — Fetch on mount via supabase.from('studio_settings').select('*').eq('studio_id', studioId)
- [x] **UPSERT studio_settings** — Save rates, instruments, tiers via supabase.from('studio_settings').upsert(payload, { onConflict: 'studio_id' })

---

## Roster / Students (`05-students/student-roster.jsx`)

- [ ] **GET /api/students?studio_id={id}** — Replace window.MOCK_DATA.students with live fetch
- [ ] **Add enrollment status filter** — Once student.status field exists in API

---

## Student Detail (`05-students/student-profile.jsx`)

- [ ] **Lessons** — Fetch from Supabase join; mutate via REST
- [ ] **Student notes** — supabase.from('student_notes').select('*,author:users(name)')
- [ ] **POST /api/student_notes { student_id, text }** — Create note
- [ ] **PATCH /api/students/{student.id} { draft }** — Save draft status
- [ ] **GET /api/students?family_id={id}** — Wire student list fetch

---

## Student List (`04-families/family-roster.jsx`)

- [ ] **GET /api/students?family_id={id}** — Replace mock fetch with Supabase query

---

## Family Detail (index.html)

- [ ] **POST /api/students { family_id, first_name, last_name, instrument, age }** — Create student record
- [ ] **POST /api/families/{id}/teachers** — Assign new teacher
- [ ] **PATCH /api/families/{id}/teachers/{old_id} { new_teacher_id }** — Switch teacher
- [ ] **GET /api/families/{id}/invoices** — Fetch family invoices
- [ ] **GET /api/families/{id}/schedule** — Fetch schedule
- [ ] **GET /api/families/{id}/schedule** — Real day/time/rate data
- [ ] **GET /api/invoices/{id}/download** — Download invoice
- [ ] **DELETE /api/families/{id}/documents/{doc.id}** — Delete document, add timeline event
- [ ] **POST /api/families/{id}/documents** — Upload document
- [ ] **GET /api/families/{id}/timeline** — Replace mock timeline with live fetch
- [ ] **Supabase Storage** — Replace data-URL storage with file upload
- [ ] **POST /api/families/{id}/notes { text, author_id }** — Create family note
- [ ] **Supabase auth** — Pull currentUser from auth session

---

## Teachers / TeachersCRM (`06-teachers/teachers.jsx`) ✓ WIRED

- [x] **Fetch teachers** — SELECT * FROM teachers WHERE studio_id=?; enrich with lesson count
- [x] **Create teacher** — INSERT into teachers (name, email, phone, instruments, status)
- [x] **Update teacher info** — PATCH teachers (name, email, phone, instruments, status)
- [x] **Delete teacher** — UPDATE teachers SET status='inactive' (soft delete via status)
- [x] **Active students count** — JOIN lessons where teacher_id, COUNT(DISTINCT student_id)
- [ ] **POST /api/teachers/{teacher.id}/availability** — Teacher availability scheduling (calendar detail modal)

---

## Calendar (`01-schedule/calendar.jsx`)

- [x] **Fetch lessons** — SELECT * FROM lessons filtered by studio_id
- [x] **Create lesson modal** — Wired to insert lessons table
- [x] **Reschedule (drag/modal)** — UPDATE lessons SET day=?, time=?
- [x] **Mark complete** — UPDATE lessons SET status='completed'
- [x] **Cancel lesson** — UPDATE lessons SET status='cancelled'
- [ ] **Recurring schedule expansion** — Not yet wired (requires schedules table)

---

## Leads / Sales Pipeline (index.html)

- [ ] **POST /api/leads** — Create new lead
- [ ] **Replace mock leads array** — Live fetch on mount: GET /api/leads?studio_id={id}
- [ ] **PATCH /api/leads/{id} { pipeline_stage }** — Move lead to new pipeline stage
- [ ] **POST /api/leads/{id}/enroll** — Enroll lead as new Student (2-step operation)
- [ ] **PATCH /api/leads/{id} { status: 'archived' }** — Archive lead as lost
- [ ] **POST /api/leads/{id}/contact-attempt** — Log contact attempt
- [ ] **PATCH /api/leads/{id} { pipeline_stage }** — Save pipeline stage change from detail page

---

## Settings / Administration (index.html)

- [ ] **POST /api/permissions** — Save updated permissions matrix
- [ ] **GET /api/enrollment-form** — Fetch form_responses from enrollment form submission
- [ ] **POST /api/users/{id}/daily-checkin** — Log daily start event
- [ ] **GET /api/saved-views?user_id={id}** — Fetch saved views on mount, merge/replace localStorage
- [ ] **POST /api/saved-views** — Persist custom views to Supabase user profile
- [ ] **DELETE /api/saved-views/{id}** — Delete saved view
- [ ] **GET /api/dashboard/stats** — Fetch live dashboard stats on mount + 30s poll
- [ ] **POST /api/auth/switch-role** — Switch between roles/studios

---

## Quick Entry / Invoicing (index.html)

- [ ] **Smart fill:** GET /api/families/{id}/schedule to pre-fill amount in Quick Entry invoice modal
