const mongoose = require('mongoose');
const CampusPost = require('../models/CampusPost.model');
const Batch = require('../models/Batch.model');

const fail = (message, status = 400) => { const error = new Error(message); error.status = status; throw error; };
const allRoles = ['ADMIN', 'MANAGER', 'TEAM_LEADER', 'TRAINER', 'TA', 'LEARNER'];
async function visibility(user) {
  if (user.role === 'ADMIN') return {};
  const field = { MANAGER: 'createdBy', TRAINER: 'trainers', TA: 'tas', LEARNER: 'learners' }[user.role];
  const batches = field ? await Batch.find({ [field]: user._id }).distinct('_id') : [];
  const conditions = [{ $or: [{ roles: { $size: 0 } }, { roles: user.role }] }];
  if (user.role !== 'TEAM_LEADER') conditions.push({ $or: [{ batch: null }, { batch: { $in: batches } }] });
  return { published: true, $and: conditions };
}
const list = async (req, res, next) => { try {
  const page = Math.max(1, Math.min(100000, Number(req.query.page) || 1));
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
  const kind = req.query.kind;
  if (kind && !['EVENT', 'ANNOUNCEMENT'].includes(kind)) fail('Invalid kind');
  const filter = { ...(await visibility(req.user)), ...(kind ? { kind } : {}) };
  const [data, total] = await Promise.all([
    CampusPost.find(filter).populate('batch', 'name code').sort({ startsAt: 1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    CampusPost.countDocuments(filter),
  ]);
  const unread = req.user.notificationPreferences?.announcements === false ? 0 : await CampusPost.countDocuments({ ...filter, kind: 'ANNOUNCEMENT', readBy: { $ne: req.user._id } });
  res.json({ success: true, data: data.map(({ readBy, ...post }) => ({ ...post, hasRead: readBy.some(id => String(id) === String(req.user._id)), readCount: req.user.role === 'ADMIN' ? readBy.length : undefined })), total, page, limit, unread });
} catch (error) { next(error); } };
const save = async (req, res, next) => { try {
  const keys = ['kind', 'title', 'body', 'startsAt', 'endsAt', 'roles', 'batch', 'published', 'requiresAttendance'];
  if (req.params.id && !mongoose.isValidObjectId(req.params.id)) fail('Invalid post ID');
  const post = req.params.id ? await CampusPost.findById(req.params.id) : new CampusPost({ createdBy: req.user._id });
  if (!post) fail('Post not found', 404);
  for (const key of keys) if (req.body[key] !== undefined) post[key] = req.body[key];
  if (!['EVENT', 'ANNOUNCEMENT'].includes(post.kind) || !post.title?.trim() || !post.body?.trim()) fail('Kind, title and body are required');
  if (!Array.isArray(post.roles) || post.roles.some(role => !allRoles.includes(role))) fail('Invalid role audience');
  if (post.batch && (!mongoose.isValidObjectId(post.batch) || !await Batch.exists({ _id: post.batch }))) fail('Valid batch is required');
  if (post.kind === 'EVENT' && (!post.startsAt || !post.endsAt || post.endsAt < post.startsAt)) fail('Event needs valid start and end times');
  if (post.requiresAttendance && (post.kind !== 'EVENT' || !post.batch)) fail('Class session must be an event assigned to a batch');
  await post.save();
  res.status(req.params.id ? 200 : 201).json({ success: true, data: post });
} catch (error) { next(error); } };
const remove = async (req, res, next) => { try {
  if (!mongoose.isValidObjectId(req.params.id)) fail('Invalid post ID');
  if (!await CampusPost.findByIdAndDelete(req.params.id)) fail('Post not found', 404);
  res.json({ success: true });
} catch (error) { next(error); } };
const markRead = async (req, res, next) => { try {
  if (!mongoose.isValidObjectId(req.params.id)) fail('Invalid post ID');
  const post = await CampusPost.findOne({ _id: req.params.id, kind: 'ANNOUNCEMENT', ...(await visibility(req.user)) });
  if (!post) fail('Announcement not found', 404);
  await CampusPost.updateOne({ _id: post._id }, { $addToSet: { readBy: req.user._id } });
  res.json({ success: true });
} catch (error) { next(error); } };
module.exports = { list, save, remove, markRead };
