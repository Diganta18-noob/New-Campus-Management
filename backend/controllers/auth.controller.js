const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { auditLogger } = require('../utils/logger');
const { startSession, recordHeartbeat, endSession, revokeOtherSessions } = require('../services/sessionActivity.service');

// Generate JWT Token
const generateToken = (id, version = 0, sessionId) => {
  return jwt.sign({ id, v: version, ...(sessionId && { sid: String(sessionId) }) }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(403).json({
        success: false,
        message: 'Account is temporarily locked. Try again later.'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      await user.incrementLoginAttempts();

      auditLogger.warn('Failed login attempt', {
        email,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact administrator.'
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Generate token
    const session = await startSession(user);
    const token = generateToken(user._id, user.tokenVersion || 0, session._id);

    // Audit log
    auditLogger.info('User logged in', {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        assignedBatches: user.assignedBatches,
        requiresPasswordReset: user.requiresPasswordReset || false,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { email, username, password, firstName, lastName, phone, role } = req.body;

    // Validate input
    if (!email || !username || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Public self-registration cannot grant staff or administrator privileges.
    if (role !== undefined && role !== 'LEARNER') {
      return res.status(400).json({
        success: false,
        message: 'Public registration is for learners only. Staff accounts must be created by an administrator.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email
          ? 'Email already registered'
          : 'Username already taken'
      });
    }

    // Create user
    const user = await User.create({
      email,
      username,
      password,
      firstName,
      lastName,
      phone,
      role: 'LEARNER',
      lastLogin: new Date(),
    });

    // Generate token
    const session = await startSession(user);
    const token = generateToken(user._id, user.tokenVersion || 0, session._id);

    // Audit log
    auditLogger.info('New user registered', {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Register error:', error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('assignedBatches', 'name code');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    await recordHeartbeat(req.user._id, req.sessionId);
    await endSession(req.user._id, req.sessionId, 'LOGOUT');
    await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
    await revokeOtherSessions(req.user._id);
    auditLogger.info('User logged out', {
      userId: req.user._id,
      email: req.user.email
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const heartbeat = async (req, res, next) => {
  try {
    const tracked = await recordHeartbeat(req.user._id, req.sessionId);
    res.json({ success: true, tracked });
  } catch (error) { next(error); }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password and clear force-reset flag
    user.password = newPassword;
    user.requiresPasswordReset = false;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    await recordHeartbeat(user._id, req.sessionId);
    await endSession(user._id, req.sessionId, 'PASSWORD_CHANGE');
    await revokeOtherSessions(user._id);
    const session = await startSession(user);

    auditLogger.info('Password changed', {
      userId: user._id,
      email: user.email
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      token: generateToken(user._id, user.tokenVersion, session._id)
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  login,
  register,
  getMe,
  logout,
  heartbeat,
  changePassword
};
