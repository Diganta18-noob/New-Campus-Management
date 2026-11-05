const mongoose = require('mongoose');
const Assessment = require('../models/Assessment.model');
const Result = require('../models/AssessmentResult.model');
const Batch = require('../models/Batch.model');
const Topic = require('../models/Topic.model');

const fail = (message, status = 400) => { const error = new Error(message); error.status = status; throw error; };
const id = value => mongoose.isValidObjectId(value);
async function batchScope(user) {
  if (user.role === 'ADMIN' || user.role === 'TEAM_LEADER') return null;
  if (user.role === 'MANAGER') return Batch.find({ createdBy: user._id }).distinct('_id');
  const field = { TRAINER: 'trainers', TA: 'tas', LEARNER: 'learners' }[user.role];
  return Batch.find({ [field]: user._id }).distinct('_id');
}
async function access(user, batchId, write = false) {
  if (!id(batchId)) fail('Invalid batch ID');
  const batch = await Batch.findById(batchId).lean();
  if (!batch) fail('Batch not found', 404);
  if (write && !['ADMIN', 'TRAINER', 'TA'].includes(user.role)) fail('Forbidden', 403);
  if (user.role !== 'ADMIN' && user.role !== 'TEAM_LEADER') {
    const field = { MANAGER: 'createdBy', TRAINER: 'trainers', TA: 'tas', LEARNER: 'learners' }[user.role];
    const values = field === 'createdBy' ? [batch.createdBy] : batch[field] || [];
    if (!values.some(value => String(value) === String(user._id))) fail('Forbidden', 403);
  }
  return batch;
}
const list = async (req, res, next) => { try {
  const scope = await batchScope(req.user);
  const filter = scope ? { batch: { $in: scope } } : {};
  if (req.query.batch) { await access(req.user, req.query.batch); filter.batch = req.query.batch; }
  if (req.user.role === 'LEARNER') filter.published = true;
  const rows = await Assessment.find(filter).populate('batch', 'name code').populate('topic', 'name').sort({ dueAt: -1 }).limit(100).lean();
  const results = req.user.role === 'LEARNER' ? await Result.find({ assessment: { $in: rows.map(row => row._id) }, learner: req.user._id }).lean() : [];
  const own = new Map(results.map(row => [String(row.assessment), row]));
  res.json({ success: true, data: rows.map(row => ({ ...row, myResult: own.get(String(row._id)) || null })) });
} catch (error) { next(error); } };
const create = async (req, res, next) => { try {
  const { title, description, batch: batchId, topic, dueAt, maxScore } = req.body;
  const batch = await access(req.user, batchId, true);
  if (!title?.trim() || !dueAt || Number.isNaN(Date.parse(dueAt)) || !Number.isFinite(Number(maxScore)) || Number(maxScore) < 1 || Number(maxScore) > 1000) fail('Title, due date and max score are required');
  if (new Date(dueAt) < new Date(batch.startDate) || new Date(dueAt) > new Date(batch.endDate)) fail('Assessment due date must fall within the batch dates');
  if (topic && (!id(topic) || !await Topic.exists({ _id: topic, batch: batch._id }))) fail('Topic must belong to the batch');
  const row = await Assessment.create({ title, description, batch: batch._id, topic: topic || undefined, dueAt, maxScore, createdBy: req.user._id });
  res.status(201).json({ success: true, data: row });
} catch (error) { next(error); } };
const grade = async (req, res, next) => { try {
  if (!id(req.params.id) || !id(req.body.learner)) fail('Invalid assessment or learner ID');
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) fail('Assessment not found', 404);
  const batch = await access(req.user, assessment.batch, true);
  if (!(batch.learners || []).some(value => String(value) === String(req.body.learner))) fail('Learner is not enrolled in the batch');
  if (req.body.score === '' || req.body.score === null || req.body.score === undefined) fail('Score is required');
  const score = Number(req.body.score);
  if (!Number.isFinite(score) || score < 0 || score > assessment.maxScore) fail('Score outside assessment range');
  const row = await Result.findOneAndUpdate({ assessment: assessment._id, learner: req.body.learner }, { $set: { score, feedback: req.body.feedback || '', gradedBy: req.user._id } }, { upsert: true, new: true, runValidators: true });
  res.json({ success: true, data: row });
} catch (error) { next(error); } };
const results = async (req, res, next) => { try {
  if (!id(req.params.id)) fail('Invalid assessment ID');
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) fail('Assessment not found', 404);
  await access(req.user, assessment.batch);
  if (req.user.role === 'LEARNER') {
    if (!assessment.published) fail('Results are not published', 403);
    const row = await Result.findOne({ assessment: assessment._id, learner: req.user._id }).lean();
    return res.json({ success: true, data: row ? [row] : [] });
  }
  const rows = await Result.find({ assessment: assessment._id }).populate('learner', 'firstName lastName email').lean();
  res.json({ success: true, data: rows });
} catch (error) { next(error); } };
const publish = async (req, res, next) => { try {
  if (!id(req.params.id)) fail('Invalid assessment ID');
  const row = await Assessment.findById(req.params.id);
  if (!row) fail('Assessment not found', 404);
  await access(req.user, row.batch, true);
  if (typeof req.body.published !== 'boolean') fail('Published must be true or false');
  row.published = req.body.published;
  await row.save();
  res.json({ success: true, data: row });
} catch (error) { next(error); } };
module.exports = { list, create, grade, results, publish };
