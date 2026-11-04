const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 2000 },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  trainers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

topicSchema.index({ batch: 1, name: 1 }, { unique: true });
module.exports = mongoose.model('Topic', topicSchema);
