const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getDashboardStats
} = require('../controllers/dashboard.controller');

// All routes protected
router.use(protect);

router.route('/stats')
  .get(getDashboardStats);

module.exports = router;