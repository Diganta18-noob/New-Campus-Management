const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const {
  getBatches,
  getBatch,
  createBatch,
  updateBatch,
  deleteBatch,
  getBatchStats,
  getBatchAttendance,
  getAvailableTrainers,
  getAvailableTAs,
  getAvailableLearners,
  getAvailableClassrooms
} = require('../controllers/batch.controller');

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

// Routes for getting available trainers and TAs (must be before /:id routes)
router.route('/available-trainers')
  .get(authorize('ADMIN'), getAvailableTrainers);

router.route('/available-tas')
  .get(authorize('ADMIN'), getAvailableTAs);

router.route('/available-learners')
  .get(authorize('ADMIN'), getAvailableLearners);

router.route('/available-classrooms')
  .get(authorize('ADMIN'), getAvailableClassrooms);

// Routes accessible by ADMIN for creation
router.route('/')
  .get(getBatches)
  .post(authorize('ADMIN'), createBatch);

// Routes accessible by ADMIN for modification
router.route('/:id')
  .get(authorize('ADMIN', 'MANAGER', 'TEAM_LEADER', 'TRAINER', 'TA', 'LEARNER'), getBatch)
  .put(authorize('ADMIN'), updateBatch)
  .delete(authorize('ADMIN'), deleteBatch);

router.route('/:id/stats')
  .get(authorize('ADMIN', 'MANAGER', 'TEAM_LEADER', 'TRAINER', 'TA', 'LEARNER'), getBatchStats);

router.route('/:id/attendance')
  .get(authorize('ADMIN', 'MANAGER', 'TEAM_LEADER'), getBatchAttendance);

module.exports = router;