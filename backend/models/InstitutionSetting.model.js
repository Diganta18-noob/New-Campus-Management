const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  _id: { type: String, default: 'institution' },
  name: { type: String, required: true, trim: true, maxlength: 160, default: 'AttendEase Campus' },
  contactEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
  retentionDays: { type: Number, min: 30, max: 3650, default: 365 },
  timeZone: { type: String, enum: ['UTC'], default: 'UTC' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('InstitutionSetting', schema);
