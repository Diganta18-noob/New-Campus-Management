const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const logger = require('./logger');

dotenv.config();

const User = require('../models/User.model');

const createAdminUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Check if admin already exists
        const adminExists = await User.findOne({ email: 'admin@system.com' });

        if (adminExists) {
            logger.info('Admin user already exists');
            return process.exit(0);
        }

        // Create admin user
        const adminData = {
            email: 'admin@system.com',
            username: 'systemadmin',
            password: 'Admin@123', // Default password - should be changed on first login
            firstName: 'System',
            lastName: 'Administrator',
            phone: '+1234567890',
            role: 'ADMIN',
            isActive: true
        };

        // Hash password
        const salt = await bcrypt.genSalt(10);
        adminData.password = await bcrypt.hash(adminData.password, salt);

        const admin = new User(adminData);
        await admin.save();

        logger.info(`Admin user created successfully`);
        logger.info('Admin credentials:');
        logger.info(`Email: ${admin.email}`);
        logger.info(`Username: ${admin.username}`);
        logger.info(`Password: Admin@123 (Change this immediately!)`);

        // Create default manager user as well
        const managerData = {
            email: 'manager@system.com',
            username: 'manager',
            password: 'Manager@123',
            firstName: 'System',
            lastName: 'Manager',
            phone: '+1234567891',
            role: 'MANAGER',
            isActive: true
        };

        managerData.password = await bcrypt.hash(managerData.password, salt);
        const manager = new User(managerData);
        await manager.save();

        logger.info('Manager user created successfully');

        process.exit(0);
    } catch (error) {
        logger.error('Error creating admin user:', error);
        process.exit(1);
    }
};

// Run the script
createAdminUser();