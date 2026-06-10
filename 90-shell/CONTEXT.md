# 90-shell — Context

> **JUDGMENT IS NOT PERMITTED.** Follow these rules exactly. Situation not covered? STOP AND ASK.

## You are here
App shell — navigation, routing, header, workspace overlay. Wraps all page views.

## Files in this folder
```
Router.jsx           — main app entry point, renderMain() maps routes to views, exports window.App
sidebar.jsx          — left nav + command palette, exports window.Sidebar, window.CommandPalette
Header.jsx           — top bar, exports window.MobileHeader, window.ComingSoon
user-menu.jsx        — user profile dropdown (used inside Header)
workspace-overlay.jsx — workspace switching overlay
```

## Enter ONLY if
Your task explicitly names: routing, sidebar, navigation, the shell, the app frame, or a specific file listed above.

## Do NOT enter if
- Task involves a specific page view (00–15) → go to that folder
- Task involves auth or login → go to `91-auth/`
- Task involves design tokens or theme → go to `92-design/`

## Load rules by sub-task
| Task | Load |
|---|---|
| Add or change a route | `Router.jsx` only — check renderMain() for duplicates before adding |
| Sidebar nav item | `sidebar.jsx` only |
| Header or mobile header | `Header.jsx` only |
| User menu changes | `user-menu.jsx` only |
| Workspace overlay | `workspace-overlay.jsx` only |

## Hard stop
Router.jsx `renderMain()`: duplicate route cases silently overwrite each other — always read the full switch before adding a case.
You may NOT open any file outside this folder.
If you think you need another file — STOP AND ASK first.
