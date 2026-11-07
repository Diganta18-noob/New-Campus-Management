# Engagement analytics

The admin-only **Engagement analytics** page shows sign-ins, distinct people, recently active sessions, UTC daily sign-ins, a role distribution, and a searchable account directory. The directory includes people with no tracked sessions, so a zero is visible rather than silently omitted. Periods are 7, 30, and 90 days; directory rows are paginated. CSV export downloads only the currently visible page and uses spreadsheet-safe escaping.

## Measurement contract

- Each successful login or registration creates a `UserSession`. Its ID is signed into that JWT. Existing JWTs without a session ID remain valid but have no duration history.
- While the app tab is visible, focused, and has had recent interaction, it sends a heartbeat every 30 seconds. The server credits at most 45 seconds per heartbeat and credits nothing after a gap longer than 90 seconds. Duplicate requests cannot double-credit the same interval.
- Logout and password change close the current session and revoke other sessions affected by the token-version change. A closed browser without logout is considered offline 90 seconds after its last heartbeat.
- **Observed time is a lower-bound estimate of foreground activity**, not proof of attention, work, or learning. Hidden, idle, offline, and abruptly closed time is excluded. Period filters select sessions by sign-in date, and observed time is attributed to that session even if it spans midnight.
- “Active now” means a sign-in or heartbeat in the last 90 seconds for a session that has not ended. Tracking begins with this deployment; historical login duration cannot be reconstructed from `lastLogin` or audit logs.
- The session collection stores user ID, role at sign-in, start/end/last-seen times, observed seconds, and end reason. It does not store IP addresses or browser fingerprints. Follow the institution's retention and backup policy for this personal data.

The API is `GET /api/dashboard/engagement` and requires `ADMIN`. `POST /api/auth/heartbeat` requires a valid session token. The integration suite verifies role denial, real MongoDB aggregation, idle gaps, and logout behavior.
