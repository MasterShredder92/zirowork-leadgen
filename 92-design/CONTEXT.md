# 92-design — Context

> ⚠️ HIGH RISK FOLDER. Changes here break the entire app visually.
> **JUDGMENT IS NOT PERMITTED.** Follow these rules exactly. Situation not covered? STOP AND ASK.

## You are here
Design system — global theme tokens, colors, icons, and design utilities. Used by every view.

## Files in this folder
```
theme.js         — ⚠️ HIGHEST RISK: exports window.T (global theme tokens). Used by every view. Break this = break everything.
design-tokens.js — spacing, radius, shadow constants
colors.js        — color palette definitions
icons.jsx        — icon components
style-helpers.js — inline style utility functions
design-tweaks.jsx — runtime design adjustments + overrides
brand/           — brand PNG assets (logo, etc.) — do not modify
```

## Enter ONLY if
Your task explicitly names: theme, design tokens, colors, icons, style helpers, `window.T`, or a specific file above.

## Do NOT enter if
- Task involves business logic or data → that is never in design files
- Task involves a specific page view → go to that folder
- Task involves global layout/navigation → go to `90-shell/`

## Load rules by sub-task
| Task | Load |
|---|---|
| Theme tokens or CSS variables | `theme.js` only — read entire file before any change |
| Color palette | `colors.js` only |
| Spacing / shadow constants | `design-tokens.js` only |
| Icon changes | `icons.jsx` only |
| Style utility functions | `style-helpers.js` only |
| Runtime tweaks | `design-tweaks.jsx` only |

## Hard stop
`theme.js` exports `window.T`. This is loaded by every single view. A typo here crashes the entire app.
Read the FULL file before touching it. Make the smallest possible change. Test both light and dark themes.
You may NOT open any file outside this folder.
If you think you need another file — STOP AND ASK first.
