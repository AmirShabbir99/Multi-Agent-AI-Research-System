'use strict';

const express = require('express');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');
const authValidator = require('../validators/auth.validator');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Create a new account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201: { description: "Account created - response includes a single JWT" }
 *       409: { description: Email already in use }
 */
router.post('/register', authLimiter, validate({ body: authValidator.register }), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: "Logged in - response includes a single JWT" }
 *       401: { description: Invalid credentials }
 */
router.post('/login', authLimiter, validate({ body: authValidator.login }), authController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out (stateless - the client discards its token; this exists for API/audit symmetry)
 *     tags: [Auth]
 *     responses:
 *       200: { description: Logged out }
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current user }
 */
router.get('/me', authenticate, authController.me);

module.exports = router;
