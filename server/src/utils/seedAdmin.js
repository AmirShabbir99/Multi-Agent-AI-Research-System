'use strict';

const config = require('../config/env');
const logger = require('../config/logger');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User.model');
const { ROLES } = require('./constants');

async function seedAdmin() {
  if (!config.admin.seedEmail || !config.admin.seedPassword) {
    logger.error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env to run this script.');
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ email: config.admin.seedEmail.toLowerCase() });
  if (existing) {
    if (existing.role !== ROLES.ADMIN) {
      existing.role = ROLES.ADMIN;
      await existing.save();
      logger.info(`Promoted existing user ${existing.email} to admin.`);
    } else {
      logger.info(`Admin user ${existing.email} already exists. Nothing to do.`);
    }
  } else {
    const admin = await User.create({
      name: 'Admin',
      email: config.admin.seedEmail,
      password: config.admin.seedPassword,
      role: ROLES.ADMIN,
    });
    logger.info(`Created admin user: ${admin.email}`);
  }

  await disconnectDB();
  process.exit(0);
}

seedAdmin().catch((error) => {
  logger.error('Failed to seed admin user', { error: error.message });
  process.exit(1);
});
