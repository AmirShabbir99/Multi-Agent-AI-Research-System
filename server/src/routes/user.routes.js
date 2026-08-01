'use strict';

const express = require('express');
const userController = require('../controllers/user.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const userValidator = require('../validators/user.validator');
const { changePassword: changePasswordSchema } = require('../validators/auth.validator');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get my profile
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Profile }
 *   patch:
 *     summary: Update my profile
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Updated profile }
 */
router.get('/me', userController.getProfile);
router.patch('/me', validate({ body: userValidator.updateProfile }), userController.updateProfile);

/**
 * @swagger
 * /api/users/me/password:
 *   post:
 *     summary: Change my password
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Password changed }
 */
router.post('/me/password', validate({ body: changePasswordSchema }), userController.changePassword);

// ── Admin-only user management ──────────────────────────────
router.use('/', authorize(ROLES.ADMIN));

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users (admin only)
 *     tags: [Users, Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Paginated user list }
 */
router.get('/', validate({ query: userValidator.listUsersQuery }), userController.listUsers);

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Change a user's role (admin only)
 *     tags: [Users, Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Role updated }
 */
router.patch(
  '/:id/role',
  validate({ params: userValidator.mongoIdParam, body: userValidator.setRole }),
  userController.setRole
);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: Activate/deactivate a user account (admin only)
 *     tags: [Users, Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Status updated }
 */
router.patch(
  '/:id/status',
  validate({ params: userValidator.mongoIdParam, body: userValidator.setActiveStatus }),
  userController.setActiveStatus
);

module.exports = router;
