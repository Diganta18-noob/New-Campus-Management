# 03-01 — Reliable attendance reporting

Wave: 1 | Status: IMPLEMENTED; isolated MongoDB gate passed | Depends on: existing auth/scope fixes
Read PLAN.md first; its constraints apply to every task.

## Task 1 — Safe application bootstrap and real DB fixture harness
**Files:** modify backend/server.js; create backend/app.js, tests/integration/helpers/testDatabase.cjs and tests/integration/reporting-bootstrap.test.cjs; update backend/package.json.

**Action:** Extract Express application/middleware/routes into an importable app without starting a listener or connecting to MongoDB. Keep production connection/retry/listen behavior in server.js. Remove console logging of MONGODB_URI. Introduce an integration harness using explicit TEST_MONGODB_URI, loopback host only, and a unique `campus_test_` database name per run. Never fall back to MONGODB_URI or clear an arbitrary existing database. Teardown may drop only the exact generated test database after validation. If a local MongoDB server is unavailable, report the integration gate as blocked; do not substitute fixtures and claim DB validation.

**Verify:** importing app does not start a listener/connect; existing HTTP middleware tests still pass; integration harness refuses missing URI, remote host and a non-test database; test output contains no synthetic credential/URI value. Add `test:integration` with an explicit Node test path; keep existing `test` behavior intact.

**Done:** application can be mounted in actual HTTP/MongoDB tests safely; no database credential logging occurs.

## Task 2 — Scoped flattened report endpoint
**Files:** modify backend/routes/attendance.routes.js and backend/controllers/attendance.controller.js; create backend/services/attendanceReport.service.js, backend/utils/reportFilters.js, tests/attendance-report.test.cjs and tests/integration/attendance-report.test.cjs.

**Action:** Add GET `/api/attendance/report`, registered before `/:id`, with protect and authorize for ADMIN/MANAGER/TEAM_LEADER/TRAINER/TA. Reuse the controller's server-derived batch scope before aggregation; never allow requested batch to replace it. Validate date/id/page/limit with PLAN.md bounds. Aggregate match authorized sessions, unwind attendanceRecords, join only needed learner/marker/batch fields, and return `{success,data:{rows,total,page,limit,summary,range}}`. Rows have `rowId`, `sessionId`, `date`, `batch:{id,name,code}`, `learner:{id,firstName,lastName}`, `status`, `remarks`, `markedBy:{id,firstName,lastName}|null`, `isLocked`. Stable rowId is sessionId + learnerId; stable ordering is date DESC, sessionId DESC, learnerId ASC. Summary includes session count, entry count and counts keyed by all six statuses, across the entire filtered range, independent of pagination. No password/email/phone fields are needed in this response.

**Verify:** fixture of two sessions/three learner entries returns total=3 and sessionCount=2; page size 2 returns two rows then one, without repeats. Test all six read roles plus invalid/missing credentials and mandatory-reset gate; LEARNER receives 403. Test invalid filters, end-of-day boundary, all-authorized batches, inaccessible requested batch and no records. Verify actual MongoDB aggregation and populated identities.

**Done:** endpoint contract and authorization are proven over real HTTP with an isolated database; current GET `/attendance` contract is unchanged.

## Task 3 — Repair the report screen and CSV
**Files:** modify frontend/src/services/api.js, frontend/src/hooks/useQueries.js, frontend/src/pages/Reports/AttendanceHistory.jsx and frontend/src/App.jsx; create frontend/src/utils/attendanceCsv.js, tests/attendance-csv.test.cjs and frontend/verify-attendance-report.mjs.

**Action:** Add `attendanceAPI.getReport(filters)` and `useAttendanceReport({batch,startDate,endDate,page,limit,enabled})`. Use primitive filter values in the query key; return the data envelope once. Leave existing hooks' contracts intact. Normalize useBatches' array only at this consumer. Replace the report's nested-record assumptions with report rows, real totals and pagination; enable All Batches, UTC date labels, URL-initialized `batch/startDate/endDate` and loading/error/empty states. Include TEAM_LEADER in the frontend report route. Read-only first delivery: remove the unused edit dialog and nonfunctional Save Changes button. Export all filtered pages up to the defined 5,000-row limit; pin filters during export, use shared CSV escaping/formula protection, and label the UTC range in the download. Never silently export only page one.

**Verify:** browser fixtures and isolated-DB E2E show the right learner names/statuses, distinct session/entry totals, All Batches behavior, date changes, page navigation and authorization errors. Export fixture with quotes, commas, multiline remarks, formula prefix and >1 page matches the report total; >5,000 rows is explicitly blocked. Test a rapid filter change with responses arriving out of order. Capture both themes and 320px layout; preserve existing auth/dashboard browser checks.

**Done:** an authorized staff member can open, filter, page and export a real report without hidden data-shape failures or dead editing controls.
