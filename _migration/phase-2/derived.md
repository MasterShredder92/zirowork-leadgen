# derived.md — Phase 2 fact extraction
# Commands run from repo root: c:\Users\admin\.claude\projects\zirowork-command-center-speed-to-lead

---

## 1. `grep -rn "rowHover" --include=*.jsx --include=*.js . | grep -v "92-design/"`

```
./00-command-center/command-center.jsx:158:                  onMouseEnter={e => { [...e.currentTarget.cells].forEach(td => td.style.background = T.rowHover || 'rgba(255,255,255,0.03)'); }}
./01-clients/clients.jsx:550:                onMouseEnter={e => { [...e.currentTarget.cells].forEach(td => td.style.background = T.rowHover || 'rgba(255,255,255,0.03)'); }}
./03-campaigns/campaigns.jsx:234:                onMouseEnter={e => { [...e.currentTarget.cells].forEach(td => td.style.background = T.rowHover || 'rgba(255,255,255,0.03)'); }}
./04-pages/pages.jsx:116:                        onMouseEnter={e => { [...e.currentTarget.cells].forEach(td => td.style.background = T.rowHover || 'rgba(255,255,255,0.03)'); }}
./06-conversations/conversations.jsx:146:              onMouseEnter={e => { if (selectedPhone !== t.key) e.currentTarget.style.background = T.rowHover || 'rgba(255,255,255,0.03)'); }}
./08-bookings/bookings.jsx:55:                onMouseEnter={e => { [...e.currentTarget.cells].forEach(td => td.style.background = T.rowHover || 'rgba(255,255,255,0.03)'); }}
./09-enrollments/enrollments.jsx:127:              onMouseEnter={r => { [...r.currentTarget.cells].forEach(td => td.style.background = T.rowHover || 'rgba(255,255,255,0.03)'); }}
./13-integrations/integrations.jsx:188:                    onMouseEnter={e => { [...e.currentTarget.cells].forEach(td => td.style.background = T.rowHover || 'rgba(255,255,255,0.03)'); }}
```

---

## 2. `grep -rln "design-tweaks" --include=*.html .`

```
./index.html
```

---

## 3. `grep -rn "TOKENS\." --include=*.jsx --include=*.js . | grep -v "92-design/"`

```
./90-shell/sidebar.jsx:102:      borderRadius: TOKENS.radius.xl,
./90-shell/sidebar.jsx:122:              padding: '8px 10px', borderRadius: TOKENS.radius.lg, border: 'none',
./node_modules/@babel/parser/lib/index.js:10687:      if (!TOPIC_TOKENS.includes(topicToken)) {
./node_modules/@babel/parser/lib/index.js:10688:        const tokenList = TOPIC_TOKENS.map(t => `"${t}"`).join(", ");
./node_modules/eslint/lib/rules/utils/ast-utils.js:2465:					(PLUS_TOKENS.has(leftToken.value) &&
./node_modules/eslint/lib/rules/utils/ast-utils.js:2466:						PLUS_TOKENS.has(rightToken.value)) ||
./node_modules/eslint/lib/rules/utils/ast-utils.js:2467:					(MINUS_TOKENS.has(leftToken.value) &&
./node_modules/eslint/lib/rules/utils/ast-utils.js:2468:						MINUS_TOKENS.has(rightToken.value))
./node_modules/next/dist/compiled/@edge-runtime/primitives/fetch.js:3216:        if (parameterName.length !== 0 && HTTP_TOKEN_CODEPOINTS.test(parameterName) && (parameterValue.length === 0 || HTTP_QUOTED_STRING_TOKENS.test(parameterValue)) && !mimeType.parameters.has(parameterName)) {
./node_modules/next/dist/compiled/@edge-runtime/primitives/load.js:3216:        if (parameterName.length !== 0 && HTTP_TOKEN_CODEPOINTS.test(parameterName) && (parameterValue.length === 0 || HTTP_QUOTED_STRING_TOKENS.test(parameterValue)) && !mimeType.parameters.has(parameterName)) {
```

---

## 4. `grep -rn "window.sb\|createClient\|supabase" 93-hooks/`

