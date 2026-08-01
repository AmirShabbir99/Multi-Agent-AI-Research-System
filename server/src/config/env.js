'use strict';

require('dotenv').config();

/**
 * All environment access for the whole app funnels through this file so:
 *   1. Missing required vars fail fast at boot, not deep inside a request.
 *   2. Every other file imports typed/parsed values instead of raw `process.env` strings.
 */
const required = [
  'MONGODB_URI',
  'JWT_SECRET',
  'AI_SERVICE_URL',
  'INTERNAL_AI_SERVICE_API_KEY',
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  // eslint-disable-next-line no-console
  console.error(`[config] Missing required environment variables: ${missing.join(', ')}`);
  console.error('[config] Copy server/.env.example to server/.env and fill in real values.');
  process.exit(1);
}

const toBool = (val, fallback) => (val === undefined ? fallback : val === 'true');
const toInt = (val, fallback) => (val === undefined ? fallback : parseInt(val, 10));

module.exports = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  port: toInt(process.env.PORT, 5000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  mongoUri: process.env.MONGODB_URI,

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  aiService: {
    baseUrl: process.env.AI_SERVICE_URL,
    apiKey: process.env.INTERNAL_AI_SERVICE_API_KEY,
    timeoutMs: toInt(process.env.AI_SERVICE_TIMEOUT_MS, 60000),
  },

  rateLimit: {
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: toInt(process.env.RATE_LIMIT_MAX, 300),
    authWindowMs: toInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    authMax: toInt(process.env.AUTH_RATE_LIMIT_MAX, 20),
  },

  upload: {
    maxSizeBytes: toInt(process.env.MAX_UPLOAD_SIZE_MB, 20) * 1024 * 1024,
    allowedExtensions: (process.env.ALLOWED_UPLOAD_EXTENSIONS || '.pdf,.docx,.txt,.md')
      .split(',')
      .map((e) => e.trim().toLowerCase()),
  },

  bcryptSaltRounds: toInt(process.env.BCRYPT_SALT_ROUNDS, 12),

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || 'logs',
  },

  trustProxy: toBool(process.env.TRUST_PROXY, false),

  admin: {
    seedEmail: process.env.SEED_ADMIN_EMAIL,
    seedPassword: process.env.SEED_ADMIN_PASSWORD,
  },
};
