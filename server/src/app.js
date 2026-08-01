'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const swaggerUi = require('swagger-ui-express');

const config = require('./config/env');
const logger = require('./config/logger');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const { apiLimiter } = require('./middlewares/rateLimiter.middleware');
const notFoundMiddleware = require('./middlewares/notFound.middleware');
const errorMiddleware = require('./middlewares/error.middleware');
const ApiResponse = require('./utils/ApiResponse');

const app = express();

if (config.trustProxy) app.set('trust proxy', 1);

// ── Security headers ─────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: config.clientUrl }));
app.use(hpp()); // guards against HTTP parameter pollution
app.use(mongoSanitize()); // strips $/. operators from user input to prevent NoSQL injection

// ── Parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(compression());

// ── Logging ──────────────────────────────────────────────────
app.use(morgan(config.isProduction ? 'combined' : 'dev', { stream: logger.stream }));

// ── Rate limiting (applies to all /api routes) ──────────────
app.use('/api', apiLimiter);

// ── API docs ─────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'ResearchMind API Docs' }));

// ── Health check (no auth - for load balancers / uptime monitors) ──
app.get('/health', (req, res) => {
  return new ApiResponse(200, 'Server is running.', {
    uptimeSeconds: process.uptime(),
    env: config.env,
  }).send(res);
});

// ── Routes ───────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 + centralized error handling (must be last) ─────────
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
