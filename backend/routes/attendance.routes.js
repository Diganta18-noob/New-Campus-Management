const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const {
  markAttendance,
  updateAttendance,
  lockAttendance,
  getAttendance,
  getAttendanceRecord,
  getLearnerAttendance
} = require('../controllers/attendance.controller');

// All routes protected
router.use(protect);

// Apply audit logging to all non-GET routes
router.use(auditLog);

router.route('/')
  .get(getAttendance)
  .post(authorize('TRAINER', 'TA'), markAttendance);

router.route('/learner/:learnerId')
  .get(getLearnerAttendance);

router.route('/:id')
  .get(getAttendanceRecord)
  .put(authorize('TRAINER', 'TA', 'ADMIN'), updateAttendance);

router.route('/:id/lock')
  .post(authorize('ADMIN'), lockAttendance);

module.exports = router;