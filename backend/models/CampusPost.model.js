const mongoose = require('mongoose');

const campusPostSchema = new mongoose.Schema({
  kind: { type: String, enum: ['EVENT', 'ANNOUNCEMENT'], required: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  body: { type: String, required: true, trim: true, maxlength: 5000 },
  startsAt: { type: Date },
  endsAt: { type: Date },
  roles: [{ type: String, enum: ['ADMIN', 'MANAGER', 'TEAM_LEADER', 'TRAINER', 'TA', 'LEARNER'] }],
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
  requiresAttendance: { type: Boolean, default: false },
  published: { type: Boolean, default: true },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
campusPostSchema.index({ published: 1, startsAt: 1 });
module.exports = mongoose.model('CampusPost', campusPostSchema);
