# Screens, APIs and role scope

All routes under `/api` except registration, login and health require a valid JWT. Password-reset-required accounts may call only their profile, password change and logout endpoints until the reset succeeds. Sidebar visibility is only a convenience; server authorization is authoritative.

| Area | Screen(s) | API prefix | Read | Write |
|---|---|---|---|---|
| Identity | Login, Signup, Reset password, Profile | `/auth` | Own profile | Public learner signup; own password/logout |
| Overview | Dashboard | `/dashboard/stats` | All roles, scoped by role | — |
| Campus insights | Insights | `/dashboard/insights`, `/dashboard/operations` | ADMIN | — |
| People | People directory, Trainers, TAs | `/users` | ADMIN | ADMIN |
| Departments | Departments | `/departments` | Authenticated | ADMIN |
| Batches | Batches | `/batches` | Authenticated, assignment scoped | ADMIN |
| Classrooms | Classrooms | `/classrooms` | ADMIN, MANAGER, TRAINER, TA | ADMIN, MANAGER |
| Courses | Courses & topics | `/topics` | ADMIN, MANAGER | ADMIN |
| Attendance | Mark attendance, My attendance, Attendance history | `/attendance` | Authenticated and record scoped; reports exclude LEARNER | TRAINER/TA assigned to batch; ADMIN updates/locks |
| Daily updates | Daily updates, Review updates | `/daily-updates` | Authenticated and visibility scoped | Assigned TRAINER/TA, feedback by MANAGER/TEAM_LEADER |
| Audit | Audit trail | `/audit` | ADMIN | System generated |
| Calendar and notices | Calendar & notices | `/campus-posts` | Authenticated, audience/batch scoped | ADMIN; readers acknowledge notices |
| Assessments | Assessments & results | `/assessments` | Authenticated, batch scoped; learner sees published own result | Assigned TRAINER/TA or ADMIN grades/publishes |
| Support | Learner support | `/support-cases` | Owner learner or authorized batch staff | Owner creates/replies; staff replies/sets status |
| Admissions | Enrollment | `/enrollments` | ADMIN or own learner | Learner requests; ADMIN decides |
| Settings | Profile, Institution settings | `/settings` | ADMIN institution; own preferences | ADMIN institution; own preferences |

Models: `User`, `Department`, `Batch`, `Classroom`, `Topic`, `Attendance`, `DailyUpdate`, `Assessment`, `AssessmentResult`, `SupportCase`, `EnrollmentRequest`, `CampusPost`, `InstitutionSetting`, `AuditLog`. The `Topic` API now backs the previously broken Courses & topics screen. Payments are excluded.

`tests/phase2-reliability.test.cjs` covers six-role legacy access fixtures. `tests/integration/academic-workflows.test.cjs` checks real MongoDB scope, result publication, support privacy, capacity, concurrent approval, settings, and one-time credentials. It does not replace a staging acceptance test with real deployment configuration.
