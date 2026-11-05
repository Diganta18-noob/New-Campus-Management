const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  learner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  note: { type: String, trim: true, maxlength: 1000 },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
}, { timestamps: true });
schema.index({ learner: 1, batch: 1 }, { unique: true });
module.exports = mongoose.model('EnrollmentRequest', schema);
