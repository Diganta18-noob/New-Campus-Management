const Batch = require('../models/Batch.model');
const Attendance = require('../models/Attendance.model');
const User = require('../models/User.model');
const Classroom = require('../models/Classroom.model');
const DailyUpdate = require('../models/DailyUpdate.model');
const CampusPost = require('../models/CampusPost.model');
const { parseReportFilters } = require('../utils/reportFilters');

const getOperations = async (req, res, next) => {
  try {
    const filters = parseReportFilters(req.query);
    const query = { status: { $in: ['PLANNING', 'ONGOING'] }, startDate: { $lt: filters.endExclusive }, endDate: { $gte: filters.start } };
    if (filters.batch) query._id = filters.batch;
    const batches = await Batch.find(query).select('name code status startDate trainers learners classroom').lean();
    const userIds = [...new Set(batches.flatMap(batch => [...(batch.trainers || []), ...(batch.learners || [])]).map(String))];
    const classroomIds = [...new Set(batches.map(batch => batch.classroom).filter(Boolean).map(String))];
    const batchIds = batches.map(batch => batch._id);
    const [users, classrooms, sessionCounts, attendanceDays, updateDays, plannedSessions] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select('_id').lean(),
      Classroom.find({ _id: { $in: classroomIds } }).select('_id').lean(),
      Attendance.aggregate([{ $match: { date: { $gte: filters.start, $lt: filters.endExclusive }, batch: { $in: batchIds } } }, { $group: { _id: '$batch', count: { $sum: 1 } } }]),
      Attendance.find({ date: { $gte: filters.start, $lt: filters.endExclusive }, batch: { $in: batchIds } }).select('batch date').lean(),
      DailyUpdate.find({ date: { $gte: filters.start, $lt: filters.endExclusive }, batch: { $in: batchIds }, status: 'PUBLISHED' }).select('batch date').lean(),
      CampusPost.find({ kind: 'EVENT', requiresAttendance: true, published: true, batch: { $in: batchIds }, startsAt: { $gte: filters.start, $lt: filters.endExclusive }, endsAt: { $lt: new Date() } }).select('batch startsAt').lean(),
    ]);
    const validUsers = new Set(users.map(user => String(user._id)));
    const validRooms = new Set(classrooms.map(room => String(room._id)));
    const counts = new Map(sessionCounts.map(item => [String(item._id), item.count]));
    const key = (batch, date) => `${batch}:${new Date(date).toISOString().slice(0, 10)}`;
    const marked = new Set(attendanceDays.map(item => key(item.batch, item.date)));
    const updated = new Set(updateDays.map(item => key(item.batch, item.date)));
    const plans = new Map();
    for (const item of plannedSessions) {
      const id = String(item.batch);
      if (!plans.has(id)) plans.set(id, new Set());
      plans.get(id).add(key(item.batch, item.startsAt));
    }
    const rows = batches.map(batch => {
      const issues = [];
      if (!(batch.trainers || []).some(id => validUsers.has(String(id)))) issues.push('NO_TRAINER');
      if (!batch.classroom || !validRooms.has(String(batch.classroom))) issues.push('NO_CLASSROOM');
      if (!(batch.learners || []).some(id => validUsers.has(String(id)))) issues.push('NO_LEARNERS');
      const expected = [...(plans.get(String(batch._id)) || [])];
      const missingAttendanceCount = expected.filter(day => !marked.has(day)).length;
      const overdueUpdateCount = expected.filter(day => !updated.has(day)).length;
      if (missingAttendanceCount) issues.push('MISSING_ATTENDANCE');
      if (overdueUpdateCount) issues.push('OVERDUE_UPDATE');
      return { batchId: batch._id, code: batch.code, name: batch.name, status: batch.status, issues, missingAttendanceCount, overdueUpdateCount, recordedSessionCount: counts.get(String(batch._id)) || 0, startDate: batch.startDate };
    }).filter(row => row.issues.length).sort((a, b) => b.issues.length - a.issues.length || a.startDate - b.startDate || String(a.batchId).localeCompare(String(b.batchId)));
    res.json({ success: true, data: { rows: rows.slice(0, 100).map(({ startDate, ...row }) => row), total: rows.length, truncated: rows.length > 100, range: filters.range } });
  } catch (error) { next(error); }
};
module.exports = { getOperations };
