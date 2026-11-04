# Education Hub master plan

Date: 2026-11-03. Implementation authorized by the user's request to plan and start all work.

## Direction
Build on AttendEase as an education operations hub: clear typography, neutral surfaces, indigo accents, purposeful movement and actionable information. Keep the existing stack and role workflows. This is a multi-phase product program; the first delivery establishes trustworthy analytics and authentication UX.

## Findings from source inspection
| Priority | Finding | Evidence | Response |
|---|---|---|---|
| P1 | Admin overview uses sample context instead of backend metrics | frontend/src/pages/Dashboard.jsx, context/DataContext.jsx | Connect authenticated statistics |
| P1 | Dashboard client calls /dashboard; server exposes /dashboard/stats | services/api.js, backend/routes/dashboard.routes.js | Correct shared endpoint for all roles |
| P1 | Login authentication effect always navigates to dashboard, competing with reset redirect | pages/Login.jsx | One redirect driven by reset state |
| P1 | Today's attendance uses exact midnight equality | backend/controllers/dashboard.controller.js | Use half-open day interval |
| P1 | Team-leader attendance calculation omits learners from projection and uses unsorted records | backend/controllers/dashboard.controller.js | Audit denominator and chronological sampling before expanding analytics |
| P2 | Recent activity and service status are fabricated | pages/Dashboard.jsx | Remove claims; show available operational metrics |
| P2 | Login sidebar has fixed width on mobile, fields lack required/email/autofill semantics | pages/Login.jsx | Responsive layout, accessible inputs |
| P2 | Backend init:admin script references src/utils while server uses root folders | backend/package.json | Corrected to existing utils/initAdmin.js |
| P1 | Full login response, including token, is logged to the browser console | frontend/src/store/slices/authSlice.js | Removed response logging |
| P2 | Expanded sidebar reserves 256px on mobile | components/layout/MainLayout.jsx | Compact mobile navigation with dismissible overlay |
| P2 | No installed dependencies or established frontend regression suite in workspace | package manifests and filesystem | Restore dependencies and record checks |

These are source findings, not a claim of a complete security or runtime audit. No existing graphify-out knowledge graph or saved RAG source was found at the project root.

## Implementation sequence
### Phase 1 — Trustworthy overview and login (complete)
- [x] Replace mock admin dashboard with server totals, role distribution and batch lifecycle charts.
- [x] Add refresh, update timestamp, loading, failure, empty states and management links.
- [x] Fix shared stats route and password reset redirect race.
- [x] Animate responsive login, with reduced-motion support and keyboard labels.
- [x] Verify build, endpoint regression and browser behavior; record limitations.

### Phase 2 — Reliability and permissions (in progress)
- [ ] Inventory every screen, API and model; test ADMIN/MANAGER/TEAM_LEADER/TRAINER/TA/LEARNER access.
- [ ] Fix attendance denominator, missing projections, timezone policy and latest-session ordering.
- [ ] Audit token lifecycle, logout/reset state, registration policy, input validation and error handling.
- [ ] Replace remaining local sample contexts where used for production management screens.
- [ ] Add API integration tests with isolated test database and seeded role fixtures.

Delivered Phase 2 slice: learner-only public registration; default-password API gate; assignment-scoped trainer/TA dashboards; attendance and daily-update query scope; batch-detail authorization; attendance roster validation and learner privacy; corrected attendance update authorization; safe daily-update authorship/feedback fields; session-state cleanup and consistent user IDs. Real HTTP/JWT tests cover all six roles with database method fixtures. Live database integration is still pending.

### Phase 3 — Education operations
- **Delivered:** [Phase 3B — Reliable batch allocation](phases/03b-batch-allocation/PLAN.md): shared validation, classroom capacity and allocation preview. Isolated MongoDB and mobile browser checks passed. Concurrent saves still require a reservation strategy.
- **Current delivery:** [Phase 3A — Attendance & Operations Insights](phases/03-campus-operations/PLAN.md). Reporting, date-filtered insights and batch-setup follow-ups have local implementations. Isolated MongoDB 8.2 reconciliation passed on 2026-11-04; see [UAT](verification/PHASE-3A-UAT.md).
- [ ] Admissions/enrollment pipeline, batch capacity, trainer/TA assignments and classroom conflicts.
- [ ] Attendance trends, low-attendance follow-up and date/batch filters with explicit denominators.
- [ ] Course/topic progress, assessments, results and learner support cases.
- [ ] Action queue for missing attendance, overdue updates and incomplete allocations.
- [ ] Search, pagination, validated imports, accessible exports and audit trail.

