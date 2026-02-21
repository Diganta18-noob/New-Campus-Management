const mongoose = require('mongoose');

const dailyUpdateSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        index: true
    },
    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
        required: true,
        index: true
    },

    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Detailed updates
    dailySummary: {
        type: String,
        required: [true, 'Daily summary is required'],
        trim: true,
        maxlength: 5000
    },


    // Learner progress tracking
    learnerHighlights: [{
        learner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        achievement: String,
        improvementArea: String,
        remarks: String
    }],

    // Issues and challenges
    challenges: [{
        type: {
            type: String,
            enum: ['TECHNICAL', 'CONTENT', 'LEARNER', 'INFRASTRUCTURE', 'SCHEDULE', 'OTHER']
        },
        description: String,
        severity: {
            type: String,
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
        },
        resolution: String,
        status: {
            type: String,
            enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED']
        }
    }],

    completionPercentage: {
        type: Number,
        min: 0,
        max: 100
    },



    // Visibility settings
    visibility: {
        type: [String],
        enum: ['MANAGER', 'TEAM_LEADER', 'TRAINER', 'TA'],
        default: ['MANAGER', 'TEAM_LEADER']
    },

    // Status
    status: {
        type: String,
        enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
        default: 'PUBLISHED'
    },

    // Feedback from managers/leads
    feedback: [{
        givenBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        comment: String,
        suggestions: [String],
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        givenAt: {
            type: Date,
            default: Date.now
        }
    }],

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

// Compound index
dailyUpdateSchema.index({ batch: 1, date: 1,  }, { unique: true });

module.exports = mongoose.model('DailyUpdate', dailyUpdateSchema);