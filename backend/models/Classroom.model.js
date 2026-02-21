const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Classroom name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Classroom code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: 1
  },
  facilities: [{
    type: String,
    enum: ['PROJECTOR', 'WHITEBOARD', 'AC', 'WIFI', 'SOUND_SYSTEM', 'COMPUTERS']
  }],
  isActive: {
    type: Boolean,
    default: true
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
  timestamps: true
});

module.exports = mongoose.model('Classroom', classroomSchema);