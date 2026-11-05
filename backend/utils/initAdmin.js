const mongoose = require('mongoose');
const dotenv = require('dotenv');
const logger = require('./logger');

dotenv.config();

const User = require('../models/User.model');

const createAdminUser = async () => {
    try {
        if (!process.env.MONGODB_URI || !process.env.INITIAL_ADMIN_EMAIL || !process.env.INITIAL_ADMIN_PASSWORD || process.env.INITIAL_ADMIN_PASSWORD.length < 16) {
            throw new Error('Set MONGODB_URI, INITIAL_ADMIN_EMAIL and a unique INITIAL_ADMIN_PASSWORD of at least 16 characters');
        }
        await mongoose.connect(process.env.MONGODB_URI);

        // Check if admin already exists
        const adminExists = await User.findOne({ role: 'ADMIN' });

        if (adminExists) {
            logger.info('Admin user already exists');
            return process.exit(0);
        }

        // Create admin user
        const adminData = {
            email: process.env.INITIAL_ADMIN_EMAIL,
            username: 'systemadmin',
            password: process.env.INITIAL_ADMIN_PASSWORD,
            firstName: 'System',
            lastName: 'Administrator',
            role: 'ADMIN',
            isActive: true,
            requiresPasswordReset: true
        };

        const admin = new User(adminData);
        await admin.save();

        logger.info(`Admin user created successfully`);
        logger.info('Initial administrator created. Share the password securely and rotate the setup environment variable.');

        process.exit(0);
    } catch (error) {
        logger.error('Error creating admin user:', error);
        process.exit(1);
    }
};

// Run the script
createAdminUser();
