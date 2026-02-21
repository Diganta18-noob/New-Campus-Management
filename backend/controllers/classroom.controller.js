const Classroom = require('../models/Classroom.model');

// @desc    Get all classrooms
// @route   GET /api/classrooms
// @access  Private/Admin/Manager/Trainer/TA
const getClassrooms = async (req, res) => {
  try {
    const { isActive, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const classrooms = await Classroom.find(query)
      .populate('createdBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Classroom.countDocuments(query);

    res.status(200).json({
      success: true,
      count: classrooms.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: classrooms
    });
  } catch (error) {
    console.error('Get classrooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single classroom
// @route   GET /api/classrooms/:id
// @access  Private/Admin/Manager/Trainer/TA
const getClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    res.status(200).json({
      success: true,
      data: classroom
    });
  } catch (error) {
    console.error('Get classroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create classroom
// @route   POST /api/classrooms
// @access  Private/Admin/Manager
const createClassroom = async (req, res) => {
  try {
    const { name, code, location, capacity, facilities } = req.body;

    // Check if classroom with same code already exists
    const existingClassroom = await Classroom.findOne({ code });
    
    if (existingClassroom) {
      return res.status(400).json({
        success: false,
        message: 'Classroom with this code already exists'
      });
    }

    const classroom = await Classroom.create({
      name,
      code,
      location,
      capacity,
      facilities: facilities || [],
      createdBy: req.user._id
    });

    const populatedClassroom = await Classroom.findById(classroom._id)
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: populatedClassroom
    });
  } catch (error) {
    console.error('Create classroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update classroom
// @route   PUT /api/classrooms/:id
// @access  Private/Admin/Manager
const updateClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // Store old values for audit log
    req.oldValues = classroom.toObject();
    req.changes = [];

    const updatedClassroom = await Classroom.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: updatedClassroom
    });
  } catch (error) {
    console.error('Update classroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Check classroom availability
// @route   GET /api/classrooms/:id/availability
// @access  Private/Admin/Manager/Trainer/TA
const checkAvailability = async (req, res) => {
  try {
    const { date, startTime, endTime } = req.query;
    
    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide date, startTime, and endTime'
      });
    }

    const classroom = await Classroom.findById(req.params.id);
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // Check if classroom is active
    if (!classroom.isActive) {
      return res.status(200).json({
        success: true,
        data: {
          available: false,
          reason: 'Classroom is inactive'
        }
      });
    }

    // Check for existing bookings (this would require a Booking model)
    // For now, we'll assume it's available
    // TODO: Implement proper booking system

    res.status(200).json({
      success: true,
      data: {
        available: true,
        classroom: {
          id: classroom._id,
          name: classroom.name,
          code: classroom.code,
          capacity: classroom.capacity,
          facilities: classroom.facilities
        }
      }
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getClassrooms,
  getClassroom,
  createClassroom,
  updateClassroom,
  checkAvailability
};