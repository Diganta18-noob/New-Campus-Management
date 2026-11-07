const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  roleAtLogin: { type: String, required: true },
  startedAt: { type: Date, default: Date.now, required: true, index: true },
  lastSeenAt: { type: Date, default: Date.now, required: true },
  observedSeconds: { type: Number, default: 0, min: 0 },
  endedAt: { type: Date, default: null },
  endReason: { type: String, enum: ['LOGOUT', 'PASSWORD_CHANGE', 'SESSION_REVOKED'] },
}, { timestamps: true });

userSessionSchema.index({ user: 1, startedAt: -1 });
userSessionSchema.index({ startedAt: -1, roleAtLogin: 1 });
userSessionSchema.index({ endedAt: 1, lastSeenAt: -1 });

module.exports = mongoose.model('UserSession', userSessionSchema);
