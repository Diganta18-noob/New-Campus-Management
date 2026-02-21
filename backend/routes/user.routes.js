const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const {
  getUsers,
  getUser,
  createUser,
  bulkCreateUsers,
  updateUser,
  updateUserStatus,
  resetPassword,
  getUserStats
} = require('../controllers/user.controller');

// All routes protected and only for ADMIN
router.use(protect);
router.use(authorize('ADMIN'));

// Apply audit logging to all non-GET routes
router.use(auditLog);

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/bulk')
  .post(bulkCreateUsers);

router.route('/stats')
  .get(getUserStats);

router.route('/:id')
  .get(getUser)
  .put(updateUser);

router.route('/:id/status')
  .patch(updateUserStatus);

router.route('/:id/reset-password')
  .post(resetPassword);

module.exports = router;