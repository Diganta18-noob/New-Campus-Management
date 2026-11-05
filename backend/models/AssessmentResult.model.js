const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  learner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true, min: 0 },
  feedback: { type: String, trim: true, maxlength: 2000 },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
schema.index({ assessment: 1, learner: 1 }, { unique: true });
module.exports = mongoose.model('AssessmentResult', schema);
