# ZiroWork — Design System

Reference this before building any new view or component. This is the law.

---

## The Core Rule

**No boxes.** No `background + border + borderRadius` stacked together to make a "card." Every page in this app is a clean, flat, Attio-style layout. Content lives on the page background, separated by lines and spacing — not wrapped in boxes.

---

## Page Layout

Every view is a full-height flex column:

```jsx
<div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', background:T.bg }}>
  {/* Header */}
  <div style={{ padding:'20px 24px', borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
    <h1 style={{ fontSize:24, fontWeight:700, color:T.t1, margin:'0 0 4px 0' }}>Page Title</h1>
    <div style={{ fontSize:12, color:T.t3 }}>subtitle or count</div>
  </div>

  {/* Scrollable content */}
  <div style={{ flex:1, overflowY:'auto', padding:'16px 24px' }}>
    ...
  </div>
</div>
```

Header padding: `20px 24px`. Content padding: `16px 24px`. Never use `32px 40px` (that's the old style).

---

## KPI / Summary Numbers

**DO THIS (Attio / Financials style):**

```jsx
<div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:28, padding:'20px 24px', borderBottom:`1px solid ${T.border}` }}>
  <div>
    <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:T.t3, marginBottom:6 }}>Total Revenue</div>
    <div style={{ fontSize:24, fontWeight:700, color:T.t1, marginBottom:3 }}>$14,230</div>
    <div style={{ fontSize:11, color:T.t4 }}>Year to date</div>
  </div>
  ...
</div>
```

**NEVER DO THIS:**
```jsx
// Wrong — this is a box. Do not build this.
<div style={{ padding:'16px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:10 }}>
  <div style={{ fontSize:22, fontWeight:700 }}>$14,230</div>
</div>
```

Colored text for negative/positive values is fine — use `T.isDark ? '#4ADE80' : '#15803D'` for green, `T.isDark ? '#F87171' : '#B91C1C'` for red. Never use colored backgrounds.

---

## Tables

All tables are borderless with flush-left cell padding:

```jsx
<table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
  <thead>
    <tr style={{ borderBottom:`1px solid ${T.border}` }}>
      <th style={{ padding:'10px 0', textAlign:'left', fontWeight:600, color:T.t4, fontSize:10, textTransform:'uppercase', letterSpacing:'0.06em' }}>
        Column Name
      </th>
    </tr>
  </thead>
  <tbody>
    {rows.map(row => (
      <tr key={row.id}
        style={{ borderBottom:`1px solid ${T.border}`, background:'transparent', transition:'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = T.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <td style={{ padding:'11px 0', color:T.t1 }}>{row.name}</td>
        <td style={{ padding:'11px 0', color:T.t2 }}>{row.secondary}</td>
      </tr>
    ))}
  </tbody>
</table>
```

Rules:
- Cell padding: `'11px 0'` (no horizontal padding — the outer container provides margins)
- Header color: `T.t4` (subtle), `fontSize: 10`, `textTransform: 'uppercase'`
- Primary column: `color: T.t1`, `fontWeight: 500`
- Secondary columns: `color: T.t2`
- Muted/meta columns: `color: T.t3`
- No alternating row stripes — use hover only
- No outer `border` or `borderRadius` on the table container

---

## Status Badges

Inline badges for status values. Small pill, colored text on tinted background — no solid fill:

```jsx
// Theme-aware badge colors (always use a function, never hardcode)
const BADGE = {
  active:   { bg: T.isDark ? 'rgba(34,197,94,0.15)'  : '#D1F4E8', text: T.isDark ? '#4ADE80' : '#034636' },
  paused:   { bg: T.isDark ? 'rgba(251,191,36,0.15)' : '#FEF9C3', text: T.isDark ? '#FCD34D' : '#78350F' },
  inactive: { bg: T.isDark ? 'rgba(239,68,68,0.12)'  : '#FEE2E2', text: T.isDark ? '#F87171' : '#B91C1C' },
};
const c = BADGE[status] || { bg: T.hover, text: T.t2 };

<span style={{ display:'inline-block', padding:'2px 8px', borderRadius:12, fontSize:10, fontWeight:600, background:c.bg, color:c.text }}>
  {status}
</span>
```

---

## Section Dividers

Use `borderBottom` lines, not box wrappers, to separate sections:

```jsx
// Correct — a line
<div style={{ borderBottom:`1px solid ${T.border}`, marginBottom:20 }} />

// Correct — a label-over-line section heading
<div style={{ fontSize:10, fontWeight:700, color:T.t4, textTransform:'uppercase', letterSpacing:'0.07em', paddingBottom:8, borderBottom:`1px solid ${T.border}`, marginBottom:14 }}>
  Section Label
</div>

// Wrong — a box with all three properties together
<div style={{ border:`1px solid ${T.border}`, borderRadius:10, background:T.surface, padding:16 }}>
```

The combination of `border + borderRadius + background` = a box. Avoid it for layout sections. It's only acceptable for:
- Modals / drawers (elevated surface, intentional containment)
- Code or pre-formatted text blocks
- Input fields and select dropdowns

---

## Icons

Always use Lucide outline icons (`window.LucideReact`). Never use emoji as UI elements — they are colorful, platform-inconsistent, and clash with the flat Attio aesthetic.

```jsx
const L = window.LucideReact || {};

// Inline icon (e.g. inside a nav item or button)
{L.TrendingUp && React.createElement(L.TrendingUp, { size: 13, strokeWidth: 1.75 })}

// With color inherited from parent
{L.Settings && React.createElement(L.Settings, { size: 14, strokeWidth: 1.75, color: T.t3 })}
```

- `size`: match surrounding text (13–16px for nav, 14–16px for headings)
- `strokeWidth`: always `1.75` — heavier looks chunky, lighter disappears
- Color: inherit from parent `color` or set explicitly to a `T.*` token
- Never pass `fill` — all icons stay outline only

---

## Buttons

**Primary action:**
```jsx
<button style={{ padding:'8px 16px', borderRadius:7, border:'none', background:T.accent, color:'#fff', cursor:'pointer', fontWeight:600, fontSize:12, fontFamily:'inherit' }}>
  Save Changes
</button>
```

**Secondary / ghost:**
```jsx
<button style={{ padding:'8px 16px', borderRadius:7, border:`1px solid ${T.border}`, background:'transparent', color:T.t2, cursor:'pointer', fontWeight:500, fontSize:12, fontFamily:'inherit' }}>
  Cancel
</button>
```

No box shadows. No gradients. No colored backgrounds except `T.accent` for primary.

---

## Tab Navigation (within a page)

Tabs live in the header area, flush to the bottom border:

```jsx
<div style={{ display:'flex', gap:4, marginTop:12 }}>
  {tabs.map(tab => (
    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
      style={{
        padding:'7px 14px', borderRadius:'8px 8px 0 0', fontSize:12, fontWeight:500,
        background: activeTab === tab.id ? T.surface : 'transparent',
        color: activeTab === tab.id ? T.t1 : T.t3,
        border: activeTab === tab.id ? `1px solid ${T.border}` : '1px solid transparent',
        borderBottom: activeTab === tab.id ? `1px solid ${T.surface}` : '1px solid transparent',
        marginBottom: activeTab === tab.id ? -1 : 0,
        cursor:'pointer', fontFamily:'inherit',
      }}>
      {tab.label}
    </button>
  ))}
</div>
```

---

## Forms / Input Fields

```jsx
// Standard input
<input style={{ padding:'8px 12px', borderRadius:6, border:`1px solid ${T.border}`, background:T.bg, color:T.t1, fontSize:12, fontFamily:'inherit', width:'100%' }} />

// Field label (above input)
<label style={{ fontSize:11, fontWeight:600, color:T.t2, display:'block', marginBottom:5 }}>Field Label</label>
```

Group related fields in a CSS grid. No individual box wrappers per field.

---

## Typography Scale

| Use | Size | Weight | Color |
|---|---|---|---|
| Page title (h1) | 24px | 700 | T.t1 |
| Section title (h2) | 15–17px | 700 | T.t1 |
| Table column header | 10px | 600 | T.t4 |
| Body / table cells | 12px | 400–500 | T.t1 / T.t2 |
| Labels, meta | 11px | 500–600 | T.t2 / T.t3 |
| Timestamps, counts | 11px | 400 | T.t3 |
| Stat labels (uppercase) | 10px | 700 | T.t3 |
| Stat values (large) | 22–28px | 700 | T.t1 / accent |

---

## Theme Tokens (quick ref)

All components: `const T = window.T || {};`

| Token | Role |
|---|---|
| `T.bg` | Page background |
| `T.surface` | Slightly elevated surface (modals, inputs) |
| `T.headerBg` | Header / sidebar background |
| `T.border` | Default border color |
| `T.t1` | Primary text |
| `T.t2` | Secondary text |
| `T.t3` | Muted text |
| `T.t4` | Very subtle text (column headers, labels) |
| `T.accent` | Brand accent color |
| `T.hover` | Row hover / subtle highlight |
| `T.isDark` | Boolean — use for conditional tints |

---

## Canvas Design Pattern

When the user says **"use Canvas design"** or **"make it a Canvas"**, build the view with all of these:

```
Grid background:   backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '28px 28px'
Edge fades:        position:absolute left/right gradient overlays (80px wide, bg → transparent)
Floating nodes:    position:absolute cards, background:var(--surface), borderRadius:14, boxShadow, color-coded per stage
SVG bezier edges:  position:absolute inset:0 SVG layer, cubic bezier paths between port anchors, animated dashed strokes
Port dots:         10×10 circles at node edges, background:var(--surface), border:2px solid var(--border)
Floating header:   position:absolute top:20 left:24, no border-bottom, title + subtitle only
Expand on click:   nodes expand to show people/items, max-height transition
```

**Examples using Canvas design:** `dashboard.jsx` (DSF), `lifecycle.jsx`, `leads.jsx`

**Mobile equivalent:** Vertical cascade — same grid background, nodes stacked vertically, animated dashed connector lines between them.

---

## What Already Exists (Don't Rebuild)

| Need | Use |
|---|---|
| Icons | `window.LucideReact` — see `pages/components/icons.jsx` |
| Theme tokens | `window.T` — see `pages/utils/theme.js` |
| Status badge colors (students) | `window.getStudentStatusColors(isDark)` from `student-profile.jsx` |
| Generic badge colors | `window.getBadgeColors(isDark)` from `index.html` |
| Avatar component | `window.Avatar` from `student-roster.jsx` |

---

## Mobile Rules — Overrides

When working on mobile, these rules supersede the above. They define how desktop patterns adapt to small screens.

### Hard Rules — Break These = Revert

| Rule | Detail |
|---|---|
| No desktop damage | Mobile changes must not alter desktop layout, behavior, or styling |
| No-box rule (harder on mobile) | `background + border + borderRadius` together = forbidden. Don't. |
| No emoji icons | Always Lucide outline via `window.LucideReact`, `strokeWidth: 1.75` |
| No hardcoded colors | Always `window.T.*` tokens — light/dark must work on every screen size |
| No hover-only interactions | All interactions must be tap-reachable |
| No primary action burial | Every page's P0 action stays visible or one tap away |
| No guessing | If P0 priority or unclear — stop and ask |

### Navigation

Desktop sidebar (220px) → **slide-in left drawer overlay** on mobile.
- Hamburger icon in mobile header (top-left)
- Tapping opens full `Sidebar` as fixed overlay
- Slides in from left, dark overlay dims content
- Same 5 sections: CORE / PEOPLE / MONEY / GROWTH / ADMIN

### Tables

Wide desktop tables → **sticky first column + horizontal scroll** on mobile.
- First column: `position: sticky; left: 0; z-index: 2; background: T.bg`
- Remaining columns scroll horizontally
- First column background matches page background (no seam)
- Never convert to cards — data density loss unacceptable

Applies to: `families.jsx`, `teachers.jsx`, `invoices.jsx`, `payroll.jsx`, `financials.jsx`.

### Detail Drawers

Right-side panels → **bottom sheet slide-up** on mobile.
- Full viewport width
- Slides up from bottom edge
- Max height: 85vh with internal `overflowY: auto`
- Close: tap dark overlay or swipe down
- Close button (X) always visible

Applies to: `FamilyDetailDrawer`, `TeacherDetailDrawer`, `LeadDetailDrawer`, `StudentDrawer`.

### Lifecycle Canvas

Desktop canvas → **staggered cascade layout** on mobile.
- Cards stack vertically, single column
- Alternating left/right brick offset: 20–30px stagger per card
- `box-shadow` for depth (exception to no-box rule)
- Tap to expand inline — no new screen

### Dashboard

Dense KPI grid → **stacked priority columns** on mobile.
- KPI stats: full-width, single column, most important first
- Charts and secondary panels: below KPIs, compact height
- No 4-column grid on phone — stack to 1 column

### Forms

- Single column on phone — no two-column grid
- Labels above inputs always
- Submit button visible without scrolling
- Test every form with keyboard open before marking done

### Touch Targets

- Primary controls: minimum 48×48px
- Secondary controls: minimum 44×44px
- No icon-only buttons without label or context

### Viewport Matrix (test all)

| Width | Purpose |
|---|---|
| 320px | Smallest edge case |
| 375px | iPhone standard |
| 390px | Modern iPhone |
| 430px | Large modern iPhone |
| 768px | Tablet portrait |
| 1024px | Tablet landscape |
| 1280px | Desktop regression check |
| 1440px | Desktop regression check |

### Automatic Fail Conditions

Any one of these = revert and fix:
- Desktop layout is broken or visually regressed
- Horizontal scroll exists without intentional sticky-column justification
- Primary action is hidden on phone
- Customer cannot complete main task on phone
- Required data is inaccessible on mobile
- Form cannot be completed with keyboard open
- `background + border + borderRadius` all three applied
- Emoji used as UI icon
- Hardcoded color instead of `window.T.*`
- Mobile change applied without desktop regression check
