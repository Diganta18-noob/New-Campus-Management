const AuditLog = require('../models/AuditLog.model');

const auditLog = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Store original function context
    res.send = originalSend;
    
    // Log the audit after response is sent
    setTimeout(async () => {
      try {
        if (req.user && req.method !== 'GET' && res.statusCode < 400) {
          let responseBody;
          try { responseBody = typeof data === 'string' ? JSON.parse(data) : data; } catch { responseBody = null; }
          const requestPath = req.originalUrl.split('?')[0];
          const entityId = requestPath.startsWith('/api/settings') ? req.user._id : (req.params.id || responseBody?.data?._id || req.body._id);
          if (!entityId) return;
          const auditData = {
            action: getActionFromMethod(req.method),
            entity: getEntityFromPath(requestPath),
            entityId,
            performedBy: req.user._id,
            userRole: req.user.role,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            oldValues: req.oldValues || null,
            newValues: /support-cases|settings\/me|results|users\/bulk/.test(requestPath) ? null : Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => !/password|token|secret/i.test(key))),
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
    'classrooms': 'CLASSROOM',
    'topics': 'TOPIC',
    'campus-posts': 'CAMPUS_POST',
    'assessments': 'ASSESSMENT',
    'support-cases': 'SUPPORT_CASE',
    'enrollments': 'ENROLLMENT',
    'settings': 'SETTING'
  };
  
  for (const part of pathParts) {
    if (entityMap[part]) {
      return entityMap[part];
    }
  }
  
  return 'SYSTEM';
};

module.exports = { auditLog };
