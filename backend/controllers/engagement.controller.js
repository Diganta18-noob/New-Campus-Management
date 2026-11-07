const User = require('../models/User.model');
const UserSession = require('../models/UserSession.model');
const { ACTIVE_WINDOW_MS } = require('../services/sessionActivity.service');

const ROLES = new Set(['ADMIN', 'MANAGER', 'TEAM_LEADER', 'TRAINER', 'TA', 'LEARNER']);
const badRequest = message => Object.assign(new Error(message), { status: 400 });

const getEngagement = async (req, res, next) => {
  try {
    const days = Number(req.query.days || 30);
    const page = Number(req.query.page || 1);
    const role = String(req.query.role || 'ALL');
    const search = String(req.query.search || '').trim();
    if (![7, 30, 90].includes(days) || !Number.isInteger(page) || page < 1 || page > 100000 || (role !== 'ALL' && !ROLES.has(role)) || search.length > 100) {
      throw badRequest('Invalid engagement filters');
    }
    const now = new Date();
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const start = new Date(end.getTime() - days * 86400000);
    const sessionMatch = { startedAt: { $gte: start, $lt: end }, ...(role !== 'ALL' && { roleAtLogin: role }) };
    const userFilter = { ...(role !== 'ALL' && { role }) };
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      userFilter.$or = ['firstName', 'lastName', 'email', 'username'].map(field => ({ [field]: { $regex: safe, $options: 'i' } }));
    }
    const [summaryRows, dailyRows, roleRows, onlineSessions, totalUsers, users] = await Promise.all([
      UserSession.aggregate([
        { $match: sessionMatch },
        { $group: { _id: '$user', sessions: { $sum: 1 }, observedSeconds: { $sum: '$observedSeconds' } } },
        { $group: { _id: null, people: { $sum: 1 }, sessions: { $sum: '$sessions' }, observedSeconds: { $sum: '$observedSeconds' } } },
      ]),
      UserSession.aggregate([{ $match: sessionMatch }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$startedAt', timezone: 'UTC' } }, logins: { $sum: 1 }, observedSeconds: { $sum: '$observedSeconds' } } }, { $sort: { _id: 1 } }]),
      UserSession.aggregate([{ $match: sessionMatch }, { $group: { _id: '$roleAtLogin', logins: { $sum: 1 }, observedSeconds: { $sum: '$observedSeconds' } } }, { $sort: { logins: -1 } }]),
      UserSession.countDocuments({ endedAt: null, lastSeenAt: { $gte: new Date(now.getTime() - ACTIVE_WINDOW_MS) }, ...(role !== 'ALL' && { roleAtLogin: role }) }),
      User.countDocuments(userFilter),
      User.find(userFilter).select('firstName lastName email username role isActive lastLogin').sort({ lastLogin: -1, _id: 1 }).skip((page - 1) * 20).limit(20).lean(),
    ]);
    const userIds = users.map(user => user._id);
    const [userRows, onlineUserIds] = userIds.length ? await Promise.all([
      UserSession.aggregate([
        { $match: { ...sessionMatch, user: { $in: userIds } } },
        { $group: { _id: '$user', sessions: { $sum: 1 }, observedSeconds: { $sum: '$observedSeconds' }, lastSeenAt: { $max: '$lastSeenAt' }, lastStartedAt: { $max: '$startedAt' } } },
      ]),
      UserSession.distinct('user', { user: { $in: userIds }, endedAt: null, lastSeenAt: { $gte: new Date(now.getTime() - ACTIVE_WINDOW_MS) } }),
    ]) : [[], []];
    const byUser = new Map(userRows.map(row => [String(row._id), row]));
    const onlineUsers = new Set(onlineUserIds.map(String));
    const byDay = new Map(dailyRows.map(row => [row._id, row]));
    const daily = Array.from({ length: days }, (_, index) => {
      const date = new Date(start.getTime() + index * 86400000).toISOString().slice(0, 10);
      return { date, logins: byDay.get(date)?.logins || 0, observedSeconds: Math.round(byDay.get(date)?.observedSeconds || 0) };
    });
    res.json({ success: true, data: {
      range: { days, startDate: start.toISOString().slice(0, 10), endDate: new Date(end.getTime() - 1).toISOString().slice(0, 10) },
      generatedAt: now.toISOString(),
      summary: { people: summaryRows[0]?.people || 0, logins: summaryRows[0]?.sessions || 0, observedSeconds: Math.round(summaryRows[0]?.observedSeconds || 0), onlineSessions },
      daily,
      roles: roleRows.map(row => ({ role: row._id, logins: row.logins, observedSeconds: Math.round(row.observedSeconds) })),
      people: users.map(user => ({ ...user, lastLogin: byUser.get(String(user._id))?.lastStartedAt || user.lastLogin || null, sessions: byUser.get(String(user._id))?.sessions || 0, observedSeconds: Math.round(byUser.get(String(user._id))?.observedSeconds || 0), lastSeenAt: byUser.get(String(user._id))?.lastSeenAt || null, online: onlineUsers.has(String(user._id)) })),
      pagination: { page, pageSize: 20, total: totalUsers },
      measurement: 'Period filters select sessions by their sign-in date; observed time is credited to that session. A visible, focused tab sends activity heartbeats only after recent interaction. Sessions before tracking began have no duration; idle, hidden, offline and abrupt-close time is excluded.',
    } });
  } catch (error) { next(error); }
};

module.exports = { getEngagement };
