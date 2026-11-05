const Attendance = require('../models/Attendance.model');
const DailyUpdate = require('../models/DailyUpdate.model');
const Batch = require('../models/Batch.model');

const idOf = value => String(value?._id || value);
const batchScope = user => {
    switch (user.role) {
        case 'ADMIN': case 'TEAM_LEADER': return null;
        case 'MANAGER': return { createdBy: user._id };
        case 'TRAINER': return { trainers: user._id };
        case 'TA': return { tas: user._id };
        case 'LEARNER': return { learners: user._id };
        default: return { _id: { $in: [] } };
    }
};
const canWriteBatch = (user, batch) => user.role === 'ADMIN' ||
    (['TRAINER', 'TA'].includes(user.role) &&
        (batch[user.role === 'TA' ? 'tas' : 'trainers'] || []).some(member => idOf(member) === idOf(user._id)));
const validRoster = (records, batch) => {
    if (!Array.isArray(records)) return false;
    const allowed = new Set((batch.learners || []).map(idOf));
    const seen = new Set();
    return records.every(record => {
        const id = idOf(record.learner);
        if (!allowed.has(id) || seen.has(id) || !['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE', 'HOLIDAY'].includes(record.status)) return false;
        seen.add(id);
        return true;
    });
};

// Apply requested batches inside the role scope, never in place of it.
const scopeAttendanceQuery = async (user, requestedBatch, query) => {
    const scope = batchScope(user);
    if (scope) {
        const batches = await Batch.find(scope).select('_id');
        const ids = batches.map(batch => batch._id);
        if (requestedBatch && !ids.some(id => idOf(id) === idOf(requestedBatch))) return false;
        query.batch = requestedBatch || { $in: ids };
    } else if (requestedBatch) query.batch = requestedBatch;
    return true;
};

