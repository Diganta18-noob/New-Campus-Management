const DailyUpdate = require('../models/DailyUpdate.model');
const Batch = require('../models/Batch.model');
const Attendance = require('../models/Attendance.model');

// @desc    Create daily update
// @route   POST /api/daily-updates
// @access  Private/Manager/TeamLeader
const createDailyUpdate = async (req, res) => {
    try {
        const { date, batch, ...updateData } = req.body;

        // Validate required fields
        if (!date || !batch || !updateData.dailySummary) {
            return res.status(400).json({
                success: false,
                message: 'Please provide date, batch, and daily summary'
            });
        }

        // Check if daily update already exists for this date and batch
        const existingUpdate = await DailyUpdate.findOne({
            date: new Date(date),
            batch
        });

        if (existingUpdate) {
            return res.status(400).json({
                success: false,
                message: 'Daily update already exists for this date and batch'
            });
        }

        // Create daily update
        const dailyUpdate = await DailyUpdate.create({
            date: new Date(date),
            batch,
            postedBy: req.user._id,
            ...updateData
        });

        // Also update the attendance record with daily update summary
        await Attendance.findOneAndUpdate(
            { date: new Date(date), batch },
            {
                $set: {
                    'dailyUpdate.trainerRemarks': updateData.dailySummary,
                    'dailyUpdate.coveredTopics': updateData.topicsCovered || [],
                    'dailyUpdate.learnerPerformance': updateData.overallMood || 'AVERAGE',
                    'dailyUpdate.issuesDescription': updateData.challenges?.map(c => c.description).join(', ') || ''
                }
            },
            { upsert: false }
        );

        const populatedUpdate = await DailyUpdate.findById(dailyUpdate._id)
            .populate('batch', 'name code')
            .populate('postedBy', 'firstName lastName email')
            .populate('feedback.givenBy', 'firstName lastName email');

        res.status(201).json({
            success: true,
            data: populatedUpdate,
            message: 'Daily update created successfully'
        });
    } catch (error) {
        console.error('Create daily update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get daily updates
// @route   GET /api/daily-updates
// @access  Private
const getDailyUpdates = async (req, res) => {
    try {
        const { batch, startDate, endDate, search, page = 1, limit = 20 } = req.query;

        const query = { status: 'PUBLISHED' };

        // Role-based visibility
        if (req.user.role === 'MANAGER' || req.user.role === 'TEAM_LEADER') {
            // Get batches managed by user
            const batches = await Batch.find({
                createdBy: req.user.role === 'MANAGER' ? req.user._id : { $exists: true }
            }).select('_id');
            const batchIds = batches.map(b => b._id);
            query.batch = { $in: batchIds };
            query.visibility = { $in: [req.user.role] };
        } else if (req.user.role === 'LEARNER') {
            // Learners can only see updates for their batches
            const batches = await Batch.find({ learners: req.user._id }).select('_id');
            const batchIds = batches.map(b => b._id);
            query.batch = { $in: batchIds };
        }

        if (batch) query.batch = batch;

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        if (search) {
            query.$or = [
                { dailySummary: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const updates = await DailyUpdate.find(query)
            .populate('batch', 'name code clientName')
            .populate('postedBy', 'firstName lastName email')
            .populate('feedback.givenBy', 'firstName lastName email')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ date: -1, createdAt: -1 });

        const total = await DailyUpdate.countDocuments(query);

        res.status(200).json({
            success: true,
            count: updates.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            data: updates
        });
    } catch (error) {
        console.error('Get daily updates error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get single daily update
// @route   GET /api/daily-updates/:id
// @access  Private
const getDailyUpdate = async (req, res) => {
    try {
        const dailyUpdate = await DailyUpdate.findById(req.params.id)
            .populate('batch', 'name code clientName')
            .populate('postedBy', 'firstName lastName email phone')
            .populate('feedback.givenBy', 'firstName lastName email')
            .populate('learnerHighlights.learner', 'firstName lastName email');

        if (!dailyUpdate) {
            return res.status(404).json({
                success: false,
                message: 'Daily update not found'
            });
        }

        // Check visibility
        if (!hasUpdateAccess(req.user, dailyUpdate)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this daily update'
            });
        }

        // Get corresponding attendance data
        const attendance = await Attendance.findOne({
            date: dailyUpdate.date,
            batch: dailyUpdate.batch
        })
            .populate('attendanceRecords.learner', 'firstName lastName email')
            .populate('classroom', 'name code location');

        res.status(200).json({
            success: true,
            data: {
                dailyUpdate,
                attendance
            }
        });
    } catch (error) {
        console.error('Get daily update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update daily update
// @route   PUT /api/daily-updates/:id
// @access  Private/Manager/TeamLeader/Admin
const updateDailyUpdate = async (req, res) => {
    try {
        const dailyUpdate = await DailyUpdate.findById(req.params.id);

        if (!dailyUpdate) {
            return res.status(404).json({
                success: false,
                message: 'Daily update not found'
            });
        }

        // Check authorization
        const canUpdate = req.user.role === 'ADMIN' ||
            dailyUpdate.postedBy.toString() === req.user._id.toString();

        if (!canUpdate) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this daily update'
            });
        }

        // Store old values for audit log
        req.oldValues = dailyUpdate.toObject();
        req.changes = [];

        const updatedUpdate = await DailyUpdate.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        )
            .populate('batch', 'name code')
            .populate('postedBy', 'firstName lastName email');

        // Update corresponding attendance record
        if (req.body.dailySummary) {
            await Attendance.findOneAndUpdate(
                { date: dailyUpdate.date, batch: dailyUpdate.batch },
                {
                    $set: {
                        'dailyUpdate.trainerRemarks': req.body.dailySummary
                    }
                }
            );
        }

        res.status(200).json({
            success: true,
            data: updatedUpdate,
            message: 'Daily update updated successfully'
        });
    } catch (error) {
        console.error('Update daily update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Add feedback to daily update
// @route   POST /api/daily-updates/:id/feedback
// @access  Private/Manager/TeamLeader
const addFeedback = async (req, res) => {
    try {
        const { comment, suggestions, rating } = req.body;

        if (!comment) {
            return res.status(400).json({
                success: false,
                message: 'Please provide feedback comment'
            });
        }

        const dailyUpdate = await DailyUpdate.findById(req.params.id);

        if (!dailyUpdate) {
            return res.status(404).json({
                success: false,
                message: 'Daily update not found'
            });
        }

        // Check if user is manager or team leader
        if (!['MANAGER', 'TEAM_LEADER'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Only managers and team leaders can provide feedback'
            });
        }

        // Check if user has access to this update
        if (!dailyUpdate.visibility.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this daily update'
            });
        }

        const feedback = {
            givenBy: req.user._id,
            comment,
            suggestions: suggestions || [],
            rating: rating || 5,
            givenAt: new Date()
        };

        dailyUpdate.feedback.push(feedback);
        await dailyUpdate.save();

        const populatedUpdate = await DailyUpdate.findById(dailyUpdate._id)
            .populate('feedback.givenBy', 'firstName lastName email');

        res.status(200).json({
            success: true,
            data: populatedUpdate,
            message: 'Feedback added successfully'
        });
    } catch (error) {
        console.error('Add feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get batch daily updates summary
// @route   GET /api/daily-updates/batch/:batchId/summary
// @access  Private/Manager/TeamLeader
const getBatchUpdatesSummary = async (req, res) => {
    try {
        const { batchId } = req.params;
        const { startDate, endDate } = req.query;

        const batch = await Batch.findById(batchId);

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }

        // Check access permissions
        if (!hasBatchAccess(req.user, batch) && req.user.role !== 'TEAM_LEADER') {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this batch updates'
            });
        }

        const query = { batch: batchId, status: 'PUBLISHED' };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const updates = await DailyUpdate.find(query)
            .populate('postedBy', 'firstName lastName')
            .sort({ date: -1 });

        // Calculate summary statistics
        const moodStats = {
            EXCELLENT: 0,
            GOOD: 0,
            NEUTRAL: 0,
            CHALLENGING: 0,
            DIFFICULT: 0
        };

        const challengeTypes = {};
        let totalCompletion = 0;

        updates.forEach(update => {
            // Mood statistics
            if (update.overallMood && moodStats[update.overallMood] !== undefined) {
                moodStats[update.overallMood]++;
            }

            // Challenge types
            if (update.challenges && update.challenges.length > 0) {
                update.challenges.forEach(challenge => {
                    const type = challenge.type || 'OTHER';
                    challengeTypes[type] = (challengeTypes[type] || 0) + 1;
                });
            }

            // Completion percentage
            if (update.completionPercentage) {
                totalCompletion += update.completionPercentage;
            }
        });

        const averageCompletion = updates.length > 0 ? totalCompletion / updates.length : 0;

        res.status(200).json({
            success: true,
            data: {
                batch: {
                    id: batch._id,
                    name: batch.name,
                    code: batch.code
                },
                summary: {
                    totalUpdates: updates.length,
                    moodStats,
                    challengeTypes,
                    averageCompletion: averageCompletion.toFixed(2),
                    recentUpdates: updates.slice(0, 10)
                },
                updates
            }
        });
    } catch (error) {
        console.error('Get batch updates summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Helper function to check update access
const hasUpdateAccess = (user, dailyUpdate) => {
    if (user.role === 'ADMIN') return true;
    if (dailyUpdate.postedBy.toString() === user._id.toString()) return true;
    if (dailyUpdate.visibility.includes(user.role)) return true;
    return false;
};

// Helper function to check batch access
const hasBatchAccess = (user, batch) => {
    if (user.role === 'ADMIN') return true;
    if (user.role === 'MANAGER' && batch.createdBy.toString() === user._id.toString()) return true;
    return false;
};

module.exports = {
    createDailyUpdate,
    getDailyUpdates,
    getDailyUpdate,
    updateDailyUpdate,
    addFeedback,
    getBatchUpdatesSummary
};