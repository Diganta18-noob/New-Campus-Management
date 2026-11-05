const mongoose = require('mongoose');
const EnrollmentRequest = require('../models/EnrollmentRequest.model');
const Batch = require('../models/Batch.model');
const User = require('../models/User.model');
const Classroom = require('../models/Classroom.model');
const { randomUUID } = require('node:crypto');
const fail = (message, status = 400) => { const error = new Error(message); error.status = status; throw error; };
const list = async (req, res, next) => { try {
  const filter = req.user.role === 'LEARNER' ? { learner: req.user._id } : {};
  const rows = await EnrollmentRequest.find(filter).populate('learner', 'firstName lastName email').populate('batch', 'name code status').sort({ createdAt: -1 }).limit(100).lean();
  res.json({ success: true, data: rows });
} catch (error) { next(error); } };
const available = async (req, res, next) => { try {
  const rows = await Batch.find({ status: { $in: ['PLANNING', 'ONGOING'] } }).select('name code startDate endDate classroom learners').populate('classroom', 'capacity').limit(100).lean();
  res.json({ success: true, data: rows.map(({ learners, ...row }) => ({ ...row, availableSeats: row.classroom?.capacity == null ? null : Math.max(0, row.classroom.capacity - learners.length) })) });
} catch (error) { next(error); } };
const create = async (req, res, next) => { try {
  const batchId = req.body.batch;
  if (!mongoose.isValidObjectId(batchId)) fail('Valid batch is required');
  const batch = await Batch.findOne({ _id: batchId, status: { $in: ['PLANNING', 'ONGOING'] } }).lean();
  if (!batch) fail('Batch is unavailable', 404);
  if ((batch.learners || []).some(id => String(id) === String(req.user._id))) fail('Already enrolled in this batch', 409);
  const renewed = await EnrollmentRequest.findOneAndUpdate({ learner: req.user._id, batch: batchId, status: 'REJECTED' }, { $set: { status: 'PENDING', note: '', reviewedBy: null, reviewedAt: null } }, { new: true });
  if (renewed) return res.status(201).json({ success: true, data: renewed });
  const row = await EnrollmentRequest.create({ learner: req.user._id, batch: batchId });
  res.status(201).json({ success: true, data: row });
} catch (error) { if (error.code === 11000) error.status = 409; next(error); } };
const decide = async (req, res, next) => { try {
  if (!mongoose.isValidObjectId(req.params.id) || !['APPROVED', 'REJECTED'].includes(req.body.status)) fail('Valid request and decision are required');
  const request = await EnrollmentRequest.findOne({ _id: req.params.id, status: 'PENDING' });
  if (!request) fail('Pending request not found', 404);
  let approvedBatch = null;
  let learnerAssignmentAdded = false;
  if (req.body.status === 'APPROVED') {
    const lockToken = randomUUID();
    const now = new Date();
    const learner = await User.findOneAndUpdate({ _id: request.learner, role: 'LEARNER', isActive: true, $or: [{ enrollmentLockUntil: { $exists: false } }, { enrollmentLockUntil: { $lt: now } }] }, { $set: { enrollmentLockUntil: new Date(now.valueOf() + 120000), enrollmentLockToken: lockToken } }, { new: true }).lean();
    if (!learner) fail('Learner enrollment is being reviewed; retry shortly', 409);
    try {
    const batch = await Batch.findOne({ _id: request.batch, status: { $in: ['PLANNING', 'ONGOING'] } }).lean();
    if (!batch) fail('Batch is unavailable', 409);
    const conflicts = await Batch.exists({ _id: { $ne: batch._id }, status: { $in: ['PLANNING', 'ONGOING'] }, learners: learner._id, startDate: { $lte: batch.endDate }, endDate: { $gte: batch.startDate } });
    if (conflicts) fail('Learner already has an overlapping batch', 409);
    const classroom = batch.classroom ? await Classroom.findById(batch.classroom).select('capacity').lean() : null;
    const capacity = classroom?.capacity;
    const condition = { _id: batch._id, status: { $in: ['PLANNING', 'ONGOING'] }, learners: { $ne: learner._id } };
    if (capacity != null) condition.$expr = { $lt: [{ $size: '$learners' }, capacity] };
    const updated = await Batch.updateOne(condition, { $addToSet: { learners: learner._id } });
    if (!updated.modifiedCount) fail('Batch is full or learner is already enrolled', 409);
    approvedBatch = batch;
    try { const userUpdate = await User.updateOne({ _id: learner._id, enrollmentLockToken: lockToken }, { $addToSet: { assignedBatches: batch._id } }); if (!userUpdate.matchedCount) fail('Enrollment lock expired; retry', 409); learnerAssignmentAdded = Boolean(userUpdate.modifiedCount); }
    catch (error) { await Batch.updateOne({ _id: batch._id }, { $pull: { learners: learner._id } }); throw error; }
    } finally { await User.updateOne({ _id: learner._id, enrollmentLockToken: lockToken }, { $unset: { enrollmentLockUntil: '', enrollmentLockToken: '' } }); }
  }
  const updatedRequest = await EnrollmentRequest.findOneAndUpdate({ _id: request._id, status: 'PENDING' }, { $set: { status: req.body.status, note: req.body.note || '', reviewedBy: req.user._id, reviewedAt: new Date() } }, { new: true });
  if (!updatedRequest) {
    if (approvedBatch) {
      await Batch.updateOne({ _id: approvedBatch._id }, { $pull: { learners: request.learner } });
      if (learnerAssignmentAdded) await User.updateOne({ _id: request.learner }, { $pull: { assignedBatches: approvedBatch._id } });
    }
    fail('Request was already reviewed', 409);
  }
  res.json({ success: true, data: updatedRequest });
} catch (error) { next(error); } };
module.exports = { list, available, create, decide };
