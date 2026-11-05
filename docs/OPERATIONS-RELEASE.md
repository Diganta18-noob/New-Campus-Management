# Education hub operations and release

## Data and time policy

- Attendance and reporting dates are UTC. Browser display may use the viewer's locale. A future campus time zone change requires migrating every date filter and dashboard query together.
- The admin retention setting is a policy target, not an automatic deletion job. Never purge academic, attendance or audit records merely because the configured number of days has elapsed. Confirm contractual and legal retention needs first.
- In-app announcements track read receipts. Notification preferences control the unread announcement count; they do not hide published campus content. Email, SMS and push delivery are not implemented and must not be described as delivered.

## Backup and restore procedure

1. Use a MongoDB deployment with durable storage, restricted database credentials, encrypted backups and a documented owner. Set a daily backup schedule and retain at least 30 days of restorable copies; align longer retention with the institution policy.
2. For a self-managed database, run MongoDB Database Tools `mongodump --uri "$MONGODB_URI" --archive=<backup-file> --gzip` from a restricted host. Store the archive outside the application server and encrypt it with the organization's key management system. Never commit it or place it in a web-served directory.
3. Restore a recent archive into a separate staging database using `mongorestore --uri "$STAGING_MONGODB_URI" --archive=<backup-file> --gzip --drop`. Never use `--drop` against production. Check collection counts, a sample of users/batches/attendance, indexes, audit-log continuity, and the application health endpoint. Record restore duration and operator sign-off.
4. Run a restore drill at least quarterly and after a database migration. Test stale-backup and failed-restore alerts. Keep database credentials and backup access separate from app credentials.

No production backup or live restore was performed by the implementation work. The automated MongoDB integration suite uses a disposable loopback database and drops only its randomly named test database.

## Release gates

- Run `node --test tests/*.test.cjs` and `node --test tests/integration/*.test.cjs` with an isolated local MongoDB URI as documented by the test harness.
- Run `npm run build:check` in `frontend` and review the gzip budget output.
- Verify ADMIN, MANAGER, TEAM_LEADER, TRAINER, TA and LEARNER permissions with synthetic accounts. Check direct URLs and APIs, not only sidebar visibility.
- Test desktop, tablet and mobile viewport sizes, keyboard navigation, reduced motion, empty states, expired sessions, long names, and failure states.
- Verify migrations and indexes in staging; test enrollment capacity contention and academic result publication. Review slow API request logs.
- Rotate any historical shared/default passwords, especially accounts created before unique temporary credentials were introduced. Set a new JWT secret of at least 32 random bytes and review CORS origins.
- Confirm a durable production database, a successful backup restore drill, monitoring, and institutional acceptance before calling the deployment production ready.

Payments are excluded at the user's request. Do not present this release as collecting fees or confirming bank settlement.
