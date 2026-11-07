const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { getInsights } = require('../controllers/insights.controller');
const { getOperations } = require('../controllers/operations.controller');
const { getEngagement } = require('../controllers/engagement.controller');
const {
  getDashboardStats
} = require('../controllers/dashboard.controller');

// All routes protected
router.use(protect);

router.get('/insights', authorize('ADMIN'), getInsights);
router.get('/operations', authorize('ADMIN'), getOperations);
router.get('/engagement', authorize('ADMIN'), getEngagement);

router.route('/stats')
  .get(getDashboardStats);

module.exports = router;
