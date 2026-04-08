const Batch = require('../models/Batch.model');
const User = require('../models/User.model');
const Attendance = require('../models/Attendance.model');
const Classroom = require('../models/Classroom.model');

// @desc    Get all batches
// @route   GET /api/batches
// @access  Private/Admin/Manager
const getBatches = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;

        const query = {};

        // Role-based filtering
        if (req.user.role === 'MANAGER') {
            query.createdBy = req.user._id;
        } else if (req.user.role === 'LEARNER') {
            query._id = { $in: req.user.assignedBatches };
        } else if (req.user.role === 'TRAINER') {
            query.trainers = req.user._id;
        } else if (req.user.role === 'TA') {
            query.tas = req.user._id;
        }

        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { clientName: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const batches = await Batch.find(query)
            .populate('department', 'name code')
            .populate('classroom', 'name code location capacity')
            .populate('learners', 'firstName lastName email')
            .populate('trainers', 'firstName lastName email')
            .populate('tas', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Batch.countDocuments(query);

        res.status(200).json({
            success: true,
            count: batches.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            data: batches
        });
    } catch (error) {
        console.error('Get batches error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get single batch
// @route   GET /api/batches/:id
// @access  Private
const getBatch = async (req, res) => {
    try {
        const batch = await Batch.findById(req.params.id)
            .populate('department', 'name code')
            .populate('classroom', 'name code location capacity')
            .populate('learners', 'firstName lastName email phone')
            .populate('trainers', 'firstName lastName email phone')
            .populate('tas', 'firstName lastName email phone')
            .populate('createdBy', 'firstName lastName email');

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }

        // Check access permissions
        if (!hasBatchAccess(req.user, batch)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this batch'
            });
        }

        res.status(200).json({
            success: true,
            data: batch
        });
    } catch (error) {
        console.error('Get batch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get available trainers (considers date overlaps)
// @route   GET /api/batches/available-trainers
// @access  Private/Admin
const getAvailableTrainers = async (req, res) => {
    try {
        const { excludeBatchId, batchStartDate } = req.query;

        // Get all active trainers
        const allTrainers = await User.find({
            role: 'TRAINER',
            isActive: true
        }).select('firstName lastName email phone');

        // Find all ongoing/planning batches with trainers (excluding current batch if editing)
        const activeBatchQuery = {
            status: { $in: ['ONGOING', 'PLANNING'] }
        };
        if (excludeBatchId) {
            activeBatchQuery._id = { $ne: excludeBatchId };
        }

        const activeBatches = await Batch.find(activeBatchQuery)
            .select('trainers status startDate endDate name');

        // Map trainers to their availability status
        const trainersWithAvailability = allTrainers.map(trainer => {
            const trainerBatches = activeBatches.filter(batch =>
                Array.isArray(batch.trainers) && batch.trainers.some(t => t.toString() === trainer._id.toString())
            );

            // Find if trainer has any ongoing batch
            const ongoingBatch = trainerBatches.find(b => b.status === 'ONGOING');

            let isAvailable = true;
            let availableFrom = null;
            let currentBatchName = null;
            let currentBatchEndDate = null;

            if (ongoingBatch) {
                // Trainer is in an ongoing batch
                currentBatchName = ongoingBatch.name;
                currentBatchEndDate = ongoingBatch.endDate;

                // If a batch start date is provided, check if trainer becomes available before it
                if (batchStartDate) {
                    const newBatchStart = new Date(batchStartDate);
                    const currentBatchEnd = new Date(ongoingBatch.endDate);

                    // Trainer is available if new batch starts after current batch ends
                    isAvailable = newBatchStart > currentBatchEnd;
                    availableFrom = currentBatchEnd;
                } else {
                    // No start date provided, trainer is not immediately available
                    isAvailable = false;
                    availableFrom = ongoingBatch.endDate;
                }
            }

            return {
                ...trainer.toObject(),
                isAvailable,
                availableFrom,
                currentBatchName,
                currentBatchEndDate,
                hasOngoingBatch: !!ongoingBatch
            };
        });

        res.status(200).json({
            success: true,
            data: trainersWithAvailability
        });
    } catch (error) {
        console.error('Get available trainers error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get all TAs with their current batch assignments
// @route   GET /api/batches/available-tas
// @access  Private/Admin
const getAvailableTAs = async (req, res) => {
    try {
        // Get all active TAs
        const allTAs = await User.find({
            role: 'TA',
            isActive: true
        }).select('firstName lastName email phone');

        // Get ongoing batches to find TAs with multiple assignments
        const ongoingBatches = await Batch.find({
            status: { $in: ['PLANNING', 'ONGOING'] }
        }).select('name tas');

        // Map TAs to their batch assignments
        const tasWithAssignments = allTAs.map(ta => {
            const assignedBatches = ongoingBatches.filter(batch =>
                Array.isArray(batch.tas) && batch.tas.some(t => t.toString() === ta._id.toString())
            );
            return {
                ...ta.toObject(),
                assignedBatchCount: assignedBatches.length,
                assignedBatches: assignedBatches.map(b => ({ id: b._id, name: b.name }))
            };
        });

        res.status(200).json({
            success: true,
            data: tasWithAssignments
        });
    } catch (error) {
        console.error('Get available TAs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get available learners (considers date overlaps)
// @route   GET /api/batches/available-learners
// @access  Private/Admin
const getAvailableLearners = async (req, res) => {
    try {
        const { excludeBatchId, batchStartDate } = req.query;

        // Get all active learners
        const allLearners = await User.find({
            role: 'LEARNER',
            isActive: true
        }).select('firstName lastName email phone username');

        // Find all active batches (ONGOING/PLANNING)
        const activeBatchQuery = {
            status: { $in: ['ONGOING', 'PLANNING'] }
        };
        if (excludeBatchId) {
            activeBatchQuery._id = { $ne: excludeBatchId };
        }

        const activeBatches = await Batch.find(activeBatchQuery)
            .select('learners status startDate endDate name');

        // Map learners to availability
        const learnersWithAvailability = allLearners.map(learner => {
            const learnerBatches = activeBatches.filter(batch =>
                Array.isArray(batch.learners) && batch.learners.some(l => l.toString() === learner._id.toString())
            );

            const ongoingBatch = learnerBatches.find(b => b.status === 'ONGOING');

            let isAvailable = true;
            let availableFrom = null;
            let currentBatchName = null;
            let currentBatchEndDate = null;

            if (ongoingBatch) {
                currentBatchName = ongoingBatch.name;
                currentBatchEndDate = ongoingBatch.endDate;

                if (batchStartDate) {
                    const newBatchStart = new Date(batchStartDate);
                    const currentBatchEnd = new Date(ongoingBatch.endDate);

                    isAvailable = newBatchStart > currentBatchEnd;
                    availableFrom = currentBatchEnd;
                } else {
                    isAvailable = false;
                    availableFrom = ongoingBatch.endDate;
                }
            }

            return {
                ...learner.toObject(),
                isAvailable,
                availableFrom,
                currentBatchName,
                currentBatchEndDate,
                hasOngoingBatch: !!ongoingBatch
            };
        });

        res.status(200).json({
            success: true,
            data: learnersWithAvailability
        });
    } catch (error) {
        console.error('Get available learners error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get available classrooms
// @route   GET /api/batches/available-classrooms
// @access  Private/Admin
const getAvailableClassrooms = async (req, res) => {
    try {
        const { excludeBatchId, batchStartDate } = req.query;

        // Get all active classrooms
        const allClassrooms = await Classroom.find({ isActive: true });

        // Find active batches that have classrooms assigned
        const activeBatchQuery = {
            status: { $in: ['ONGOING', 'PLANNING'] },
            classroom: { $ne: null }
        };
        if (excludeBatchId) {
            activeBatchQuery._id = { $ne: excludeBatchId };
        }

        const activeBatches = await Batch.find(activeBatchQuery)
            .select('classroom status startDate endDate name');

        // Map classrooms to availability
        const classroomsWithAvailability = allClassrooms.map(classroom => {
            const classroomBatches = activeBatches.filter(batch =>
                batch.classroom.toString() === classroom._id.toString()
            );

            const ongoingBatch = classroomBatches.find(b => b.status === 'ONGOING');

            let isAvailable = true;
            let availableFrom = null;
            let currentBatchName = null;
            let currentBatchEndDate = null;

            if (ongoingBatch) {
                currentBatchName = ongoingBatch.name;
                currentBatchEndDate = ongoingBatch.endDate;

                if (batchStartDate) {
                    const newBatchStart = new Date(batchStartDate);
                    const currentBatchEnd = new Date(ongoingBatch.endDate);

                    isAvailable = newBatchStart > currentBatchEnd;
                    availableFrom = currentBatchEnd;
                } else {
                    isAvailable = false;
                    availableFrom = ongoingBatch.endDate;
                }
            }

            return {
                ...classroom.toObject(),
                isAvailable,
                availableFrom,
                currentBatchName,
                currentBatchEndDate,
                hasOngoingBatch: !!ongoingBatch
            };
        });

        res.status(200).json({
            success: true,
            data: classroomsWithAvailability
        });
    } catch (error) {
        console.error('Get available classrooms error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Create batch
// @route   POST /api/batches
// @access  Private/Admin/Manager
const createBatch = async (req, res) => {
    try {
        const { learners, trainers, tas, ...batchData } = req.body;

        // Set created by
        batchData.createdBy = req.user._id;

        // Validate trainers if provided
        if (trainers && trainers.length > 0) {
            const validationResult = await validateTrainers(
                trainers,
                null,
                batchData.status,
                batchData.startDate,
                batchData.endDate
            );
            if (!validationResult.valid) {
                return res.status(400).json({
                    success: false,
                    message: validationResult.message
                });
            }
            batchData.trainers = trainers;
        }

        // Validate TAs if provided
        if (tas && tas.length > 0) {
            const taUsers = await User.find({
                _id: { $in: tas },
                role: 'TA',
                isActive: true
            });

            if (taUsers.length !== tas.length) {
                return res.status(400).json({
                    success: false,
                    message: 'One or more TAs not found or not active'
                });
            }
            batchData.tas = tas;
        }

        // Validate learners if provided
        if (learners && learners.length > 0) {
            const validationResult = await validateLearners(
                learners,
                null,
                batchData.status,
                batchData.startDate,
                batchData.endDate
            );

            if (!validationResult.valid) {
                return res.status(400).json({
                    success: false,
                    message: validationResult.message
                });
            }
            batchData.learners = learners;
        }

        // Validate classroom if provided
        if (batchData.classroom) {
            const validationResult = await validateClassroom(
                batchData.classroom,
                null,
                batchData.status,
                batchData.startDate,
                batchData.endDate
            );

            if (!validationResult.valid) {
                return res.status(400).json({
                    success: false,
                    message: validationResult.message
                });
            }
        }

        const batch = await Batch.create(batchData);

        // Update learners' assignedBatches
        if (learners && learners.length > 0) {
            await User.updateMany(
                { _id: { $in: learners } },
                { $addToSet: { assignedBatches: batch._id } }
            );
        }

        const populatedBatch = await Batch.findById(batch._id)
            .populate('department', 'name code')
            .populate('classroom', 'name code location capacity')
            .populate('learners', 'firstName lastName email')
            .populate('trainers', 'firstName lastName email')
            .populate('tas', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName');

        res.status(201).json({
            success: true,
            data: populatedBatch
        });
    } catch (error) {
        console.error('Create batch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update batch
// @route   PUT /api/batches/:id
// @access  Private/Admin/Manager
const updateBatch = async (req, res) => {
    try {
        const { learners, trainers, tas, ...updateData } = req.body;
        const batchId = req.params.id;

        const batch = await Batch.findById(batchId);

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }

        // Check if user has permission to update this batch
        if (req.user.role === 'MANAGER' && batch.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this batch'
            });
        }

        // Validate trainers if provided
        if (trainers !== undefined) {
            if (trainers.length > 0) {
                const batchStatus = updateData.status || batch.status;
                const batchStartDate = updateData.startDate || batch.startDate;
                const batchEndDate = updateData.endDate || batch.endDate;
                const validationResult = await validateTrainers(
                    trainers,
                    batchId,
                    batchStatus,
                    batchStartDate,
                    batchEndDate
                );
                if (!validationResult.valid) {
                    return res.status(400).json({
                        success: false,
                        message: validationResult.message
                    });
                }
            }
            updateData.trainers = trainers;
        }

        // Validate TAs if provided
        if (tas !== undefined) {
            if (tas.length > 0) {
                const taUsers = await User.find({
                    _id: { $in: tas },
                    role: 'TA',
                    isActive: true
                });

                if (taUsers.length !== tas.length) {
                    return res.status(400).json({
                        success: false,
                        message: 'One or more TAs not found or not active'
                    });
                }
            }
            updateData.tas = tas;
        }

        // Update learners if provided
        if (learners !== undefined) {
            const oldLearners = batch.learners.map(l => l.toString());
            const newLearners = learners.map(l => l.toString());

            // Find added and removed learners
            const addedLearners = newLearners.filter(l => !oldLearners.includes(l));
            const removedLearners = oldLearners.filter(l => !newLearners.includes(l));

            // Validate new learners
            if (addedLearners.length > 0) {
                const batchStatus = updateData.status || batch.status;
                const batchStartDate = updateData.startDate || batch.startDate;
                const batchEndDate = updateData.endDate || batch.endDate;

                const validationResult = await validateLearners(
                    addedLearners,
                    batchId,
                    batchStatus,
                    batchStartDate,
                    batchEndDate
                );

                if (!validationResult.valid) {
                    return res.status(400).json({
                        success: false,
                        message: validationResult.message
                    });
                }
            }


            // Update learners arrays
            if (removedLearners.length > 0) {
                await User.updateMany(
                    { _id: { $in: removedLearners } },
                    { $pull: { assignedBatches: batchId } }
                );
            }

            if (addedLearners.length > 0) {
                await User.updateMany(
                    { _id: { $in: addedLearners } },
                    { $addToSet: { assignedBatches: batchId } }
                );
            }

            updateData.learners = learners;
        }

        // Validate classroom
        if (updateData.classroom !== undefined || (batch.classroom && (updateData.startDate || updateData.endDate))) {
            const classroomId = updateData.classroom !== undefined ? updateData.classroom : batch.classroom;

            if (classroomId) {
                const batchStatus = updateData.status || batch.status;
                const batchStartDate = updateData.startDate || batch.startDate;
                const batchEndDate = updateData.endDate || batch.endDate;

                const validationResult = await validateClassroom(
                    classroomId,
                    batchId,
                    batchStatus,
                    batchStartDate,
                    batchEndDate
                );

                if (!validationResult.valid) {
                    return res.status(400).json({
                        success: false,
                        message: validationResult.message
                    });
                }
            }
        }

        const updatedBatch = await Batch.findByIdAndUpdate(
            batchId,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('department', 'name code')
            .populate('classroom', 'name code location capacity')
            .populate('learners', 'firstName lastName email')
            .populate('trainers', 'firstName lastName email')
            .populate('tas', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName');

        res.status(200).json({
            success: true,
            data: updatedBatch
        });
    } catch (error) {
        console.error('Update batch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Helper function to validate trainers
// Trainers cannot be assigned to batches with overlapping dates
const validateTrainers = async (trainerIds, excludeBatchId, batchStatus, batchStartDate, batchEndDate) => {
    // Validate trainers exist and have TRAINER role
    const trainerUsers = await User.find({
        _id: { $in: trainerIds },
        role: 'TRAINER',
        isActive: true
    });

    if (trainerUsers.length !== trainerIds.length) {
        return {
            valid: false,
            message: 'One or more trainers not found or not active'
        };
    }

    // Find active batches (ONGOING or PLANNING) where these trainers are assigned
    const activeBatchQuery = {
        status: { $in: ['ONGOING', 'PLANNING'] },
        trainers: { $in: trainerIds }
    };
    if (excludeBatchId) {
        activeBatchQuery._id = { $ne: excludeBatchId };
    }

    const trainerBatches = await Batch.find(activeBatchQuery)
        .populate('trainers', 'firstName lastName');

    if (trainerBatches.length > 0) {
        const conflictingTrainers = [];
        const newBatchStart = new Date(batchStartDate);
        const newBatchEnd = new Date(batchEndDate);

        for (const batch of trainerBatches) {
            const existingBatchStart = new Date(batch.startDate);
            const existingBatchEnd = new Date(batch.endDate);

            // Check for date overlap:
            // Overlap occurs if: newStart <= existingEnd AND newEnd >= existingStart
            const hasOverlap = newBatchStart <= existingBatchEnd && newBatchEnd >= existingBatchStart;

            if (hasOverlap) {
                for (const trainer of batch.trainers) {
                    if (trainerIds.includes(trainer._id.toString())) {
                        // Check if this trainer is already in the conflict list
                        const existingConflict = conflictingTrainers.find(
                            c => c.trainerId === trainer._id.toString()
                        );
                        if (!existingConflict) {
                            conflictingTrainers.push({
                                trainerId: trainer._id.toString(),
                                name: `${trainer.firstName} ${trainer.lastName}`,
                                batchName: batch.name,
                                batchEndDate: existingBatchEnd.toLocaleDateString()
                            });
                        }
                    }
                }
            }
        }

        if (conflictingTrainers.length > 0) {
            const trainerNames = conflictingTrainers.map(t =>
                `${t.name} (in "${t.batchName}" until ${t.batchEndDate})`
            ).join(', ');

            return {
                valid: false,
                message: `Cannot allocate trainers with overlapping batch dates: ${trainerNames}. The new batch must start after their current batch ends.`
            };
        }
    }

    return { valid: true };
};

// Helper function to validate learners
// Learners cannot be assigned to batches with overlapping dates
const validateLearners = async (learnerIds, excludeBatchId, batchStatus, batchStartDate, batchEndDate) => {
    // Validate learners exist and have LEARNER role
    const learnerUsers = await User.find({
        _id: { $in: learnerIds },
        role: 'LEARNER',
        isActive: true
    });

    if (learnerUsers.length !== learnerIds.length) {
        return {
            valid: false,
            message: 'One or more learners not found or not active'
        };
    }

    // Find active batches (ONGOING or PLANNING) where these learners are assigned
    const activeBatchQuery = {
        status: { $in: ['ONGOING', 'PLANNING'] },
        learners: { $in: learnerIds }
    };
    if (excludeBatchId) {
        activeBatchQuery._id = { $ne: excludeBatchId };
    }

    const learnerBatches = await Batch.find(activeBatchQuery)
        .populate('learners', 'firstName lastName');

    if (learnerBatches.length > 0) {
        const conflictingLearners = [];
        const newBatchStart = new Date(batchStartDate);
        const newBatchEnd = new Date(batchEndDate);

        for (const batch of learnerBatches) {
            const existingBatchStart = new Date(batch.startDate);
            const existingBatchEnd = new Date(batch.endDate);

            // Check for date overlap
            const hasOverlap = newBatchStart <= existingBatchEnd && newBatchEnd >= existingBatchStart;

            if (hasOverlap) {
                for (const learner of batch.learners) {
                    if (learnerIds.includes(learner._id.toString())) {
                        const existingConflict = conflictingLearners.find(
                            c => c.learnerId === learner._id.toString()
                        );
                        if (!existingConflict) {
                            conflictingLearners.push({
                                learnerId: learner._id.toString(),
                                name: `${learner.firstName} ${learner.lastName}`,
                                batchName: batch.name,
                                batchEndDate: existingBatchEnd.toLocaleDateString()
                            });
                        }
                    }
                }
            }
        }

        if (conflictingLearners.length > 0) {
            const learnerNames = conflictingLearners.map(l =>
                `${l.name} (in "${l.batchName}" until ${l.batchEndDate})`
            ).join(', ');

            return {
                valid: false,
                message: `Cannot enroll learners with overlapping batch dates: ${learnerNames}. Previous batch must be completed first.`
            };
        }
    }

    return { valid: true };
};

// Helper function to validate classroom
const validateClassroom = async (classroomId, excludeBatchId, batchStatus, batchStartDate, batchEndDate) => {
    // Validate classroom exists and is active
    const classroom = await Classroom.findById(classroomId);
    if (!classroom || !classroom.isActive) {
        return {
            valid: false,
            message: 'Classroom not found or inactive'
        };
    }

    // Find active batches that use this classroom
    const activeBatchQuery = {
        status: { $in: ['ONGOING', 'PLANNING'] },
        classroom: classroomId
    };
    if (excludeBatchId) {
        activeBatchQuery._id = { $ne: excludeBatchId };
    }

    const assignedBatches = await Batch.find(activeBatchQuery);

    if (assignedBatches.length > 0) {
        const newBatchStart = new Date(batchStartDate);
        const newBatchEnd = new Date(batchEndDate);

        for (const batch of assignedBatches) {
            const existingBatchStart = new Date(batch.startDate);
            const existingBatchEnd = new Date(batch.endDate);

            // Check for date overlap
            const hasOverlap = newBatchStart <= existingBatchEnd && newBatchEnd >= existingBatchStart;

            if (hasOverlap) {
                return {
                    valid: false,
                    message: `Classroom "${classroom.name}" is already assigned to batch "${batch.name}" (Ends: ${existingBatchEnd.toLocaleDateString()}). Please choose another classroom or change dates.`
                };
            }
        }
    }

    return { valid: true };
};

// @desc    Get batch statistics
// @route   GET /api/batches/:id/stats
// @access  Private
const getBatchStats = async (req, res) => {
    try {
        const batch = await Batch.findById(req.params.id);

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }

        // Check access permissions
        if (!hasBatchAccess(req.user, batch)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this batch'
            });
        }

        // Get attendance statistics
        const attendanceStats = await Attendance.aggregate([
            { $match: { batch: batch._id } },
            { $unwind: '$attendanceRecords' },
            {
                $group: {
                    _id: '$attendanceRecords.status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get learner attendance summary
        const learnerAttendance = await Attendance.aggregate([
            { $match: { batch: batch._id } },
            { $unwind: '$attendanceRecords' },
            {
                $group: {
                    _id: '$attendanceRecords.learner',
                    totalDays: { $sum: 1 },
                    presentDays: {
                        $sum: {
                            $cond: [
                                { $in: ['$attendanceRecords.status', ['PRESENT', 'LATE', 'HALF_DAY']] },
                                1, 0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    learner: '$_id',
                    totalDays: 1,
                    presentDays: 1,
                    attendancePercentage: {
                        $multiply: [
                            { $divide: ['$presentDays', '$totalDays'] },
                            100
                        ]
                    }
                }
            }
        ]);

        // Populate learner details
        const learnerIds = learnerAttendance.map(la => la.learner);
        const learners = await User.find({ _id: { $in: learnerIds } })
            .select('firstName lastName email');

        const attendanceWithDetails = learnerAttendance.map(la => {
            const learner = learners.find(l => l._id.toString() === la.learner.toString());
            return {
                ...la,
                learner: learner ? {
                    id: learner._id,
                    firstName: learner.firstName,
                    lastName: learner.lastName,
                    email: learner.email
                } : null
            };
        });

        res.status(200).json({
            success: true,
            data: {
                batch: {
                    id: batch._id,
                    name: batch.name,
                    code: batch.code,
                    status: batch.status,
                    progress: batch.progress,
                    durationDays: batch.durationDays,
                    startDate: batch.startDate,
                    endDate: batch.endDate
                },
                attendanceStats,
                learnerAttendance: attendanceWithDetails,
                summary: {
                    totalLearners: batch.learners.length,
                    daysCompleted: Math.floor((Date.now() - batch.startDate) / (1000 * 60 * 60 * 24)),
                    totalDuration: batch.durationDays
                }
            }
        });
    } catch (error) {
        console.error('Get batch stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get batch attendance
// @route   GET /api/batches/:id/attendance
// @access  Private/Admin/Manager/TeamLeader
const getBatchAttendance = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const batch = await Batch.findById(req.params.id);

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }

        // Check access permissions
        if (!hasBatchAccess(req.user, batch) && req.user.role !== 'TEAM_LEADER') {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this batch attendance'
            });
        }

        const query = { batch: batch._id };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const attendance = await Attendance.find(query)
            .populate('classroom', 'name code location')
            .populate('attendanceRecords.learner', 'firstName lastName email')
            .populate('attendanceRecords.markedBy', 'firstName lastName')
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            data: attendance
        });
    } catch (error) {
        console.error('Get batch attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Helper function to check batch access
const hasBatchAccess = (user, batch) => {
    if (user.role === 'ADMIN') return true;
    if (user.role === 'MANAGER' && batch.createdBy.toString() === user._id.toString()) return true;
    if (user.role === 'LEARNER' && batch.learners.includes(user._id)) return true;
    return true; // TEAM_LEADER, TRAINER, TA can view
};

// @desc    Delete batch (soft delete)
// @route   DELETE /api/batches/:id
// @access  Private/Admin
const deleteBatch = async (req, res) => {
    try {
        const batch = await Batch.findById(req.params.id);

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }

        // Soft delete by setting status to CANCELLED
        batch.status = 'CANCELLED';
        await batch.save();

        res.status(200).json({
            success: true,
            message: 'Batch cancelled successfully',
            data: batch
        });
    } catch (error) {
        console.error('Delete batch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
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
};
