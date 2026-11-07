const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.sessionId = typeof decoded.sid === 'string' && /^[a-f\d]{24}$/i.test(decoded.sid) ? decoded.sid : null;
      
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if ((decoded.v ?? 0) !== (req.user.tokenVersion || 0)) {
        return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
      }

      if (!req.user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      const resetPaths = {
        GET: '/api/auth/me',
        PUT: '/api/auth/change-password',
        POST: '/api/auth/logout'
      };
      const requestPath = req.originalUrl.split('?')[0].replace(/\/$/, '');
      if (req.user.requiresPasswordReset && resetPaths[req.method] !== requestPath) {
        return res.status(403).json({
          success: false,
          code: 'PASSWORD_RESET_REQUIRED',
          message: 'Change your default password before accessing campus data'
        });
      }

      next();
    } catch (error) {
      logger.error('Auth middleware error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this resource`
      });
    }

    next();
  };
};

const roleBasedAccess = (rolePermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const userRole = req.user.role;
    const routePermissions = rolePermissions[userRole];

    if (!routePermissions || !routePermissions.includes(req.method)) {
      return res.status(403).json({
        success: false,
        message: `Access denied for ${userRole} role`
      });
    }

    next();
  };
};

module.exports = { protect, authorize, roleBasedAccess };
