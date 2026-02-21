const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  // Core attendance info
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true,
    index: true
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  
  // Attendance records for each learner
  attendanceRecords: [{
    learner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE', 'HOLIDAY'],
      default: 'ABSENT'
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 500
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    markedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Daily Batch Update Section (for Manager/Team Lead visibility)
  dailyUpdate: {
    coveredTopics: [{
      topic: String,
      description: String,
      duration: Number // in minutes
    }],
    trainerRemarks: {
      type: String,
      trim: true,
      maxlength: 2000
    },
    assignmentsGiven: [{
      title: String,
      dueDate: Date,
      description: String
    }],
    learnerPerformance: {
      type: String,
      enum: ['EXCELLENT', 'GOOD', 'AVERAGE', 'NEEDS_IMPROVEMENT', 'POOR'],
      default: 'AVERAGE'
    },
    issuesDescription: {
      type: String,
      trim: true,
      maxlength: 1000
    },
  },
  
  // Session timing
  sessionStartTime: {
    type: Date
  },
  sessionEndTime: {
    type: Date
  },
  
  // Status and locking
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedAt: {
    type: Date
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Created and updated info
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Compound index for unique attendance per batch, topic, and date
attendanceSchema.index({ batch: 1, date: 1 }, { unique: true });

// Virtual for total present count
attendanceSchema.virtual('presentCount').get(function() {
  return this.attendanceRecords.filter(record => 
    ['PRESENT', 'LATE', 'HALF_DAY'].includes(record.status)
  ).length;
});

// Virtual for total absent count
attendanceSchema.virtual('absentCount').get(function() {
  return this.attendanceRecords.filter(record => 
    record.status === 'ABSENT'
  ).length;
});

// Virtual for attendance percentage
attendanceSchema.virtual('attendancePercentage').get(function() {
  if (this.attendanceRecords.length === 0) return 0;
  return Math.round((this.presentCount / this.attendanceRecords.length) * 100);
});

// Virtual for session duration in hours
attendanceSchema.virtual('sessionDuration').get(function() {
  if (!this.sessionStartTime || !this.sessionEndTime) return 0;
  const durationMs = this.sessionEndTime - this.sessionStartTime;
  return (durationMs / (1000 * 60 * 60)).toFixed(2);
});

// Pre-save middleware to auto-lock attendance after configurable time
attendanceSchema.pre('save', function(next) {
  const AUTO_LOCK_HOURS = 24; // Configurable: attendance auto-locks after 24 hours
  
  if (!this.isLocked && this.createdAt) {
    const lockTime = new Date(this.createdAt.getTime() + (AUTO_LOCK_HOURS * 60 * 60 * 1000));
    if (Date.now() > lockTime) {
      this.isLocked = true;
      this.lockedAt = Date.now();
    }
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);