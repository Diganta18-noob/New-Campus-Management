const mongoose = require('mongoose');
const Topic = require('../models/Topic.model');
const Batch = require('../models/Batch.model');

const bad = (message, status = 400) => { const error = new Error(message); error.status = status; throw error; };
const fields = ['name', 'description', 'batch', 'startDate', 'endDate', 'trainers', 'tas', 'classroom'];
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
  const [data, total] = await Promise.all([populate(Topic.find(filter).sort({ startDate: -1, _id: -1 }).skip((page - 1) * limit).limit(limit)).lean(), Topic.countDocuments(filter)]);
  res.json({ success: true, data, total, page, limit });
} catch (error) { next(error); } };
const get = async (req, res, next) => { try {
  if (!mongoose.isValidObjectId(req.params.id)) bad('Invalid topic ID');
  const data = await populate(Topic.findById(req.params.id)).lean();
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

module.exports = { list, get, save, remove };
