# Stage 02 — Wire API

Replace a mock data source with a live Supabase call. All wiring tasks are listed in `.brain/whats-left.md` — search there, not in source files.

---

## Input

| Resource | Load When | What You Gain |
|---|---|---|
| `.brain/current-state.md` | Every run | Current state — what is in progress, what is broken |
| `.brain/whats-left.md` | Every run | Master list of all API wiring tasks — find the task here first |
| Target folder `CONTEXT.md` (e.g. `03-leads/CONTEXT.md`) | Every run | Hard-stop rules and cross-load table for that folder — read before touching any file in the folder |
| `94-knowledge/api-contract.md` (endpoint section only) | Every run | Exact method / path / body shape / response shape for this endpoint |
| `94-knowledge/database-schema.md` (relevant table section) | Every run | Column names, types, FK relationships — verify against API spec before writing |
| Target source file | Every run | Current mock data shape and how it's used in the component |

**Pre-condition:** You know which wiring task is being addressed. Open `.brain/whats-left.md` to find the task — it lists every endpoint, the target file, and current status. `94-knowledge/api-contract.md` has the full endpoint spec.

---

## Process

1. Open `.brain/whats-left.md`. Find the wiring task — note the target file and endpoint.
2. Open `94-knowledge/api-contract.md`. Find the endpoint. Note: method, path, body shape, response shape.
3. Open `94-knowledge/database-schema.md`. Verify the table and column names match the API spec. If they diverge, stop and flag to the user before proceeding.
4. Read the target source file. Understand the current mock data structure and how it's used in the component.
5. Confirm the mock data shape matches the API response shape. If they diverge, note every field that differs — the component will need updates.
6. **DANGER:** Do not run any Supabase migration or schema change without explicit user approval. This stage is for client-side wiring only.
7. Replace the mock `useState` initial value with an empty array / null. Add a `useEffect` that calls the API on mount.
8. Use the Supabase JS client pattern:
   ```js
   useEffect(() => {
     supabase.from('table').select('*').eq('studio_id', studioId).then(({ data, error }) => {
       if (error) console.error(error);
       else setState(data);
     });
   }, [studioId]);
   ```
9. Add a loading state (`const [loading, setLoading] = useState(true)`) and show a spinner or skeleton while data loads.
10. Handle errors — show an error state if the API call fails, not a blank screen.
11. Mark the task complete in `.brain/whats-left.md`.
12. Verify the view loads correctly with live data in the browser.
13. Run stage `00-session-close`.

**Note on `daysInStage` (Leads):** This field is server-computed from `stage_entered_at`. Never compute it on the frontend. Use the value from the API response directly.

---

## Output

- Mock data replaced with live Supabase call
- Loading state added
- Error state handled
- Task marked complete in `.brain/whats-left.md`
- View verified in browser with live data

---

## Completion

Done when:
- The component fetches real data on mount
- Loading and error states are handled
- Task marked complete in `.brain/whats-left.md`
- The view renders correctly

Next: run stage `00-session-close`. If this was the Leads endpoint, the enrollment flow (`POST /api/students` from a lead card) is the next wiring task.
