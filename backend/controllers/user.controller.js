const User = require('../models/User.model');
const Batch = require('../models/Batch.model');
const Classroom = require('../models/Classroom.model');
const { randomBytes } = require('node:crypto');
const { pagination, literalSearch } = require('../utils/listQuery');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const { role, isActive } = req.query;
    const { page, limit } = pagination(req.query);
    const search = literalSearch(req.query.search);
    
    const query = {};
    
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const users = await User.find(query)
      .select('-password')
      .populate('assignedBatches', 'name code')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('assignedBatches', 'name code startDate endDate status')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { email, username, password, firstName, lastName, phone, role, assignedBatches } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Validate batches if assigned
    if (assignedBatches && assignedBatches.length > 0) {
      const batches = await Batch.find({ _id: { $in: assignedBatches } });
      if (batches.length !== assignedBatches.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more batches not found'
        });
      }
    }


    // Create user
    const temporaryPassword = password || randomBytes(18).toString('base64url');
    if (temporaryPassword.length < 12) return res.status(400).json({ success: false, message: 'Password must be at least 12 characters' });
    const user = await User.create({
      email,
      username,
      password: temporaryPassword,
      requiresPasswordReset: true,
      firstName,
      lastName,
      phone,
      role: role || 'LEARNER',
      assignedBatches,
    });

    // If user is a learner, add them to batch learners array
    if (role === 'LEARNER' && assignedBatches && assignedBatches.length > 0) {
      await Batch.updateMany(
        { _id: { $in: assignedBatches } },
        { $addToSet: { learners: user._id } }
      );
    }

    const createdUser = await User.findById(user._id)
      .select('-password')
      .populate('assignedBatches', 'name code');

    res.status(201).json({
      success: true,
      data: createdUser,
      ...(!password && { temporaryPassword })
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Bulk create users
// @route   POST /api/users/bulk
// @access  Private/Admin
const bulkCreateUsers = async (req, res) => {
    try {
        const { users } = req.body; // Array of user objects

        if (!users || !Array.isArray(users) || users.length === 0 || users.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'Provide 1 to 500 users'
            });
        }
        if (users.some(user => user.role && user.role !== 'LEARNER')) return res.status(400).json({ success: false, message: 'Bulk import accepts learners only' });

        const stats = {
            successful: 0,
            failed: 0,
            batchAssigned: 0,
            batchNotFound: 0,
            errors: []
        };

        const createdUsers = [];
        const temporaryCredentials = [];

        // Pre-fetch all unique cohortIds and resolve them to Batch documents
        const uniqueCohortIds = [...new Set(
            users
                .map(u => u.cohortId)
                .filter(Boolean)
                .map(id => id.toString().trim().toUpperCase())
        )];

        const batchMap = {}; // cohortId (uppercase) -> Batch document
        if (uniqueCohortIds.length > 0) {
            const matchedBatches = await Batch.find({ code: { $in: uniqueCohortIds }, status: { $in: ['PLANNING', 'ONGOING'] } });
            matchedBatches.forEach(batch => {
                batchMap[batch.code.toUpperCase()] = batch;
            });
        }

        for (const userData of users) {
            try {
                // Determine username if not provided
                let username = userData.username;
                if (!username && userData.email) {
                    username = userData.email.split('@')[0];
                }

                if (!username || !userData.email) {
                    throw new Error('Email and Username are required');
                }

                // Check for existing
                const existing = await User.findOne({
                    $or: [{ email: userData.email }, { username: username }]
                });

                if (existing) {
                    throw new Error(`User already exists: ${userData.email}`);
                }

                // Resolve cohortId to a Batch
                const cohortKey = userData.cohortId
                    ? userData.cohortId.toString().trim().toUpperCase()
                    : null;
                const matchedBatch = cohortKey ? batchMap[cohortKey] : null;

                const temporaryPassword = randomBytes(18).toString('base64url');
                const user = await User.create({
                    email: userData.email,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    phone: userData.phone,
                    rollNumber: userData.rollNumber,
                    cohortId: userData.cohortId,
                    username,
                    role: 'LEARNER',
                    password: temporaryPassword,
                    requiresPasswordReset: true,
                    assignedBatches: []
                });

                // Add user to the batch's learners array
                if (matchedBatch) {
                    const room = matchedBatch.classroom ? await Classroom.findById(matchedBatch.classroom).select('capacity').lean() : null;
                    const condition = { _id: matchedBatch._id, learners: { $ne: user._id } };
                    if (room?.capacity != null) condition.$expr = { $lt: [{ $size: '$learners' }, room.capacity] };
                    const assignment = await Batch.updateOne(condition, { $addToSet: { learners: user._id } });
                    if (assignment.modifiedCount) {
                        try { await User.updateOne({ _id: user._id }, { $addToSet: { assignedBatches: matchedBatch._id } }); }
                        catch (error) { await Batch.updateOne({ _id: matchedBatch._id }, { $pull: { learners: user._id } }); throw error; }
                        stats.batchAssigned++;
                    } else {
                        stats.errors.push({ email: userData.email, error: `User created but batch ${matchedBatch.code} is full` });
                    }
                } else if (cohortKey) {
                    // cohortId was provided but no matching batch was found
                    stats.batchNotFound++;
                    stats.errors.push({
                        email: userData.email,
                        error: `User created but batch not found for cohortId: ${userData.cohortId}`
                    });
                }

                createdUsers.push(user);
                temporaryCredentials.push({ email: user.email, temporaryPassword });
                stats.successful++;
            } catch (error) {
                stats.failed++;
                stats.errors.push({
                    email: userData.email,
                    error: error.message
                });
            }
        }

        res.status(201).json({
            success: true,
            data: {
                stats,
                createdUsers: createdUsers.length,
                temporaryCredentials
            },
            message: `Successfully created ${stats.successful} users. ${stats.batchAssigned} assigned to batches. ${stats.failed} failed.`
        });

    } catch (error) {
        console.error('Bulk create users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during bulk creation'
        });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { assignedBatches, ...updateData } = req.body;
    const userId = req.params.id;

    // Don't allow password update via this route
    if (updateData.password) {
      delete updateData.password;
    }

    // Store old values for audit log
    const oldUser = await User.findById(userId);
    req.oldValues = oldUser ? oldUser.toObject() : null;
    req.changes = [];

    // Update assigned batches
    if (assignedBatches !== undefined) {
      const oldBatches = oldUser.assignedBatches.map(b => b.toString());
      const newBatches = assignedBatches.map(b => b.toString());
      
      // Find added and removed batches
      const addedBatches = newBatches.filter(b => !oldBatches.includes(b));
      const removedBatches = oldBatches.filter(b => !newBatches.includes(b));

      if (oldUser.role === 'LEARNER') {
        // Remove from old batches
        await Batch.updateMany(
          { _id: { $in: removedBatches } },
          { $pull: { learners: userId } }
        );
        
        // Add to new batches
        await Batch.updateMany(
          { _id: { $in: addedBatches } },
          { $addToSet: { learners: userId } }
        );
      }

      updateData.assignedBatches = assignedBatches;
      req.changes.push({
        field: 'assignedBatches',
        oldValue: oldBatches,
        newValue: newBatches
      });
    }


    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Deactivate/activate user
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean'
      });
    }

    // Store old values for audit log
    const oldUser = await User.findById(req.params.id);
    req.oldValues = oldUser ? { isActive: oldUser.isActive } : null;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    req.changes = [{
      field: 'isActive',
      oldValue: !isActive,
      newValue: isActive
    }];

    res.status(200).json({
      success: true,
      data: user,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reset user password
// @route   POST /api/users/:id/reset-password
// @access  Private/Admin
const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 12) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 12 characters'
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password
    user.password = newPassword;
    user.requiresPasswordReset = true;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private/Admin
const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          role: '$_id',
          count: 1,
          active: 1,
          inactive: { $subtract: ['$count', '$active'] }
        }
      }
    ]);

    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        stats,
        total
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  bulkCreateUsers,
  updateUser,
  updateUserStatus,
  resetPassword,
  getUserStats
};
