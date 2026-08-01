'use strict';

const express = require('express');
const adminController = require('../controllers/admin.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/rbac.middleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(authenticate, authorize(ROLES.ADMIN));

/**
 * @swagger
 * /api/admin/overview:
 *   get:
 *     summary: Dashboard overview - user/document/session totals, AI usage stats, AI service health
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Overview stats }
 */
router.get('/overview', adminController.getOverview);

/**
 * @swagger
 * /api/admin/ai-requests:
 *   get:
 *     summary: List logged AI service requests (monitoring/analytics)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Paginated AI request log }
 */
router.get('/ai-requests', adminController.listAiRequests);

/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: List persisted server error logs
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Paginated error logs }
 */
router.get('/logs', adminController.listErrorLogs);

module.exports = router;