```
93-hooks/CONTEXT.md:12:use-supabase-table.js  — STUB: warns + returns empty. Do NOT use for real data reads.
93-hooks/CONTEXT.md:42:`use-supabase-table.js` is a stub — it warns and returns empty. It is NOT for real Supabase reads. Use specific hooks instead.
93-hooks/use-lessons.js:5: *   - window.sb (Supabase client) is initialized globally
93-hooks/use-lessons.js:47:      const { data, error: err } = await window.sb
93-hooks/use-lessons.js:71:      const { data, error: err } = await window.sb
93-hooks/use-lessons.js:97:      const { data, error: err } = await window.sb
93-hooks/use-lessons.js:117:      const { data, error: err } = await window.sb
93-hooks/use-lessons.js:148:      const { error: err } = await window.sb
93-hooks/use-local-data.js:17:// Falls back to seed data if window.sb is not available (dev without credentials).
93-hooks/use-local-data.js:33:    if (!window.sb) {
93-hooks/use-local-data.js:38:    let q = window.sb.from(table).select('*').order('created_at', { ascending: false });
93-hooks/use-local-data.js:49:    if (!window.sb) return;
93-hooks/use-local-data.js:50:    const channel = window.sb
93-hooks/use-local-data.js:56:    return () => { window.sb.removeChannel(channel); };
93-hooks/use-local-data.js:75:// NEVER pulls supabase_service_key / supabase_url (secrets must not reach the
93-hooks/use-local-data.js:86:    if (!window.sb) {
93-hooks/use-local-data.js:91:    window.sb.from('agent_tenants').select(TENANT_SAFE_COLS).then(({ data: rows, error: err }) => {
93-hooks/use-local-data.js:99:    if (!window.sb) return;
93-hooks/use-local-data.js:100:    const channel = window.sb
93-hooks/use-local-data.js:106:    return () => { window.sb.removeChannel(channel); };
93-hooks/use-pages.js:6:    if (!window.sb) { setState(s => ({ ...s, loading: false })); return; }
93-hooks/use-pages.js:7:    const { data, error } = await window.sb
93-hooks/use-students.js:5: *   - window.sb (Supabase client) is initialized globally
93-hooks/use-students.js:27:      let query = window.sb
93-hooks/use-students.js:58:      const { data, error: err } = await window.sb
93-hooks/use-students.js:84:      const { data, error: err } = await window.sb
93-hooks/use-students.js:104:      const { data, error: err } = await window.sb
93-hooks/use-students.js:125:      const { error: err } = await window.sb
93-hooks/use-supabase-table.js:10:    if (!window.sb) { setLoading(false); return; }
93-hooks/use-supabase-table.js:11:    let q = window.sb.from(table).select('*').order('created_at', { ascending: false });
```

---

## 5. Export signatures — quoted directly from each file in `93-hooks/`

### `use-is-mobile.js`

```js
window.useIsMobile = function useIsMobile(bp = 768) {
  // ...
  return mobile;
};
```
- **Name:** `useIsMobile`
- **Params:** `bp = 768` (breakpoint in px)
- **Return:** `boolean` (`mobile` — `true` if `window.innerWidth <= bp`)

---

### `use-lessons.js`

```js
function useLessons() {
  // ...
  return {
    lessons,
    fetch,
    fetchByStudent,
    insert,
    update,
    complete,
    cancel,
    remove,
    toCalendarEvent,
    loading,
    error,
  };
}

window.useLessons = useLessons;
```
- **Name:** `useLessons`
- **Params:** none
- **Return:** `{ lessons: array, fetch: fn, fetchByStudent: fn(studentId), insert: fn(payload), update: fn(lessonId, updates), complete: fn(lessonId), cancel: fn(lessonId), remove: fn(lessonId), toCalendarEvent: fn(lesson, teacherColor?), loading: boolean, error: string|null }`

---

### `use-students.js`

```js
function useStudents(familyId = null) {
  // ...
  return {
    students,
    fetch,
    fetchByFamily,
    insert,
    update,
    remove,
    loading,
    error,
  };
}

window.useStudents = useStudents;
```
- **Name:** `useStudents`
- **Params:** `familyId = null`
- **Return:** `{ students: array, fetch: fn(fId?), fetchByFamily: fn(fId), insert: fn(payload), update: fn(studentId, updates), remove: fn(studentId), loading: boolean, error: string|null }`

---

### `use-studio-context.js`

```js
function useOperatorContext() {
  return {
    operatorId: 'zirowork-operator',
    operatorName: 'ZiroWork',
    isAuthenticated: true,
    error: null,
  };
}

// Legacy alias — old views used useStudioContext; kept as no-op stub so nothing crashes.
function useStudioContext() {
  return { studioId: null, isAuthenticated: true, error: null };
}

Object.assign(window, { useOperatorContext, useStudioContext });
```
- **Name:** `useOperatorContext`
- **Params:** none
- **Return:** `{ operatorId: 'zirowork-operator', operatorName: 'ZiroWork', isAuthenticated: true, error: null }`

