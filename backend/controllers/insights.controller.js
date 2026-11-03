const { parseReportFilters } = require('../utils/reportFilters');
const { getReportData, STATUSES } = require('../services/attendanceReport.service');

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
    res.json({ success: true, data: { range: filters.range, summary, trend: [...byDate.values()] } });
  } catch (error) { next(error); }
};
module.exports = { getInsights };