### Phase 4 — Institutional management
- [ ] Specify fees, invoices, payments, refunds and reconciliation before adding financial models.
- [ ] Add academic calendar, announcements, notification preferences and delivery tracking.
- [ ] Define institution settings, retention policy, backups and restore checks.
- [ ] Replace service-health UI only when real telemetry exists.

### Phase 5 — Premium quality and release
- [x] Deliver shared typography/color/icon system, redesigned sidebar/workspace shell, overview charts and matching authentication surfaces (2026-11-03; see PREMIUM-UI-DESIGN.md).
- [ ] Unify navigation, breadcrumbs, tables, forms, confirmation dialogs and empty states.
- [ ] Verify mobile/tablet layouts, keyboard navigation, contrast and reduced motion across screens.
- [ ] Establish bundle budgets, lazy routes, error boundaries and monitored API performance.
- [ ] Run role-based end-to-end tests, security review and staging acceptance before release.

## First-delivery interfaces and validation
Dashboard consumes dashboardAPI.getStats() → { success, data: { summary, roleStats, batchStats } }. Summary metrics are users, active users, batches, ongoing batches, attendance sessions today and updates over seven days. Charts consume {_id, count} aggregate rows; zero records show an empty state, never invented proportions.

Review focus: failed API must not display zeros as real results; empty database must not generate sample charts; mandatory reset must win over dashboard navigation; mobile must not overflow; reduced motion must stop decorative animation.

Verification: install from lockfiles, run frontend build, backend regression tests, browser screenshots for desktop/mobile and mocked dashboard fixtures. Mocked fixtures validate UI only, not live database correctness. Live MongoDB/API validation remains a release gate.

## First delivery verification — 2026-11-03
- `npm run build` in frontend: PASS, 12,887 modules transformed. Existing warnings: old Browserslist data and an empty dom-helpers chunk.
- `node --test tests/education-hub.test.cjs`: PASS, 2 tests; both failed against original code before fixes.
- `node verify-education-hub.mjs` in frontend: PASS using installed Chrome and isolated API fixtures. Covers required email field, desktop/mobile login, reduced motion, server stats route, chart rendering, mobile dashboard overflow, refresh, empty records, stale-data error, initial-load error and mandatory-reset redirects both on restored session and submitted login.
- `node --check` for modified dashboard controller and UI verification script: PASS. `git diff --check`: PASS.
- Screenshots: docs/verification/login-desktop.png, login-mobile.png, dashboard-desktop.png, dashboard-mobile.png.
- Live MongoDB queries, full role matrix, actual admin initialization and all phases beyond Phase 1 remain unverified/pending.
- The failed Puppeteer ZIP created by this run was removed; existing browser installations were preserved. Frontend dependencies restored with browser download disabled.

## Second delivery verification — 2026-11-03
- `node --test tests/*.test.cjs`: PASS, 50 checks including the HTTP test parent. Real Express routers, JWT verification and authorization execute over loopback HTTP; database reads/writes are isolated fixtures. Sandbox loopback initially failed with EACCES; tests passed outside sandbox.
- Original failures were reproduced before fixes: public ADMIN registration returned 201; unrelated batch reads returned 200; attendance update threw `isAuthorized is not defined`; unassigned attendance/update submissions reached writes; team-leader fixture returned 300% instead of 60%; mandatory-reset API access returned 200 instead of 403.
- Current frontend production build: PASS. Browser suite: PASS, including learner-only signup choices, signup/login mobile overflow, charts, refresh and reset routing. New screenshots: docs/verification/signup-desktop.png and signup-mobile.png.
- Syntax checks and `git diff --check`: PASS.
- Current-day counts use the server calendar day consistently for admin, manager and trainer/TA. Institution timezone configuration remains pending. Team-leader percentage is based on entries in the latest 30 sessions; PRESENT/LATE/HALF_DAY count as attended, preserving the existing status policy.
- Source search found no production `useData()` consumers; the legacy sample provider is still mounted and should be retired in a later cleanup.
- Outstanding release work: live MongoDB integration and projection checks, existing staff-account review following the prior signup exposure, full endpoint inventory, token revocation policy, pagination/date validation, unified attendance-status policy, institution timezone settings and phases 3–5.