// @desc    Mark attendance
// @route   POST /api/attendance
// @access  Private/Trainer/TA
const markAttendance = async (req, res) => {
    try {
        const { date, batch, classroom, attendanceRecords, sessionStartTime, sessionEndTime, dailyUpdate } = req.body;

        // Validate required fields
        if (!date || !batch || !classroom || !attendanceRecords) {
            return res.status(400).json({
                success: false,
                message: 'Please provide date, batch, classroom, and attendance records'
            });
        }

        if (!Array.isArray(attendanceRecords) || !Number.isFinite(new Date(date).getTime())) {
            return res.status(400).json({ success: false, message: 'Provide a valid date and attendance records array' });
        }

        const existingAttendance = await Attendance.findOne({
            date: new Date(date),
            batch
        });

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: 'Attendance already marked for this date and batch'
            });
        }

        // Validate all learners are in the batch
        const batchDoc = await Batch.findById(batch);
        if (!batchDoc) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }




        if (!canWriteBatch(req.user, batchDoc)) {
            return res.status(403).json({ success: false, message: 'Not authorized to mark attendance for this batch' });
        }
        if (!validRoster(attendanceRecords, batchDoc)) {
            return res.status(400).json({ success: false, message: 'Attendance must contain unique enrolled learners and valid statuses' });
        }

        // Prepare attendance records with markedBy info
        const preparedRecords = attendanceRecords.map(record => ({
            ...record,
            markedBy: req.user._id,
            markedAt: new Date()
        }));

        // Create attendance
        const attendanceData = {
            date: new Date(date),
            batch,
            classroom,
            attendanceRecords: preparedRecords,
            sessionStartTime: sessionStartTime ? new Date(sessionStartTime) : null,
            sessionEndTime: sessionEndTime ? new Date(sessionEndTime) : null,
            createdBy: req.user._id
        };

        // Add daily update if provided
        if (dailyUpdate) {
            attendanceData.dailyUpdate = dailyUpdate;
        }

        const attendance = await Attendance.create(attendanceData);

        // If detailed daily update is provided, create a separate DailyUpdate record
        if (dailyUpdate && dailyUpdate.dailySummary) {
            const dailyUpdateData = {
                date: new Date(date),
                batch,
                postedBy: req.user._id,
                dailySummary: dailyUpdate.dailySummary,
                learnerHighlights: dailyUpdate.learnerHighlights || [],
                challenges: dailyUpdate.challenges || [],
                nextDayPlan: dailyUpdate.nextDayPlan || {},
                overallMood: dailyUpdate.overallMood || 'NEUTRAL',
                completionPercentage: dailyUpdate.completionPercentage || 0,
                visibility: dailyUpdate.visibility || ['MANAGER', 'TEAM_LEADER']
            };

            await DailyUpdate.create(dailyUpdateData);
        }

        const populatedAttendance = await Attendance.findById(attendance._id)
            .populate('batch', 'name code')
            .populate('classroom', 'name code location')
            .populate('attendanceRecords.learner', 'firstName lastName email')
            .populate('attendanceRecords.markedBy', 'firstName lastName');

        res.status(201).json({
            success: true,
            data: populatedAttendance,
            message: 'Attendance marked successfully'
        });
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update attendance
// @route   PUT /api/attendance/:id
// @access  Private/Trainer/TA (if not locked), Admin (always)
const updateAttendance = async (req, res) => {
    try {
        const { attendanceRecords, dailyUpdate, sessionStartTime, sessionEndTime } = req.body;

        const attendance = await Attendance.findById(req.params.id);

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }

        // Check if attendance is locked
        if (attendance.isLocked && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Attendance is locked and cannot be modified'
            });
        }

        const batchDoc = await Batch.findById(attendance.batch);
        if (!batchDoc || !canWriteBatch(req.user, batchDoc)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this attendance'
            });
        }

        // Store old values for audit log
        req.oldValues = attendance.toObject();
        req.changes = [];

        // Update attendance records if provided
        if (attendanceRecords) {
            if (!validRoster(attendanceRecords, batchDoc)) {
                return res.status(400).json({ success: false, message: 'Attendance must contain unique enrolled learners and valid statuses' });
            }

            // Prepare updated records with markedBy info
            const updatedRecords = attendanceRecords.map(record => ({
                ...record,
                markedBy: req.user._id,
                markedAt: new Date()
            }));

            attendance.attendanceRecords = updatedRecords;
            req.changes.push({
                field: 'attendanceRecords',
                oldValue: attendance.attendanceRecords.length,
                newValue: updatedRecords.length
            });
        }

        // Update daily update if provided
        if (dailyUpdate) {
            attendance.dailyUpdate = {
                ...attendance.dailyUpdate,
                ...dailyUpdate
            };
        }

        // Update session times if provided
        if (sessionStartTime) attendance.sessionStartTime = new Date(sessionStartTime);
        if (sessionEndTime) attendance.sessionEndTime = new Date(sessionEndTime);

        attendance.updatedBy = req.user._id;
        await attendance.save();

        // Update DailyUpdate record if exists
        if (dailyUpdate && dailyUpdate.dailySummary) {
            await DailyUpdate.findOneAndUpdate(
                { date: attendance.date, batch: attendance.batch, topic: attendance.topic },
                {
                    $set: {
                        dailySummary: dailyUpdate.dailySummary,
                        topicsCovered: dailyUpdate.topicsCovered || [],
                        learnerHighlights: dailyUpdate.learnerHighlights || [],
                        challenges: dailyUpdate.challenges || [],
                        nextDayPlan: dailyUpdate.nextDayPlan || {},
                        overallMood: dailyUpdate.overallMood || 'NEUTRAL',
                        completionPercentage: dailyUpdate.completionPercentage || 0,
                        updatedAt: new Date()
                    }
                },
                { upsert: true, new: true }
            );
        }

        const populatedAttendance = await Attendance.findById(attendance._id)
            .populate('batch', 'name code')
            .populate('classroom', 'name code location')
            .populate('attendanceRecords.learner', 'firstName lastName email')
            .populate('attendanceRecords.markedBy', 'firstName lastName');

        res.status(200).json({
            success: true,
            data: populatedAttendance,
            message: 'Attendance updated successfully'
        });
    } catch (error) {
        console.error('Update attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Lock attendance
// @route   POST /api/attendance/:id/lock
// @access  Private/Admin
const lockAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.findById(req.params.id);

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }

        if (attendance.isLocked) {
            return res.status(400).json({
                success: false,
                message: 'Attendance is already locked'
            });
        }

        attendance.isLocked = true;
        attendance.lockedAt = new Date();
        attendance.lockedBy = req.user._id;
        await attendance.save();

        res.status(200).json({
            success: true,
            message: 'Attendance locked successfully'
        });
    } catch (error) {
        console.error('Lock attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Private
const getAttendance = async (req, res) => {
    try {
        const { batch, date, startDate, endDate } = req.query;
        const { page, limit } = require('../utils/listQuery').pagination(req.query);

        const query = {};

        // Role-based filtering
        if (req.user.role === 'LEARNER') {
            // Get attendance records where learner is present
            query['attendanceRecords.learner'] = req.user._id;
        }

        if (!await scopeAttendanceQuery(req.user, batch, query)) {
            return res.status(403).json({ success: false, message: 'Access denied to this batch' });
        }
        if (date) query.date = new Date(date);

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const attendanceQuery = Attendance.find(query);
        if (req.user.role === 'LEARNER') attendanceQuery.select('date batch classroom attendanceRecords.$');
        const attendance = await attendanceQuery
            .populate('batch', 'name code')
            .populate('classroom', 'name code location')
            .populate('attendanceRecords.learner', 'firstName lastName email')
            .populate('attendanceRecords.markedBy', 'firstName lastName')
            .skip(skip)
            .limit(limit)
            .sort({ date: -1 });

        const total = await Attendance.countDocuments(query);

        res.status(200).json({
            success: true,
            count: attendance.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            data: attendance
        });
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get single attendance record
// @route   GET /api/attendance/:id
// @access  Private
const getAttendanceRecord = async (req, res) => {
    try {
        const attendance = await Attendance.findById(req.params.id)
            .populate('batch', 'name code')
            .populate('classroom', 'name code location')
            .populate('attendanceRecords.learner', 'firstName lastName email')
            .populate('attendanceRecords.markedBy', 'firstName lastName');

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }

        // Check access permissions
        const hasAccess = await checkAttendanceAccess(req.user, attendance);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this attendance record'
            });
        }

        res.status(200).json({
            success: true,
            data: req.user.role === 'LEARNER' ? {
                ...attendance.toObject(),
                attendanceRecords: attendance.attendanceRecords.filter(record => idOf(record.learner) === idOf(req.user._id)),
                dailyUpdate: undefined
            } : attendance
        });
    } catch (error) {
        console.error('Get attendance record error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get learner attendance
// @route   GET /api/attendance/learner/:learnerId
// @access  Private/Admin/Manager/Trainer/TA (for their topics), Learner (self)
const getLearnerAttendance = async (req, res) => {
    try {
        const { learnerId } = req.params;
        const { startDate, endDate, batch } = req.query;

        // Check if user is authorized to view this learner's attendance
        if (req.user.role === 'LEARNER' && req.user._id.toString() !== learnerId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view other learners\' attendance'
            });
        }

        const query = {
            'attendanceRecords.learner': learnerId
        };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        if (!await scopeAttendanceQuery(req.user, batch, query)) {
            return res.status(403).json({ success: false, message: 'Access denied to this batch' });
        }

        const attendance = await Attendance.find(query)
            .populate('batch', 'name code')
            .populate('classroom', 'name code location')
            .select('date attendanceRecords.$ batch classroom dailyUpdate')
            .sort({ date: -1 });

        // Calculate attendance statistics
        let totalDays = 0;
        let presentDays = 0;
        let absentDays = 0;
        let lateDays = 0;
        let halfDays = 0;

        const attendanceDetails = attendance.map(record => {
            const learnerRecord = record.attendanceRecords.find(
                ar => ar.learner.toString() === learnerId
            );

            if (learnerRecord) {
                totalDays++;
                if (['PRESENT', 'LATE'].includes(learnerRecord.status)) presentDays++;
                if (learnerRecord.status === 'ABSENT') absentDays++;
                if (learnerRecord.status === 'LATE') lateDays++;
                if (learnerRecord.status === 'HALF_DAY') halfDays++;
            }

            return {
                date: record.date,
                batch: record.batch,
                classroom: record.classroom,
                status: learnerRecord?.status || 'ABSENT',
                checkInTime: learnerRecord?.checkInTime,
                checkOutTime: learnerRecord?.checkOutTime,
                remarks: learnerRecord?.remarks,
                dailyUpdate: record.dailyUpdate
            };
        });

        const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

        res.status(200).json({
            success: true,
            data: {
                attendance: attendanceDetails,
                statistics: {
                    totalDays,
                    presentDays,
                    absentDays,
                    lateDays,
                    halfDays,
                    attendancePercentage: attendancePercentage.toFixed(2)
                }
            }
        });
    } catch (error) {
        console.error('Get learner attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Helper function to check attendance access
const checkAttendanceAccess = async (user, attendance) => {
    if (user.role === 'ADMIN') return true;

    if (user.role === 'LEARNER') {
        // Check if learner is in the attendance records
        return attendance.attendanceRecords.some(
            record => idOf(record.learner) === idOf(user._id)
        );
    }

    if (user.role === 'MANAGER') {
        // Check if manager created the batch
        const batch = await Batch.findById(attendance.batch);
        return batch && batch.createdBy.toString() === user._id.toString();
    }

    if (user.role === 'TEAM_LEADER') return true;
    if (user.role === 'TRAINER' || user.role === 'TA') {
        const batch = await Batch.findById(attendance.batch._id || attendance.batch);
        return !!batch && canWriteBatch(user, batch);
    }

    return false;
};

module.exports = {
    markAttendance,
    updateAttendance,
    lockAttendance,
    getAttendance,
    getAttendanceRecord,
    getLearnerAttendance
};
