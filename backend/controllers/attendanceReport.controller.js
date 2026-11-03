const { parseReportFilters } = require('../utils/reportFilters');
const { getReportData } = require('../services/attendanceReport.service');

const getAttendanceReport = async (req, res, next) => {
  try {
    const filters = parseReportFilters(req.query);
    const { rows, summary } = await getReportData(req.user, filters);
    const offset = (filters.page - 1) * filters.limit;
    res.json({ success: true, data: {
      rows: rows.slice(offset, offset + filters.limit), total: rows.length,
      page: filters.page, limit: filters.limit, summary, range: filters.range,
    } });
  } catch (error) { next(error); }
};

module.exports = { getAttendanceReport };
