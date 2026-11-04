# Phase 3B — Reliable batch allocation

Status: IMPLEMENTED, with the concurrent-save limitation below. Date: 2026-11-05.

## Goal
An administrator can assign learners, trainers and classrooms with clear capacity and date-conflict feedback. Saving uses the same rules as the preview. Preserve the existing palette, typography and mobile layout.

## Source findings
`backend/controllers/batch.controller.js` already validates trainer/learner/classroom overlap against PLANNING and ONGOING batches. Creation and updates use separate paths. Availability helpers accept a start date, whereas save checks consider both dates. `Classroom.capacity` exists; batch creation does not compare it with enrollment. TA assignment checks role/activity; there is no established exclusive-TA policy.

## Decisions
- ADMIN remains the only allocation writer. Preserve existing scoped read permissions.
- Preserve current inclusive batch-date overlap: newStart <= existingEnd and newEnd >= existingStart. This is whole-program allocation; it does not claim to model teaching sessions or a timetable.
- Require valid ordered dates and unique ObjectId assignment arrays. Validate active user roles and active classroom references before writes. Empty assignments remain allowed for draft setup.
- Enforce classroom capacity against distinct enrolled learners whenever the room, roster or dates/status are saved. No classroom means an explicit unassigned state.
- PLANNING/ONGOING allocations reserve resources. COMPLETED/CANCELLED records do not reserve future resources; retain their assignment history and validate references without blocking historical overlaps.
- Do not introduce TA exclusivity, batch capacity fields, migrations or automatic reassignment without an institutional requirement.
- Preview is advisory. Save reruns validation. Concurrent conflicting saves remain a documented risk until a separately designed reservation/transaction strategy exists; do not claim concurrency guarantees.

## Plan 03B-01 — Shared validation (wave 1)
### Task 1: Extract allocation rules
**Files:** create backend/services/batchAllocation.service.js and tests/batch-allocation.test.cjs; modify backend/controllers/batch.controller.js.
**Action:** Centralize normalized candidate validation, inclusive overlap queries, self-exclusion, role/activity checks and capacity errors. Return structured issue codes and field references. Whitelist writable batch fields; reject malformed dates/IDs/arrays with 400 before database work. Updates validate the merged candidate, including status-only reactivation.
**Verify:** unit cases cover duplicate IDs, malformed dates, partial updates, empty rosters, boundary-day overlap, self-edit, inactive/orphan resources and capacity at/beyond limit.
**Done:** create and update call one validator and reject invalid candidates before any writes.

### Task 2: Prove writes with isolated MongoDB
**Files:** tests/integration/batch-allocation.test.cjs; reuse tests/integration/helpers/testDatabase.cjs.
**Action:** Seed actual users, rooms and batches in a generated local test database. Exercise authenticated create/update, rejected writes and learner assignment bookkeeping.
**Verify:** conflicts/capacity failures leave both batch and user records unchanged; valid allocations persist; all non-admin writes receive 403; historical statuses and reactivation follow the defined policy.
**Done:** real HTTP/MongoDB tests pass with no production URI or data access.

## Plan 03B-02 — Allocation preview and UI (wave 2)
### Task 1: Add advisory preview
**Files:** backend/routes/batch.routes.js, backend/controllers/batch.controller.js, frontend/src/services/api.js; add HTTP tests.
**Action:** Add ADMIN-only POST /api/batches/allocation-preview before /:id routes. Accept candidate fields and optional existing batch ID; load/merge existing records server-side, validate inputs, and call the shared validator without writes. Return issues, room capacity/enrollment counts and normalized date range. Bound input array lengths and omit private contact fields from conflicts.
**Verify:** anonymous/reset/staff denial, no writes, malformed candidate handling and identical preview/save issue codes for a stable fixture.
**Done:** preview and save share authoritative rules.

### Task 2: Integrate the batch form
**Files:** frontend/src/pages/Admin/Batches.jsx; create frontend/verify-batch-allocation.mjs.
**Action:** Show enrolled count versus room capacity, field-specific issues and a working Check allocation action. Invalidate preview when candidate inputs change; discard out-of-order replies. Show save failures inline, preserve entered values, and rerun checks after successful edits. Retain normal unassigned draft workflow and existing focused-batch links.
**Verify:** keyboard operation, 320px/tablet/desktop, both themes, changed dates/room/roster, pending/error states and slow response arriving after a newer candidate.
**Done:** an administrator can understand and correct an allocation failure without losing the form.

## Plan 03B-03 — Release (wave 3)
### Task 1: Reconcile and publish
**Files:** docs/verification/PHASE-3B-UAT.md; update docs/EDUCATION-HUB-MASTER-PLAN.md.
**Action:** Run existing Node regressions, new isolated MongoDB tests, relevant browser fixtures and production build with committed Vite configuration. Record exact results and concurrency limitation. Publish only this phase's files under existing authorization.
**Verify:** no regression in reports/insights/reset routing; user-local Vite configuration and unrelated assets remain excluded.
**Done:** verified implementation and evidence are pushed; remaining roadmap items stay explicitly open.

Execution starts at 03B-01 Task 1. No new libraries or schema changes are required.

## Current execution evidence
The shared candidate validator checks required fields, date ordering, unique IDs, active roles and classroom capacity. Preview and save call the same overlap helpers. The batch form shows preview issues and capacity. Node regressions passed (57 tests), isolated MongoDB integration passed (4 tests), and the production frontend build passed. Authenticated MongoDB writes proved capacity rejection leaves no batch, valid creation persists, and status-only reactivation cannot bypass a resource conflict. The mobile browser fixture passed. Concurrent conflicting saves are still possible because reservations are not transactional; this requires a separate transaction design before claiming strict concurrency safety.
