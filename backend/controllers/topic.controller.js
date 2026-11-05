const mongoose = require('mongoose');
const Topic = require('../models/Topic.model');
const Batch = require('../models/Batch.model');

const bad = (message, status = 400) => { const error = new Error(message); error.status = status; throw error; };
const fields = ['name', 'description', 'batch', 'startDate', 'endDate', 'trainers', 'tas', 'classroom'];
async function scope(user) {
  if (['ADMIN', 'TEAM_LEADER'].includes(user.role)) return null;
  const field = { MANAGER: 'createdBy', TRAINER: 'trainers', TA: 'tas', LEARNER: 'learners' }[user.role];
  return Batch.find({ [field]: user._id }).distinct('_id');
}
const validIds = values => Array.isArray(values) && values.every(mongoose.isValidObjectId) && new Set(values.map(String)).size === values.length;

async function validate(data) {
  if (!data.name?.trim()) bad('Topic name is required');
  if (!mongoose.isValidObjectId(data.batch)) bad('Valid batch is required');
  const batch = await Batch.findById(data.batch).lean();
  if (!batch) bad('Batch not found', 404);
  if (!data.startDate || !data.endDate || Number.isNaN(Date.parse(data.startDate)) || Number.isNaN(Date.parse(data.endDate))) bad('Valid start and end dates are required');
  const start = new Date(data.startDate), end = new Date(data.endDate);
  if (end < start || start < new Date(batch.startDate) || end > new Date(batch.endDate)) bad('Topic dates must fall within the batch dates');
  for (const role of ['trainers', 'tas']) {
    if (!validIds(data[role] || [])) bad(`Invalid ${role} list`);
    const assigned = new Set((batch[role] || []).map(String));
    if ((data[role] || []).some(id => !assigned.has(String(id)))) bad(`${role} must be assigned to the batch`);
  }
  if (data.classroom && (!mongoose.isValidObjectId(data.classroom) || String(data.classroom) !== String(batch.classroom))) bad('Classroom must match the batch');
}

const populate = query => query.populate('batch', 'name code').populate('trainers tas', 'firstName lastName').populate('classroom', 'name');
const list = async (req, res, next) => { try {
  const page = Math.max(1, Math.min(100000, Number(req.query.page) || 1));
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
  const search = String(req.query.search || '').trim().slice(0, 100);
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const filter = search ? { name: { $regex: escaped, $options: 'i' } } : {};
  const visible = await scope(req.user);
  if (visible) filter.batch = { $in: visible };
  const [data, total] = await Promise.all([populate(Topic.find(filter).sort({ startDate: -1, _id: -1 }).skip((page - 1) * limit).limit(limit)).lean(), Topic.countDocuments(filter)]);
  res.json({ success: true, data, total, page, limit });
} catch (error) { next(error); } };
const get = async (req, res, next) => { try {
  if (!mongoose.isValidObjectId(req.params.id)) bad('Invalid topic ID');
  const visible = await scope(req.user);
  const data = await populate(Topic.findOne({ _id: req.params.id, ...(visible ? { batch: { $in: visible } } : {}) })).lean();
  if (!data) bad('Topic not found', 404);
  res.json({ success: true, data });
} catch (error) { next(error); } };
const save = async (req, res, next) => { try {
  const data = Object.fromEntries(fields.filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
  if (req.params.id && !mongoose.isValidObjectId(req.params.id)) bad('Invalid topic ID');
  const existing = req.params.id ? await Topic.findById(req.params.id) : null;
  if (req.params.id && !existing) bad('Topic not found', 404);
  await validate({ ...(existing?.toObject() || {}), ...data });
  const topic = existing || new Topic({ createdBy: req.user._id });
  Object.assign(topic, data);
  await topic.save();
  res.status(existing ? 200 : 201).json({ success: true, data: await populate(Topic.findById(topic._id)).lean() });
} catch (error) { if (error.code === 11000) error.status = 409; next(error); } };
const remove = async (req, res, next) => { try {
  if (!mongoose.isValidObjectId(req.params.id)) bad('Invalid topic ID');
  const topic = await Topic.findByIdAndDelete(req.params.id);
  if (!topic) bad('Topic not found', 404);
  res.json({ success: true });
} catch (error) { next(error); } };

const updateProgress = async (req, res, next) => { try {
  if (!mongoose.isValidObjectId(req.params.id)) bad('Invalid topic ID');
  const percent = Number(req.body.progressPercent);
  if (!Number.isInteger(percent) || percent < 0 || percent > 100 || typeof req.body.progressNote !== 'string' || req.body.progressNote.length > 1000) bad('Progress must be 0–100 with a note');
  const topic = await Topic.findById(req.params.id);
  if (!topic) bad('Topic not found', 404);
  if (req.user.role !== 'ADMIN') {
    const assigned = await Batch.exists({ _id: topic.batch, [req.user.role === 'TA' ? 'tas' : 'trainers']: req.user._id });
    if (!assigned) bad('Access denied to this topic', 403);
  }
  topic.progressPercent = percent;
  topic.progressNote = req.body.progressNote.trim();
  topic.completedAt = percent === 100 ? (topic.completedAt || new Date()) : null;
  await topic.save();
  res.json({ success: true, data: topic });
} catch (error) { next(error); } };

module.exports = { list, get, save, remove, updateProgress };
