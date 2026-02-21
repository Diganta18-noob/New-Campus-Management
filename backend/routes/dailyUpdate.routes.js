const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const {
  createDailyUpdate,
  getDailyUpdates,
  getDailyUpdate,
  updateDailyUpdate,
  addFeedback,
  getBatchUpdatesSummary
} = require('../controllers/dailyUpdate.controller');

// All routes protected
router.use(protect);

// Apply audit logging to non-GET routes
router.use((req, res, next) => {
  if (req.method !== 'GET') {
    auditLog(req, res, next);
  } else {
    next();
  }
});

router.route('/')
  .get(getDailyUpdates)
  .post(authorize('TRAINER', 'TA'), createDailyUpdate);

router.route('/batch/:batchId/summary')
  .get(authorize('ADMIN', 'MANAGER', 'TEAM_LEADER', 'TRAINER', 'TA'), getBatchUpdatesSummary);

router.route('/:id')
  .get(getDailyUpdate)
  .put(authorize('TRAINER', 'TA', 'ADMIN'), updateDailyUpdate);

router.route('/:id/feedback')
  .post(authorize('MANAGER', 'TEAM_LEADER'), addFeedback);

module.exports = router;