const Department = require('../models/Department.model');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
exports.getDepartments = async (req, res) => {
    try {
        const { search, status, page = 1, limit = 10 } = req.query;

        // Build query
        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) {
            query.status = status;
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [departments, total] = await Promise.all([
            Department.find(query)
                .populate('createdBy', 'firstName lastName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Department.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: departments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching departments',
            error: error.message
        });
    }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
exports.getDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id)
            .populate('createdBy', 'firstName lastName email');

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        res.status(200).json({
            success: true,
            data: department
        });
    } catch (error) {
        console.error('Get department error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching department',
            error: error.message
        });
    }
};

// @desc    Create new department
// @route   POST /api/departments
// @access  Private (ADMIN, MANAGER)
exports.createDepartment = async (req, res) => {
    try {
        const { name, code, description } = req.body;

        // Validate required fields
        if (!name || !code) {
            return res.status(400).json({
                success: false,
                message: 'Name and code are required'
            });
        }

        // Check if department with same name or code exists
        const existingDepartment = await Department.findOne({
            $or: [
                { name: { $regex: new RegExp(`^${name}$`, 'i') } },
                { code: code.toUpperCase() }
            ]
        });

        if (existingDepartment) {
            return res.status(400).json({
                success: false,
                message: 'Department with this name or code already exists'
            });
        }

        const department = await Department.create({
            name,
            code: code.toUpperCase(),
            description,
            createdBy: req.user.id
        });

        const populatedDepartment = await Department.findById(department._id)
            .populate('createdBy', 'firstName lastName email');

        res.status(201).json({
            success: true,
            message: 'Department created successfully',
            data: populatedDepartment
        });
    } catch (error) {
        console.error('Create department error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating department',
            error: error.message
        });
    }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (ADMIN, MANAGER)
exports.updateDepartment = async (req, res) => {
    try {
        const { name, code, description, status } = req.body;

        let department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        // Check for duplicate name or code (excluding current department)
        if (name || code) {
            const checkConditions = [];
            if (name) {
                checkConditions.push({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
            }
            if (code) {
                checkConditions.push({ code: code.toUpperCase() });
            }

            const existingDepartment = await Department.findOne({
                _id: { $ne: req.params.id },
                $or: checkConditions
            });

            if (existingDepartment) {
                return res.status(400).json({
                    success: false,
                    message: 'Another department with this name or code already exists'
                });
            }
        }

        // Update fields
        const updateData = {};
        if (name) updateData.name = name;
        if (code) updateData.code = code.toUpperCase();
        if (description !== undefined) updateData.description = description;
        if (status) updateData.status = status;

        department = await Department.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('createdBy', 'firstName lastName email');

        res.status(200).json({
            success: true,
            message: 'Department updated successfully',
            data: department
        });
    } catch (error) {
        console.error('Update department error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating department',
            error: error.message
        });
    }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (ADMIN)
exports.deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        // Soft delete by setting status to INACTIVE
        department.status = 'INACTIVE';
        await department.save();

        res.status(200).json({
            success: true,
            message: 'Department deactivated successfully',
            data: department
        });
    } catch (error) {
        console.error('Delete department error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting department',
            error: error.message
        });
    }
};
