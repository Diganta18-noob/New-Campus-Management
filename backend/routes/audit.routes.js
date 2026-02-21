const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  getAuditLogs,
  getAuditStats
} = require('../controllers/audit.controller');

// All routes protected and only for ADMIN
router.use(protect);
router.use(authorize('ADMIN'));

router.route('/')
  .get(getAuditLogs);

router.route('/stats')
  .get(getAuditStats);

module.exports = router;