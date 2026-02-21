const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const {
  getClassrooms,
  getClassroom,
  createClassroom,
  updateClassroom,
  checkAvailability
} = require('../controllers/classroom.controller');

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
  .get(authorize('ADMIN', 'MANAGER', 'TRAINER', 'TA'), getClassrooms)
  .post(authorize('ADMIN', 'MANAGER'), createClassroom);

router.route('/:id')
  .get(authorize('ADMIN', 'MANAGER', 'TRAINER', 'TA'), getClassroom)
  .put(authorize('ADMIN', 'MANAGER'), updateClassroom);

router.route('/:id/availability')
  .get(authorize('ADMIN', 'MANAGER', 'TRAINER', 'TA'), checkAvailability);

module.exports = router;