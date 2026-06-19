> **SUPERSEDED (Phase 1+).** New views now go into `src/app/` (App Router) and `src/components/`. Steps below describe adding views to the pre-migration Babel/`window.*` app including patching `index.html` and updating the old CLAUDE.md tree. See `/CLAUDE.md` for current approach and phase gates.

# Stage 03 — Add View

Adding a new page/view to the ZiroWork app.

---

## Input

| Resource | Load When | What You Gain |
|---|---|---|
| `.brain/current-state.md` | Every run | Where we left off — existing views, recent changes |
| Target folder `CONTEXT.md` (e.g. `07-services/CONTEXT.md`) | Every run | Hard-stop rules for that folder before creating any file |
| `94-knowledge/architecture.md` (Navigation / Views section) | Every run | Existing view routing pattern, script load order, `renderMain()` switch structure |
| `90-shell/sidebar.jsx` | Every run | NAV_ITEMS array — where to add the new nav entry |

Root `CLAUDE.md` Safety Gates covers shared exports — no separate file needed.

**Pre-condition:** You know the view key (string passed to `setView()`), the component name, the nav position number, and what the new view needs to display.

---

## Process

1. Create the numbered folder at `<NN>-<feature>/`. Follow the nav order in root `CLAUDE.md` tree.
2. Create the component file inside: `<NN>-<feature>/<view-name>.jsx`. Lowercase-hyphenated.
3. In the new `.jsx` file: access theme via `const T = window.T || {};`. Never import theme — it's global.
4. If the view uses status badges, use `window.getStudentStatusColors` or `window.getBadgeColors`. Do not define a local color function.
5. Export the component to window at the bottom: `window.YourComponent = YourComponent;`
6. Open `index.html`. Find the `<script>` block for the relevant nav section. Add `<script type="text/babel" src="<NN>-<feature>/<view-name>.jsx"></script>`. Load order matters — add after any dependencies.
7. Open `90-shell/Router.jsx`. Find `renderMain()`. Add a new `case '<view-key>':`. Pattern:
   ```js
   case 'your-view': return window.YourComponent ? React.createElement(window.YourComponent, {}) : <ComingSoon label="Your View" />;
   ```
8. Open `90-shell/sidebar.jsx`. Find `NAV_ITEMS`. Add the nav entry with label, icon, and view key.
9. Update root `CLAUDE.md` Repo Tree — add the new numbered folder line with `window.X` global and route key.
10. Verify: open `index.html` in browser. Click the nav item. Confirm view renders without errors.
11. Run stage `how-to/session-close`.

**STOP:** Do NOT add a duplicate case to `renderMain()`. One case per view key, no exceptions.

---

## Output

- New `<NN>-<feature>/<view-name>.jsx` component file
- `<script>` tag added to `index.html`
- New `case` added to `renderMain()` switch in `90-shell/Router.jsx`
- Nav entry added to `90-shell/sidebar.jsx`
- Root `CLAUDE.md` Repo Tree updated

---

## Completion

Done when:
- View renders correctly in browser via nav click
- No duplicate switch cases exist
- Root `CLAUDE.md` tree reflects the new folder

Next: run stage `how-to/session-close`.
