# 14-settings — Context

> **JUDGMENT IS NOT PERMITTED.**
> Follow these rules exactly. If your task is not covered here — STOP AND ASK. Do not fill gaps. Do not infer.

## You are here
Settings: studio account info, user preferences, billing plan, integrations, notifications.

## Files in this folder
```
14-settings/settings.jsx — main view + all settings logic
```

## Load only
`14-settings/settings.jsx`. Nothing else.

## Hard stop
You may NOT open any file outside this folder.
This folder is standalone. There are no permitted cross-loads.
If you think you need another folder — **STOP AND ASK first.**

## Cross-loads
None. Settings is standalone. It reads from `window.currentStudio` and `window.currentUser` globals (set by `91-auth/Session.jsx`) — you do not need to open auth files to use those values.
