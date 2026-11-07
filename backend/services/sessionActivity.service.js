const UserSession = require('../models/UserSession.model');

const ACTIVE_WINDOW_MS = 90_000;
const MAX_CREDIT_SECONDS = 45;

async function startSession(user) {
  return UserSession.create({ user: user._id, roleAtLogin: user.role });
}

async function recordHeartbeat(userId, sessionId, now = new Date()) {
  if (!sessionId) return false;
  const session = await UserSession.findOne({ _id: sessionId, user: userId, endedAt: null });
  if (!session) return false;
  const elapsed = (now.getTime() - session.lastSeenAt.getTime()) / 1000;
  const credit = elapsed > 0 && elapsed <= ACTIVE_WINDOW_MS / 1000 ? Math.min(elapsed, MAX_CREDIT_SECONDS) : 0;
  const result = await UserSession.updateOne(
    { _id: sessionId, user: userId, endedAt: null, lastSeenAt: session.lastSeenAt },
    { $set: { lastSeenAt: now }, $inc: { observedSeconds: credit } },
  );
  return result.modifiedCount === 1;
}

async function endSession(userId, sessionId, reason, now = new Date()) {
  if (!sessionId) return;
  await UserSession.updateOne(
    { _id: sessionId, user: userId, endedAt: null },
    { $set: { endedAt: now, endReason: reason } },
  );
}

async function revokeOtherSessions(userId, now = new Date()) {
  await UserSession.updateMany(
    { user: userId, endedAt: null },
    { $set: { endedAt: now, endReason: 'SESSION_REVOKED' } },
  );
}

module.exports = { ACTIVE_WINDOW_MS, startSession, recordHeartbeat, endSession, revokeOtherSessions };
