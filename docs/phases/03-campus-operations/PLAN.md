# Phase 3A — Attendance & Operations Insights

Status: IMPLEMENTED LOCALLY — real MongoDB and final browser release gates pending
Date: 2026-11-03
Planning method: project-local planner skill; inline source discovery and self-review. No external research or independent-agent review claimed.

## Goal
An administrator can select a date range, understand actual attendance activity, see incomplete batch setup, and open the correct records to act. Staff can use a functioning attendance report within their authorized scope.

## Current evidence
| Finding | Source | Plan response |
|---|---|---|
| API client already unwraps the Axios response; hooks return the inner data array, but the report reads `.data` again | services/api.js; hooks/useQueries.js; pages/Reports/AttendanceHistory.jsx | Dedicated report contract; normalize the report's batch options without changing all existing hook consumers |
| Report passes query configuration as an ignored second argument | AttendanceHistory.jsx versus useAttendance(options) | Give the new report hook one explicit options object |
| Attendance API returns session documents with nested attendanceRecords; report expects learner/status at the root | attendance.controller.js; AttendanceHistory.jsx | Add a scoped, flattened, paginated report endpoint |
| End date is currently interpreted as an exact timestamp; invalid pagination/date values lack validation | attendance.controller.js | Explicit inclusive calendar-date semantics and bounded validation for new reporting APIs |
| Report advertises All Batches while its data behavior is inconsistent; Save Changes has no handler | AttendanceHistory.jsx | Real all-authorized-batch reporting; read-only first delivery, remove nonfunctional editing controls |
| TEAM_LEADER has a report navigation link but the frontend route omits the role | layout/Sidebar.jsx; App.jsx | Align report routing with existing backend read policy |
| Server logs MONGODB_URI | backend/server.js | Remove connection-string logging before any server startup or database integration run |
| No academic meeting calendar or mandatory update cadence exists in Batch | models/Batch.model.js | Report recorded facts; do not invent overdue-attendance or overdue-update alerts |

## Delivery order
| Wave | Plan | Deliverable | Depends on |
|---|---|---|---|
| 1 | [03-01](03-01-reporting-foundation.md) | Reliable report end to end, isolated DB harness and safe startup | Existing Phase 2 authorization fixes |
| 2 | [03-02](03-02-attendance-insights.md) | Admin date-filtered attendance analysis | 03-01 contract and DB fixtures |
| 3 | [03-03](03-03-operations-followups.md) | Batch setup follow-ups with working destinations | 03-01 and 03-02 |

Execute each plan inline and verify its full slice before expanding. Do not begin with charts on unverified data contracts. Keep each deliverable independently reviewable; commit source/tests/docs together, then publish only after its checks pass.

## Product decisions for this phase
- Preserve #0B1F3B / #2563EB / #60A5FA / #DBEAFE / #F0F7FF, DM Sans, Lucide, light/dark themes and reduced motion.
- New analytics/operations screen is ADMIN-only in this first slice. Attendance report remains available to ADMIN, MANAGER, TEAM_LEADER, TRAINER and TA, with server-enforced batch scope. LEARNER uses the existing personal attendance flow.
- New report dates are explicit UTC calendar dates; label UTC in filters/export. Existing server-calendar 'today' dashboard counts remain unchanged. Institution timezone configuration is a separate follow-up; do not infer it from the user's device timezone.
- Default range: UTC today and the preceding 29 calendar days. Accept 1–90 inclusive days. Reject impossible dates, reversed ranges, non-string batch IDs and malformed ObjectIds with HTTP 400.
- New report pagination: page integer >=1; limit integer 1–100, default 25. Page beyond total returns an empty page with accurate total.
- All six attendance statuses get separate counts. Show sessions and recorded learner entries as different units. Defer an overall attendance-rate score and low-attendance penalties until HOLIDAY/LEAVE/HALF_DAY institutional policy is agreed.
- Export the current filtered result, not an unlabeled first page. For the first slice, support up to 5,000 rows; above this limit, explain that the date/batch range must be narrowed. Escape CSV quotes/newlines and neutralize spreadsheet formula prefixes.
- No production database writes, migrations, automatic student interventions or financial modules in this phase. Real DB tests run only against an isolated local test database.

## Acceptance / release gates
- Seeded DB fixture proves two learners in one session become two report rows; totals, pagination, CSV and charts agree.
- A session at the selected end date's 23:59:59.999 UTC is included; next-day midnight is excluded.
- Cross-batch staff requests, anonymous requests, expired/invalid tokens and mandatory-reset sessions cannot bypass existing restrictions.
- No selected batch means all *authorized* batches, never an unrestricted client-supplied scope.
- Empty periods show no records; missing dates remain null/no-record observations, not invented absence or 0% attendance.
- Changes to filters cannot show an older request as current; errors distinguish stale retained data from a successful result.
- Every operations card is derived from data and opens a working filtered management page.
- Browser UAT covers desktop/tablet/320px mobile, both themes, keyboard navigation and reduced motion; API tests use an actual isolated MongoDB for aggregation/projection coverage.
- Existing 50 regression checks continue to pass; frontend build passes against committed Vite config. No credentials, connection strings or tokens appear in test output/logs.

## Out of scope / next phases
Admissions pipeline, fees/payments, gradebooks, notifications, timetable-derived attendance alerts, institution timezone settings and inline attendance corrections remain in the master roadmap. Existing staff-account review and token revocation policy also remain separate Phase 2 release work; fixtures do not certify the production database or existing accounts.

## Execution entry
The three slices have local implementations. See [verification results](../../verification/PHASE-3A-UAT.md). The isolated MongoDB gate passed on 2026-11-04.
