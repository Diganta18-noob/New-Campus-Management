const User = require('../models/User.model');
const Batch = require('../models/Batch.model');
const Attendance = require('../models/Attendance.model');
const DailyUpdate = require('../models/DailyUpdate.model');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        let stats = {};

        switch (req.user.role) {
            case 'ADMIN':
                stats = await getAdminStats();
                break;
            case 'MANAGER':
                stats = await getManagerStats(req.user._id);
                break;
            case 'TEAM_LEADER':
                stats = await getTeamLeaderStats(req.user._id);
                break;
            case 'TRAINER':
            case 'TA':
                stats = await getTrainerStats(req.user._id, req.user.role);
                break;
            case 'LEARNER':
                stats = await getLearnerStats(req.user._id);
                break;
            default:
                stats = { message: 'No stats available for this role' };
        }

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Admin dashboard statistics
const getAdminStats = async () => {
    const [
        totalUsers,
        activeUsers,
        totalBatches,
        ongoingBatches,
        todayAttendance,
        recentUpdates
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        Batch.countDocuments(),
        Batch.countDocuments({ status: 'ONGOING' }),
        Attendance.countDocuments({ date: new Date().setHours(0, 0, 0, 0) }),
        DailyUpdate.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
    ]);

    // Get role distribution
    const roleStats = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Get batch status distribution
    const batchStats = await Batch.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    return {
        summary: {
            totalUsers,
            activeUsers,
            totalBatches,
            ongoingBatches,
            todayAttendance,
            recentUpdates
        },
        roleStats,
        batchStats
    };
};

