const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  learner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
  subject: { type: String, required: true, trim: true, maxlength: 160 },
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'], default: 'OPEN' },
  messages: [{ author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, body: { type: String, required: true, trim: true, maxlength: 3000 }, createdAt: { type: Date, default: Date.now } }],
}, { timestamps: true });
module.exports = mongoose.model('SupportCase', schema);
