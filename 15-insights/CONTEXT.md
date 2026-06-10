# 15-insights — Context

> **JUDGMENT IS NOT PERMITTED.**
> Follow these rules exactly. Situation not covered? STOP AND ASK.

## You are here
Insights: AI-driven analytics, trend detection, studio health metrics. Read-only aggregator — never writes to other folders.

## Files in this folder
```
insights.jsx  — main view + all insights logic, exports window.InsightsView
```

## Enter ONLY if
Your task explicitly names: insights, analytics, trend detection, route `insights`, or `window.InsightsView`.

## Do NOT enter if
- Task involves standard performance reports → go to `10-reporting/`
- Task involves operator KPIs → go to `00-command-center/`
- Task involves seed data → go to `93-hooks/use-local-data.js`

## Load only
`15-insights/insights.jsx` — nothing else unless a cross-load below explicitly applies.

## Cross-loads (conditional — read-only only)
Insights aggregates metrics but never writes to other folders.

| Only if your task involves... | Also load | What to look for |
|---|---|---|
| Student retention or churn metrics | `09-enrollments/enrollments.jsx` | status + date fields only |
| Revenue or booking trend data | `08-bookings/bookings.jsx` | total/date fields only |
| Client-level performance data | `10-reporting/reporting.jsx` | per-client count fields only |

Load only the specific file for the metric you are building. Do not speculatively load multiple folders.

**Note:** There is no teacher/staff data in the current CRM schema. If your task requires teacher utilization metrics — STOP AND ASK before proceeding.

## Hard stop
You may NOT open any file outside this folder except for an explicit cross-load row above.
If you think you need something not listed — STOP AND ASK first.
