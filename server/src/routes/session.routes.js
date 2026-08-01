'use strict';

const express = require('express');
const sessionController = require('../controllers/session.controller');
const chatController = require('../controllers/chat.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const sessionValidator = require('../validators/session.validator');
const chatValidator = require('../validators/chat.validator');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Start a new conversation
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Session created }
 *   get:
 *     summary: List my conversations
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Paginated session list }
 */
router.post('/', validate({ body: sessionValidator.createSession }), sessionController.create);
router.get('/', validate({ query: sessionValidator.listSessionsQuery }), sessionController.list);

/**
 * @swagger
 * /api/sessions/{id}:
 *   get:
 *     summary: Get a single conversation
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Session }
 *       404: { description: Not found }
 *   delete:
 *     summary: Delete a conversation and all its messages
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Deleted }
 */
router.get('/:id', validate({ params: sessionValidator.sessionIdParam }), sessionController.getOne);
router.delete('/:id', validate({ params: sessionValidator.sessionIdParam }), sessionController.remove);

/**
 * @swagger
 * /api/sessions/{id}/title:
 *   patch:
 *     summary: Rename a conversation
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Renamed }
 */
router.patch(
  '/:id/title',
  validate({ params: sessionValidator.sessionIdParam, body: sessionValidator.renameSession }),
  sessionController.rename
);

/**
 * @swagger
 * /api/sessions/{id}/archive:
 *   patch:
 *     summary: Archive a conversation
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Archived }
 */
router.patch('/:id/archive', validate({ params: sessionValidator.sessionIdParam }), sessionController.archive);

/**
 * @swagger
 * /api/sessions/{id}/messages:
 *   get:
 *     summary: Get the message history for a conversation
 *     tags: [Sessions, Chat]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Paginated messages }
 *   post:
 *     summary: Send a chat message in this conversation (proxies to the AI service)
 *     tags: [Sessions, Chat]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Assistant reply }
 */
router.get(
  '/:id/messages',
  validate({ params: sessionValidator.sessionIdParam, query: sessionValidator.paginationQuery }),
  sessionController.getMessages
);
router.post(
  '/:id/messages',
  validate({ params: sessionValidator.sessionIdParam, body: chatValidator.sendMessage }),
  chatController.sendMessage
);

module.exports = router;
