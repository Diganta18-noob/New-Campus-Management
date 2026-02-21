const AuditLog = require('../models/AuditLog.model');

const auditLog = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Store original function context
    res.send = originalSend;
    
    // Log the audit after response is sent
    setTimeout(async () => {
      try {
        if (req.user && req.method !== 'GET') {
          const auditData = {
            action: getActionFromMethod(req.method),
            entity: getEntityFromPath(req.path),
            entityId: req.params.id || req.body._id || null,
            performedBy: req.user._id,
            userRole: req.user.role,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            oldValues: req.oldValues || null,
            newValues: req.body,
            changes: req.changes || []
          };

          await AuditLog.create(auditData);
        }
      } catch (error) {
        console.error('Audit log error:', error);
      }
    }, 0);
    
    return originalSend.call(this, data);
  };
  
  next();
};

const getActionFromMethod = (method) => {
  const methodMap = {
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE'
  };
  return methodMap[method] || method;
};

const getEntityFromPath = (path) => {
  const pathParts = path.split('/');
  const entityMap = {
    'users': 'USER',
    'batches': 'BATCH',
    'attendance': 'ATTENDANCE',
    'daily-updates': 'DAILY_UPDATE',
    'classrooms': 'CLASSROOM'
  };
  
  for (const part of pathParts) {
    if (entityMap[part]) {
      return entityMap[part];
    }
  }
  
  return 'SYSTEM';
};

module.exports = { auditLog };