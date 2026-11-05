const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 2000 },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  dueAt: { type: Date, required: true },
  maxScore: { type: Number, required: true, min: 1, max: 1000 },
  published: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
module.exports = mongoose.model('Assessment', schema);
