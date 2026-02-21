const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Batch name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Batch code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  clientName: {
    type: String,
    required: [true, 'Client name is required']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  status: {
    type: String,
    enum: ['PLANNING', 'ONGOING', 'COMPLETED', 'CANCELLED'],
    default: 'PLANNING'
  },
  learners: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  trainers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for batch duration in days
batchSchema.virtual('durationDays').get(function() {
  const diffTime = Math.abs(this.endDate - this.startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for progress percentage
batchSchema.virtual('progress').get(function() {
  if (this.status === 'COMPLETED') return 100;
  if (this.status === 'CANCELLED') return 0;
  
  const totalDays = this.durationDays;
  const daysPassed = Math.ceil((Date.now() - this.startDate) / (1000 * 60 * 60 * 24));
  
  if (daysPassed <= 0) return 0;
  if (daysPassed >= totalDays) return 100;
  
  return Math.round((daysPassed / totalDays) * 100);
});

module.exports = mongoose.model('Batch', batchSchema);