- **Name:** `useStudioContext` (legacy alias stub)
- **Params:** none
- **Return:** `{ studioId: null, isAuthenticated: true, error: null }`

---

### `use-supabase-table.js`

```js
function useSupabaseTable(table, filters) {
  // ...
  return { data, loading, error };
}

window.useSupabaseTable = useSupabaseTable;
```
- **Name:** `useSupabaseTable`
- **Params:** `table: string`, `filters: object|undefined`
- **Return:** `{ data: array, loading: boolean, error: object|null }`

---

### `use-pages.js`

```js
window.usePages = function usePages() {
  const [state, setState] = React.useState({ data: [], loading: true, error: null });
  // ...
  return { ...state, refetch: load };
};
```
- **Name:** `usePages`
- **Params:** none
- **Return:** `{ data: array, loading: boolean, error: object|null, refetch: fn }`

---

### `use-local-data.js`

Internal primitive (not exported directly):
```js
function _useTable(table, seedKey, filters, chanKey) {
  // ...
  return { data, loading, error, refetch: () => setTick(t => t + 1) };
}
```

Named hooks (all via `Object.assign(window, {...})`):

```js
function useClients(f)       { return _useTable('clients',        'clients',        f); }
function useCampaigns(f)     { return _useTable('campaigns',      'campaigns',      f); }
function useLeads(f)         { return _useTable('leads',          'leads',          f); }
function useConversations(f) { return _useTable('conversations',  'conversations',  f); }
function useEscalations(f)   { return _useTable('escalations',    'escalations',    f); }
function useBookings(f)      { return _useTable('bookings',       'bookings',       f); }
function useEnrollments(f)   { return _useTable('enrollments',    'enrollments',    f); }
function useOperatorTasks(f)   { return _useTable('operator_tasks',   'operator_tasks',   f); }
function useClientReports(f)   { return _useTable('client_reports',   'client_reports',   f); }
function useAutomationRules(f) { return _useTable('automation_rules', 'automation_rules', f); }
function useIntegrations(f)    { return _useTable('integrations',     'integrations',     f); }
```
- **Params (all):** `f: object|undefined` (filters, passed as `eq` key-value pairs)
- **Return (all):** `{ data: array, loading: boolean, error: object|null, refetch: fn }`

```js
function useAgentTenants() {
  // ...
  return { data, loading, error, refetch: () => setTick(t => t + 1) };
}
```
- **Name:** `useAgentTenants`
- **Params:** none
- **Return:** `{ data: array, loading: boolean, error: object|null, refetch: fn }`
- Note: selects only safe columns (excludes `supabase_service_key`, `supabase_url`)

```js
function useRollups() {
  // ...
  return React.useMemo(
    () => deriveRollups({ leads, bookings, enrollments, campaigns, escalations }, Date.now()),
    [leads, bookings, enrollments, campaigns, escalations]
  );
}
```
- **Name:** `useRollups`
- **Params:** none
- **Return:** `{ byClient: { [clientId]: { leads_30d, trials_30d, enrollments_30d, active_campaigns, open_escalations } }, byCampaign: { [campaignId]: { leads, trials, enrolled } } }`

```js
function usePageFunnel(sinceMs) {
  // ...
  return React.useMemo(
    () => derivePageFunnel({ pageEvents, clientPages, leads, bookings, enrollments }, sinceMs),
    [pageEvents, clientPages, leads, bookings, enrollments, sinceMs]
  );
}
```
- **Name:** `usePageFunnel`
- **Params:** `sinceMs: number|undefined` (lower-bound epoch ms for windowing)
- **Return:** `array` of `{ id, client_id, client_name, instrument, rawSlug, rawInstrument, status, slug, views, clicks, leads, trials, enrolled }`

Exported:
```js
Object.assign(window, {
  useClients, useCampaigns, useLeads,
  useConversations, useEscalations, useBookings, useEnrollments,
  useOperatorTasks, useClientReports,
  useAutomationRules, useIntegrations,
  useAgentTenants, deriveIntegrations,
  useRollups, deriveRollups, EMPTY_CLIENT_ROLLUP, EMPTY_CAMPAIGN_ROLLUP,
  usePageFunnel, derivePageFunnel,
});
```
