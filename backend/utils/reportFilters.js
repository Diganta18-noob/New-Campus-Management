const mongoose = require('mongoose');

const parseReportFilters = (query = {}) => {
  const today = new Date().toISOString().slice(0, 10);
  const defaultStart = new Date(Date.parse(`${today}T00:00:00.000Z`) - 29 * 86400000).toISOString().slice(0, 10);
  const startDate = query.startDate ?? defaultStart;
  const endDate = query.endDate ?? today;
  const dateValue = value => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value ? null : date;
  };
  const start = dateValue(startDate);
  const end = dateValue(endDate);
  if (!start || !end || end < start || Math.round((end - start) / 86400000) >= 90) {
    const error = new Error('Choose a valid UTC date range of 1 to 90 days'); error.status = 400; throw error;
  }
  if (query.batch !== undefined && (typeof query.batch !== 'string' || !mongoose.isValidObjectId(query.batch))) {
    const error = new Error('Invalid batch ID'); error.status = 400; throw error;
  }
  const integer = (value, fallback, minimum, maximum, name) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || Number(value) < minimum || Number(value) > maximum) {
      const error = new Error(`Invalid ${name}`); error.status = 400; throw error;
    }
    return Number(value);
  };
  return {
    startDate, endDate, start, endExclusive: new Date(end.valueOf() + 86400000),
    batch: query.batch, page: integer(query.page, 1, 1, Number.MAX_SAFE_INTEGER, 'page'),
    limit: integer(query.limit, 25, 1, 100, 'limit'),
    range: { startDate, endDate, timeZone: 'UTC' },
  };
};

module.exports = { parseReportFilters };