// Manager dashboard statistics
const getManagerStats = async (managerId) => {
    // Get batches created by manager
    const managerBatches = await Batch.find({ createdBy: managerId }).select('_id');
    const batchIds = managerBatches.map(b => b._id);

    const [
        totalBatches,
        ongoingBatches,
        totalLearners,
        todayAttendance,
        recentUpdates
    ] = await Promise.all([
        Batch.countDocuments({ createdBy: managerId }),
        Batch.countDocuments({ createdBy: managerId, status: 'ONGOING' }),
        User.countDocuments({
            role: 'LEARNER',
            assignedBatches: { $in: batchIds }
        }),
        Attendance.countDocuments({
            batch: { $in: batchIds },
            date: new Date().setHours(0, 0, 0, 0)
        }),
        DailyUpdate.countDocuments({
            batch: { $in: batchIds },
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
    ]);

    // Get batch-wise statistics
    const batchesWithStats = await Batch.find({ createdBy: managerId })
        .select('name code status startDate endDate learners')
        .populate('learners', 'firstName lastName');

    // Get recent daily updates for manager's batches
    const recentDailyUpdates = await DailyUpdate.find({
        batch: { $in: batchIds },
        visibility: { $in: ['MANAGER'] }
    })
        .populate('batch', 'name code')
        .populate('postedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10);

    return {
        summary: {
            totalBatches,
            ongoingBatches,
            totalLearners,
            todayAttendance,
            recentUpdates
        },
        batches: batchesWithStats.map(batch => ({
            id: batch._id,
            name: batch.name,
            code: batch.code,
            status: batch.status,
            progress: batch.progress,
            totalLearners: batch.learners.length,
            startDate: batch.startDate,
            endDate: batch.endDate
        })),
        recentDailyUpdates
    };
};

// Team Leader dashboard statistics
const getTeamLeaderStats = async (teamLeaderId) => {
    // Get all ongoing batches
    const ongoingBatches = await Batch.find({ status: 'ONGOING' }).select('_id name code');
    const batchIds = ongoingBatches.map(b => b._id);

    const [
        totalBatches,
        totalLearners,
        recentUpdates
    ] = await Promise.all([
        Batch.countDocuments({ status: 'ONGOING' }),
        User.countDocuments({
            role: 'LEARNER',
            assignedBatches: { $in: batchIds }
        }),
        DailyUpdate.countDocuments({
            batch: { $in: batchIds },
            visibility: { $in: ['TEAM_LEADER'] },
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
    ]);

    // Get batch-wise attendance statistics
    const batchStats = await Promise.all(
        ongoingBatches.map(async (batch) => {
            const attendance = await Attendance.find({ batch: batch._id })
                .select('attendanceRecords date')
                .limit(30); // Last 30 days

            let totalPresent = 0;
            let totalDays = 0;

            attendance.forEach(record => {
                totalDays++;
                totalPresent += record.attendanceRecords.filter(ar =>
                    ['PRESENT', 'LATE', 'HALF_DAY'].includes(ar.status)
                ).length;
            });

            const avgAttendance = totalDays > 0 ? (totalPresent / (totalDays * batch.learners?.length || 1)) * 100 : 0;

            return {
                id: batch._id,
                name: batch.name,
                code: batch.code,
                avgAttendance: avgAttendance.toFixed(2)
            };
        })
    );

    // Get recent daily updates visible to team leader
    const recentDailyUpdates = await DailyUpdate.find({
        batch: { $in: batchIds },
        visibility: { $in: ['TEAM_LEADER'] }
    })
        .populate('batch', 'name code')
        .populate('postedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10);

    return {
        summary: {
            totalBatches,
            totalLearners,
            recentUpdates
        },
        batchStats,
        recentDailyUpdates
    };
};

// Trainer/TA dashboard statistics
const getTrainerStats = async (userId, role) => {
    // Get all batches and attendance data for general overview
    // Note: Without Topic model, trainers/TAs see all batches
    const batches = await Batch.find()
        .select('name code status')
        .populate('learners', 'firstName lastName');

    const batchIds = batches.map(b => b._id);

    const [
        totalBatches,
        totalLearners,
        todayAttendance
    ] = await Promise.all([
        Batch.countDocuments(),
        User.countDocuments({ role: 'LEARNER' }),
        Attendance.countDocuments({
            date: new Date().setHours(0, 0, 0, 0)
        })
    ]);

    // Get recent attendance records
    const recentAttendance = await Attendance.find()
        .populate('batch', 'name code')
        .populate('attendanceRecords.learner', 'firstName lastName')
        .sort({ date: -1 })
        .limit(10);

    return {
        summary: {
            totalBatches,
            totalLearners,
            todayAttendance,
            todaysClasses: 0
        },
        todaysSchedule: [],
        recentAttendance: recentAttendance.map(att => ({
            id: att._id,
            date: att.date,
            batch: att.batch,
            totalPresent: att.presentCount,
            totalAbsent: att.absentCount,
            attendancePercentage: att.attendancePercentage
        })),
        batches: batches.map(batch => ({
            id: batch._id,
            name: batch.name,
            code: batch.code,
            status: batch.status,
            totalLearners: batch.learners.length
        }))
    };
};

// Learner dashboard statistics
const getLearnerStats = async (learnerId) => {
    // Get learner's assigned batches
    const learner = await User.findById(learnerId)
        .populate('assignedBatches', 'name code startDate endDate status');

    const batchIds = learner.assignedBatches.map(b => b._id);

    // Get attendance statistics
    const attendanceStats = await Attendance.aggregate([
        {
            $match: {
                'attendanceRecords.learner': learnerId,
                batch: { $in: batchIds }
            }
        },
        { $unwind: '$attendanceRecords' },
        { $match: { 'attendanceRecords.learner': learnerId } },
        {
            $group: {
                _id: null,
                totalDays: { $sum: 1 },
                presentDays: {
                    $sum: {
                        $cond: [
                            { $in: ['$attendanceRecords.status', ['PRESENT', 'LATE', 'HALF_DAY']] },
                            1, 0
                        ]
                    }
                },
                lateDays: {
                    $sum: {
                        $cond: [
                            { $eq: ['$attendanceRecords.status', 'LATE'] },
                            1, 0
                        ]
                    }
                }
            }
        }
    ]);

    const stats = attendanceStats[0] || { totalDays: 0, presentDays: 0, lateDays: 0 };
    const attendancePercentage = stats.totalDays > 0 ?
        (stats.presentDays / stats.totalDays) * 100 : 0;

    // Get recent attendance
    const recentAttendance = await Attendance.find({
        'attendanceRecords.learner': learnerId,
        batch: { $in: batchIds }
    })
        .populate('batch', 'name code')
        .select('date attendanceRecords.$ batch')
        .sort({ date: -1 })
        .limit(10);

    return {
        summary: {
            totalBatches: learner.assignedBatches.length,
            totalAttendanceDays: stats.totalDays,
            presentDays: stats.presentDays,
            lateDays: stats.lateDays,
            attendancePercentage: attendancePercentage.toFixed(2),
            todaysClasses: 0
        },
        batches: learner.assignedBatches,
        todaysSchedule: [],
        recentAttendance: recentAttendance.map(att => {
            const record = att.attendanceRecords[0];
            return {
                date: att.date,
                batch: att.batch,
                status: record?.status || 'ABSENT',
                checkInTime: record?.checkInTime,
                checkOutTime: record?.checkOutTime,
                remarks: record?.remarks
            };
        })
    };
};

module.exports = {
    getDashboardStats
};