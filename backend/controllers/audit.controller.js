const AuditLog = require('../models/AuditLog.model');

// @desc    Get audit logs
// @route   GET /api/audit
// @access  Private/Admin
const getAuditLogs = async (req, res) => {
  try {
    const { entity, entityId, action, performedBy, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    const query = {};
    
    if (entity) query.entity = entity;
    if (entityId) query.entityId = entityId;
    if (action) query.action = action;
    if (performedBy) query.performedBy = performedBy;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    
    const logs = await AuditLog.find(query)
      .populate('performedBy', 'firstName lastName email role')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ timestamp: -1 });

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: logs
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get audit log statistics
// @route   GET /api/audit/stats
// @access  Private/Admin
const getAuditStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const stats = await AuditLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            entity: '$entity',
            action: '$action'
          },
          count: { $sum: 1 },
          users: { $addToSet: '$performedBy' }
        }
      },
      {
        $project: {
          entity: '$_id.entity',
          action: '$_id.action',
          count: 1,
          uniqueUsers: { $size: '$users' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get top performers
    const topPerformers = await AuditLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$performedBy',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Populate user details for top performers
    const performerIds = topPerformers.map(p => p._id);
    const users = await require('../models/User.model').find(
      { _id: { $in: performerIds } },
      'firstName lastName email role'
    );

    const topPerformersWithDetails = topPerformers.map(performer => {
      const user = users.find(u => u._id.toString() === performer._id.toString());
      return {
        user: user ? {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        } : null,
        actionsCount: performer.count
      };
    });

    res.status(200).json({
      success: true,
      data: {
        stats,
        topPerformers: topPerformersWithDetails,
        summary: {
          totalActions: stats.reduce((sum, stat) => sum + stat.count, 0),
          uniqueEntities: [...new Set(stats.map(stat => stat.entity))].length,
          uniqueActions: [...new Set(stats.map(stat => stat.action))].length,
          uniqueUsers: topPerformers.length
        }
      }
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getAuditLogs,
  getAuditStats
};