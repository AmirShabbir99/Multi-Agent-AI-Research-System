'use strict';

const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');
const config = require('./env');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${ts}] ${level}: ${stack || message}${metaStr}`;
  })
);

const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(config.logging.dir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  level: config.logging.level,
  format: combine(timestamp(), errors({ stack: true }), json()),
});

const errorFileTransport = new winston.transports.DailyRotateFile({
  filename: path.join(config.logging.dir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  format: combine(timestamp(), errors({ stack: true }), json()),
});

const logger = winston.createLogger({
  level: config.logging.level,
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    fileRotateTransport,
    errorFileTransport,
  ],
  exitOnError: false,
});

// Morgan (HTTP access logs) streams into the same logger at 'http' level.
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
