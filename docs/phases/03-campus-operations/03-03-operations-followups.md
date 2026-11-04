# 03-03 — Actionable batch follow-ups

Wave: 3 | Status: IMPLEMENTED; isolated MongoDB gate passed | Depends on: 03-01 and 03-02
Read PLAN.md before implementation.

## Task 1 — Data-backed operations queue
**Files:** create backend/controllers/operations.controller.js, backend/services/operations.service.js, tests/operations-followups.test.cjs and tests/integration/operations-followups.test.cjs; modify backend/routes/dashboard.routes.js.

**Action:** Add ADMIN-only GET `/api/dashboard/operations?startDate&endDate&batch` with shared validation. Consider PLANNING/ONGOING batches intersecting the selected UTC range. Produce one row per batch with `batchId`, `code`, `name`, `status`, `issues` and `recordedSessionCount`. Issue codes are NO_TRAINER, NO_CLASSROOM and NO_LEARNERS, derived from actual assignments; missing referenced documents count as incomplete setup. Sort deterministically by issue count DESC, startDate ASC, id ASC. Return a maximum of 100 rows plus total/truncated metadata and applied UTC range. A zero recorded-session count is informational, never 'overdue' or 'absent': the project has no meeting schedule. Missing TA and daily updates are not failures without a configured requirement. No writes, notifications or automatic follow-up actions.

**Verify:** fixtures cover complete/incomplete batches, orphaned references, cancelled/completed exclusion, range intersection, multiple issues in one batch, no false missing-TA flags, informational zero sessions, stable order and truncated response. Prove all non-admin roles receive 403 and invalid dates/IDs receive 400.

**Done:** every queue item is explainable from current model data, without assuming a teaching calendar or inventing institutional rules.

## Task 2 — Follow-up actions and release verification
**Files:** create frontend/src/components/insights/OperationsQueue.jsx; modify frontend/src/pages/Admin/Insights.jsx, frontend/src/pages/Admin/Batches.jsx, frontend/src/services/api.js and frontend/verify-campus-insights.mjs; create docs/verification/PHASE-3A-UAT.md; update docs/EDUCATION-HUB-MASTER-PLAN.md.

**Action:** Add a compact, accessible 'Needs setup' queue with clear issue labels, loading/error/complete states and truncation notice. Its Manage Batch link navigates to `/batches?focus=<id>`. Teach Batches to honor focus only within its already-authorized fetched records, show the matching batch with a clear-filter control, and offer its existing edit flow. Do not auto-save or auto-open destructive operations. Connect 'View recorded sessions' to the scoped report with batch/range parameters. Preserve the palette, fonts and reduced-motion behavior.

**Verify:** click each queue destination and confirm the intended authorized batch/report is shown; inaccessible/unknown focus IDs reveal no foreign record. Test 320px, both themes, keyboard navigation, zero issues, all API errors and queue refresh after an assignment update. Run existing 50 checks plus new unit/real-DB/browser tests and a production build with committed Vite config. Record actual commands/results, environment limits and screenshots; never label fixture-only runs as live-DB proof.

**Done:** the admin can move from a real issue to its working management screen. Phase 3A is complete only when real-DB reconciliation and role gates pass; publish verified changes to the existing main branch without unrelated user files.
