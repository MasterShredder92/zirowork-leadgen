# 91-auth — Context

> **JUDGMENT IS NOT PERMITTED.** Follow these rules exactly. Situation not covered? STOP AND ASK.

## You are here
Auth — login, signup, and session management. In Phase 2, auth is bypassed: Session.jsx seeds globals directly.

## Files in this folder
```
Session.jsx           — auth bypass + ReactDOM mount, seeds window.currentUser + window.currentOperator, exports window.Root
Login.jsx             — login form UI
Signup.jsx            — signup form UI
onboarding.jsx        — new user onboarding flow (auth-side, not client onboarding)
SharedComponents.jsx  — shared form components used across Login, Signup, onboarding
```

## Enter ONLY if
Your task explicitly names: auth, login, signup, session, `window.currentUser`, `window.currentOperator`, or `window.Root`.

## Do NOT enter if
- Task involves client onboarding (music school) → go to `02-onboarding/`
- Task involves the sidebar/header reading auth globals → those reads are in `90-shell/`, not here
- Task involves seed data → go to `93-hooks/use-local-data.js`

## Load rules by sub-task
| Task | Load |
|---|---|
| Auth globals (currentUser / currentOperator) | `Session.jsx` only |
| Login page changes | `Login.jsx` only |
| Signup page changes | `Signup.jsx` only |
| New user onboarding flow | `onboarding.jsx` + `SharedComponents.jsx` if needed |

## Hard stop
`window.currentUser` and `window.currentOperator` are set here and read everywhere else. Change them carefully.
You may NOT open any file outside this folder.
If you think you need another file — STOP AND ASK first.
