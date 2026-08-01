'use strict';

const express = require('express');
const historyController = require('../controllers/history.controller');
const authenticate = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/history:
 *   get:
 *     summary: Get my activity history (uploads, questions, searches, summaries, deletions...)
 *     tags: [History]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Paginated activity feed }
 */
router.get('/', authenticate, historyController.list);

module.exports = router;
