'use strict';

const mongoose = require('mongoose');
const config = require('./env');
const logger = require('./logger');

mongoose.set('strictQuery', true);

async function connectDB() {
  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('error', (err) => logger.error('MongoDB connection error', { error: err.message }));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  await mongoose.connect(config.mongoUri, {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 10000,
  });

  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
