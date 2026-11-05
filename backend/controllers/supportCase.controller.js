const mongoose = require('mongoose');
const SupportCase = require('../models/SupportCase.model');
const Batch = require('../models/Batch.model');
const fail = (message, status = 400) => { const error = new Error(message); error.status = status; throw error; };
async function scope(user) {
  if (['ADMIN', 'TEAM_LEADER'].includes(user.role)) return {};
  if (user.role === 'LEARNER') return { learner: user._id };
  const field = { MANAGER: 'createdBy', TRAINER: 'trainers', TA: 'tas' }[user.role];
  const ids = await Batch.find({ [field]: user._id }).distinct('_id');
  return { batch: { $in: ids } };
}
const list = async (req, res, next) => { try {
  const page = Math.max(1, Math.min(100000, Number(req.query.page) || 1));
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
  const filter = await scope(req.user);
  const [rows, total] = await Promise.all([SupportCase.find(filter).populate('learner', 'firstName lastName').populate('batch', 'name').populate('messages.author', 'firstName lastName role').sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), SupportCase.countDocuments(filter)]);
  res.json({ success: true, data: rows, total, page, limit });
} catch (error) { next(error); } };
const create = async (req, res, next) => { try {
  const { subject, batch, message } = req.body;
  if (!mongoose.isValidObjectId(batch) || !subject?.trim() || !message?.trim()) fail('Batch, subject and message are required');
  const assigned = await Batch.exists({ _id: batch, learners: req.user._id });
  if (!assigned) fail('You are not enrolled in this batch', 403);
  const row = await SupportCase.create({ learner: req.user._id, batch, subject, messages: [{ author: req.user._id, body: message }] });
  res.status(201).json({ success: true, data: row });
} catch (error) { next(error); } };
const reply = async (req, res, next) => { try {
  if (!mongoose.isValidObjectId(req.params.id) || !req.body.message?.trim()) fail('Valid case and message are required');
  const filter = { _id: req.params.id, ...(await scope(req.user)) };
  const row = await SupportCase.findOneAndUpdate(filter, { $push: { messages: { author: req.user._id, body: req.body.message } }, ...(req.user.role === 'LEARNER' ? { $set: { status: 'OPEN' } } : {}) }, { new: true, runValidators: true });
  if (!row) fail('Case not found', 404);
  res.json({ success: true, data: row });
} catch (error) { next(error); } };
const setStatus = async (req, res, next) => { try {
  if (!mongoose.isValidObjectId(req.params.id) || !['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(req.body.status)) fail('Valid case and status are required');
  const row = await SupportCase.findOneAndUpdate({ _id: req.params.id, ...(await scope(req.user)) }, { $set: { status: req.body.status } }, { new: true });
  if (!row) fail('Case not found', 404);
  res.json({ success: true, data: row });
} catch (error) { next(error); } };
module.exports = { list, create, reply, setStatus };
