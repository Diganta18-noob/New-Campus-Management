const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  login,
  register,
  getMe,
  logout,
  changePassword
} = require('../controllers/auth.controller');

router.post('/login', login);
router.post('/register', register);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/change-password', protect, changePassword);

module.exports = router;