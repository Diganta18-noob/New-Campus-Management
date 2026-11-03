const mongoose = require('mongoose');
const Attendance = require('../models/Attendance.model');
const Batch = require('../models/Batch.model');

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE', 'HOLIDAY'];
const batchScope = user => {
  switch (user.role) {
    case 'ADMIN': case 'TEAM_LEADER': return null;
    case 'MANAGER': return { createdBy: user._id };
    case 'TRAINER': return { trainers: user._id };
    case 'TA': return { tas: user._id };
    default: return { _id: { $in: [] } };
  }
};

const attendanceMatch = async (user, filters) => {
  const match = { date: { $gte: filters.start, $lt: filters.endExclusive } };
  const scope = batchScope(user);
  if (scope) {
    const ids = await Batch.find(scope).distinct('_id');
    if (filters.batch && !ids.some(id => String(id) === filters.batch)) {
      const error = new Error('Access denied to this batch'); error.status = 403; throw error;
    }
    match.batch = filters.batch ? new mongoose.Types.ObjectId(filters.batch) : { $in: ids };
  } else if (filters.batch) match.batch = new mongoose.Types.ObjectId(filters.batch);
  return match;
};

const reportPipeline = match => [
  { $match: match },
      { $unwind: '$attendanceRecords' },
      { $lookup: { from: 'users', localField: 'attendanceRecords.learner', foreignField: '_id', as: 'learner' } },
      { $lookup: { from: 'users', localField: 'attendanceRecords.markedBy', foreignField: '_id', as: 'marker' } },
      { $lookup: { from: 'batches', localField: 'batch', foreignField: '_id', as: 'batchDetails' } },
      { $project: {
        sessionId: '$_id', date: 1, isLocked: 1, status: '$attendanceRecords.status',
        remarks: '$attendanceRecords.remarks', learnerId: '$attendanceRecords.learner',
        learner: { $arrayElemAt: ['$learner', 0] }, marker: { $arrayElemAt: ['$marker', 0] },
        batchDetails: { $arrayElemAt: ['$batchDetails', 0] }, batchId: '$batch',
      } },
      { $project: {
        sessionId: 1, date: 1, isLocked: 1, status: 1, remarks: 1, learnerId: 1, batchId: 1,
        learner: { _id: '$learner._id', firstName: '$learner.firstName', lastName: '$learner.lastName' },
        markedBy: { _id: '$marker._id', firstName: '$marker.firstName', lastName: '$marker.lastName' },
        batch: { _id: '$batchDetails._id', name: '$batchDetails.name', code: '$batchDetails.code' },
      } },
];

const getReportData = async (user, filters) => {
  const match = await attendanceMatch(user, filters);
  const [sessionCount, aggregateRows] = await Promise.all([Attendance.countDocuments(match), Attendance.aggregate(reportPipeline(match))]);
  const entries = aggregateRows.sort((a, b) => b.date - a.date || String(b.sessionId).localeCompare(String(a.sessionId)) || String(a.learnerId).localeCompare(String(b.learnerId)));
  const statusCounts = Object.fromEntries(STATUSES.map(status => [status, 0]));
  for (const entry of entries) if (statusCounts[entry.status] !== undefined) statusCounts[entry.status]++;
  const rows = entries.map(entry => ({
    rowId: `${entry.sessionId}:${entry.learnerId}`, sessionId: entry.sessionId,
    date: entry.date, batch: { id: entry.batchId, name: entry.batch?.name || 'Unavailable batch', code: entry.batch?.code || '' },
    learner: { id: entry.learnerId, firstName: entry.learner?.firstName || 'Unavailable', lastName: entry.learner?.lastName || '' },
    status: entry.status, remarks: entry.remarks || '',
    markedBy: entry.markedBy?._id ? { id: entry.markedBy._id, firstName: entry.markedBy.firstName, lastName: entry.markedBy.lastName } : null,
    isLocked: Boolean(entry.isLocked),
  }));
  return { rows, summary: { sessionCount, entryCount: rows.length, statusCounts }, entries, match };
};

module.exports = { STATUSES, attendanceMatch, getReportData };
