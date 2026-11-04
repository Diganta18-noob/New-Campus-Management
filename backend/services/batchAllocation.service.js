const mongoose = require('mongoose');
const User = require('../models/User.model');
const Classroom = require('../models/Classroom.model');

const allowed = ['name', 'code', 'description', 'clientName', 'department', 'startDate', 'endDate', 'status', 'classroom', 'trainers', 'tas', 'learners'];
const issue = (code, field, message) => ({ code, field, message });
const ids = (value, field, issues) => {
  if (!Array.isArray(value) || value.length > 1000 || value.some(id => typeof id !== 'string' || !mongoose.isValidObjectId(id)) || new Set(value.map(String)).size !== value.length) issues.push(issue('INVALID_ASSIGNMENT', field, `Choose unique valid ${field}`));
};
async function validateCandidate(input, existing = null) {
  const base = existing ? existing.toObject?.() || existing : {};
  const candidate = { ...base, ...Object.fromEntries(Object.entries(input).filter(([key]) => allowed.includes(key))) };
  for (const field of ['learners', 'trainers', 'tas']) if (input[field] === undefined) candidate[field] = (base[field] || []).map(value => String(value?._id || value));
  for (const field of ['classroom', 'department']) if (input[field] === undefined && base[field]) candidate[field] = String(base[field]?._id || base[field]);
  const issues = [];
  for (const field of ['name', 'code', 'clientName', 'department']) if (!candidate[field]) issues.push(issue('REQUIRED_FIELD', field, `${field} is required`));
  for (const field of ['learners', 'trainers', 'tas']) ids(candidate[field] || [], field, issues);
  for (const field of ['department', 'classroom']) if (candidate[field] && !mongoose.isValidObjectId(String(candidate[field]))) issues.push(issue('INVALID_REFERENCE', field, `Choose a valid ${field}`));
  const strictDate = value => {
    const date = new Date(value);
    if (!Number.isFinite(date.valueOf())) return null;
    if (typeof value === 'string' && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || date.toISOString().slice(0, 10) !== value)) return null;
    return date;
  };
  const start = strictDate(candidate.startDate), end = strictDate(candidate.endDate);
  if (!start || !end || start > end) issues.push(issue('INVALID_DATES', 'startDate', 'Choose an ordered date range'));
  if (!['PLANNING', 'ONGOING', 'COMPLETED', 'CANCELLED'].includes(candidate.status || 'PLANNING')) issues.push(issue('INVALID_STATUS', 'status', 'Choose a valid status'));
  if (issues.length) return { candidate, issues, capacity: null };
  const checks = await Promise.all([['trainers', 'TRAINER'], ['tas', 'TA'], ['learners', 'LEARNER']].map(async ([field, role]) => {
    const found = await User.countDocuments({ _id: { $in: candidate[field] || [] }, role, isActive: true });
    if (found !== (candidate[field] || []).length) issues.push(issue('INACTIVE_OR_MISSING_USER', field, `Choose active ${role.toLowerCase()} accounts`));
  }));
  let capacity = null;
  if (candidate.classroom) {
    const room = await Classroom.findById(candidate.classroom).select('capacity isActive');
    if (!room || !room.isActive) issues.push(issue('INVALID_CLASSROOM', 'classroom', 'Choose an active classroom'));
    else {
      capacity = { seats: room.capacity, enrolled: (candidate.learners || []).length };
      if (capacity.enrolled > capacity.seats) issues.push(issue('CAPACITY_EXCEEDED', 'learners', `Classroom capacity is ${capacity.seats}; ${capacity.enrolled} learners selected`));
    }
  }
  return { candidate, issues, capacity };
}
module.exports = { validateCandidate, allowed };
