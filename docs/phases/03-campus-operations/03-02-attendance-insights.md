# 03-02 — Attendance insights

Wave: 2 | Status: IMPLEMENTED LOCALLY; real MongoDB gate open | Depends on: 03-01 contract
Read PLAN.md and 03-01 before implementation.

## Task 1 — Admin analytics contract
**Files:** modify backend/routes/dashboard.routes.js; create backend/controllers/insights.controller.js, backend/services/attendanceInsights.service.js, tests/attendance-insights.test.cjs and tests/integration/attendance-insights.test.cjs.

**Action:** Add ADMIN-only GET `/api/dashboard/insights?startDate&endDate&batch`. Reuse report-filter validation and the same eligible-record pipeline from 03-01. Return `{success,data:{range:{startDate,endDate,timeZone:'UTC'},summary:{sessionCount,entryCount,statusCounts},trend:[{date,sessionCount,statusCounts}|{date,sessionCount:null,statusCounts:null}]}}`. Include every requested calendar date in order, preserving explicit no-record/null observations. Counts across trend must reconcile with the report summary. No attendance percentage, projected absence, fake historical values or new attendance policy. Existing role-specific `/stats` remains unchanged.

**Verify:** seeded multi-batch/multi-day data reconciles exactly with the report API; missing day is null, an observed ABSENT entry is an actual count, and pagination never changes aggregates. Test all role denials, date/batch validation, empty period and deleted/unavailable batch references.

**Done:** a bounded, authenticated admin analytics response can be independently checked against report rows in MongoDB.

## Task 2 — Insights workspace
**Files:** create frontend/src/pages/Admin/Insights.jsx, frontend/src/components/insights/AttendanceTrend.jsx and frontend/src/components/insights/InsightsFilters.jsx; modify frontend/src/services/api.js, frontend/src/hooks/useQueries.js, frontend/src/App.jsx, frontend/src/components/layout/Sidebar.jsx and frontend/src/pages/Dashboard.jsx; create frontend/verify-campus-insights.mjs.

**Action:** Add `/insights` with ADMIN authorization at both page and API. Add the real navigation item and overview link. Offer All Batches, a valid UTC date range and 7/30/90-day presets; retain filters in URL parameters. Use React Query cache keyed by filters and the approved design system. Show session/learner-entry totals, six-status distribution and recorded-activity trend. Explain missing dates as no records; do not connect null observations as if they were measured. Provide a working report link preserving filters. Make loading/error/stale-data and no-record states explicit; no decorative interactive controls without behavior.

**Verify:** desktop/tablet/320px, both themes, reduced-motion chart behavior, keyboard date/filter operation, empty/single-day data, API failure/retry, stale response and URL reload. Report drill-through preserves the selected range/batch. All non-admin roles are blocked from this screen/API.

**Done:** an admin can change filters, read actual trends and open the matching source report.
