'use strict';

const express = require('express');
const documentController = require('../controllers/document.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const upload = require('../middlewares/upload.middleware');
const documentValidator = require('../validators/document.validator');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/documents:
 *   post:
 *     summary: Upload and index a document (PDF/DOCX/TXT/MD)
 *     tags: [Documents]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201: { description: Document indexed }
 *       400: { description: Invalid file }
 *   get:
 *     summary: List my documents
 *     tags: [Documents]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Paginated document list }
 */
router.post('/', upload.single('file'), documentController.upload);
router.get('/', validate({ query: documentValidator.listDocumentsQuery }), documentController.list);

/**
 * @swagger
 * /api/documents/admin/all:
 *   get:
 *     summary: List every document across all users (admin only)
 *     tags: [Documents, Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Paginated document list }
 */
router.get('/admin/all', authorize(ROLES.ADMIN), documentController.listAllForAdmin);

/**
 * @swagger
 * /api/documents/rebuild-vector-db:
 *   post:
 *     summary: Rebuild the entire vector index from stored document text (admin only)
 *     tags: [Documents, Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Rebuild summary }
 */
router.post('/rebuild-vector-db', authorize(ROLES.ADMIN), documentController.rebuildVectorDb);

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete a document (owner or admin)
 *     tags: [Documents]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Deleted }
 *       403: { description: Not permitted }
 *       404: { description: Not found }
 */
router.delete('/:id', validate({ params: documentValidator.documentIdParam }), documentController.remove);

module.exports = router;
