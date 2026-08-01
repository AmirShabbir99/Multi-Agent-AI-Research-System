'use strict';

const express = require('express');
const aiController = require('../controllers/ai.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const aiValidator = require('../validators/ai.validator');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/ai/ask:
 *   post:
 *     summary: Ask a question (mode=quick for a RAG/tool-calling answer, mode=research for a full multi-agent report)
 *     tags: [AI]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Answer or research report }
 */
router.post('/ask', validate({ body: aiValidator.ask }), aiController.ask);

/**
 * @swagger
 * /api/ai/search:
 *   post:
 *     summary: Semantic search over documents and/or the live web (no generation)
 *     tags: [AI]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Search results }
 */
router.post('/search', validate({ body: aiValidator.search }), aiController.search);

/**
 * @swagger
 * /api/ai/summarize:
 *   post:
 *     summary: Summarize a stored document or raw pasted text
 *     tags: [AI]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Summary }
 */
router.post('/summarize', validate({ body: aiValidator.summarize }), aiController.summarize);

module.exports = router;
