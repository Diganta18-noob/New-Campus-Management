const { parseReportFilters } = require('../utils/reportFilters');
const { getReportData, STATUSES } = require('../services/attendanceReport.service');
const ELIGIBLE = new Set(['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT']);
const ATTENDED = new Set(['PRESENT', 'LATE', 'HALF_DAY']);

const getInsights = async (req, res, next) => {
  try {
    const filters = parseReportFilters(req.query);
    const { entries, summary, match } = await getReportData(req.user, filters);
    const Attendance = require('../models/Attendance.model');
    const sessions = await Attendance.find(match).select('date').lean();
    const byDate = new Map();
    for (let time = filters.start.valueOf(); time < filters.endExclusive.valueOf(); time += 86400000) {
      const date = new Date(time).toISOString().slice(0, 10);
      byDate.set(date, { date, sessionCount: null, statusCounts: null });
    }
    for (const session of sessions) {
      const date = session.date.toISOString().slice(0, 10);
      const day = byDate.get(date);
      if (day) { day.sessionCount = (day.sessionCount || 0) + 1; day.statusCounts ||= Object.fromEntries(STATUSES.map(status => [status, 0])); }
    }
    for (const entry of entries) {
      const day = byDate.get(entry.date.toISOString().slice(0, 10));
      if (day?.statusCounts && day.statusCounts[entry.status] !== undefined) day.statusCounts[entry.status]++;
    }
    const learnerRates = new Map();
    for (const entry of entries) {
      if (!ELIGIBLE.has(entry.status)) continue;
      const key = `${entry.batchId}:${entry.learnerId}`;
      if (!learnerRates.has(key)) learnerRates.set(key, {
        learnerId: entry.learnerId, learnerName: [entry.learner?.firstName, entry.learner?.lastName].filter(Boolean).join(' ') || 'Unavailable learner',
        batchId: entry.batchId, batchName: entry.batch?.name || 'Unavailable batch', eligibleEntries: 0, attendedEntries: 0,
      });
      const rate = learnerRates.get(key);
      rate.eligibleEntries++;
      if (ATTENDED.has(entry.status)) rate.attendedEntries++;
    }
    const lowAttendance = [...learnerRates.values()]
      .filter(rate => rate.eligibleEntries >= 5 && rate.attendedEntries / rate.eligibleEntries < 0.75)
      .map(rate => ({ ...rate, attendancePercent: Math.round(rate.attendedEntries / rate.eligibleEntries * 100) }))
      .sort((a, b) => a.attendancePercent - b.attendancePercent || a.learnerName.localeCompare(b.learnerName));
    res.json({ success: true, data: { range: filters.range, summary, trend: [...byDate.values()], lowAttendance, lowAttendancePolicy: { minimumEntries: 5, thresholdPercent: 75, attended: [...ATTENDED], excluded: ['LEAVE', 'HOLIDAY'] } } });
  } catch (error) { next(error); }
};
module.exports = { getInsights };
