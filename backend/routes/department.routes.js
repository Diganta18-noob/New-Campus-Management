const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const {
    getDepartments,
    getDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment
} = require('../controllers/department.controller');

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

// Routes
router.route('/')
    .get(getDepartments)
    .post(authorize('ADMIN'), createDepartment);

router.route('/:id')
    .get(getDepartment)
    .put(authorize('ADMIN'), updateDepartment)
    .delete(authorize('ADMIN'), deleteDepartment);

module.exports = router;
