'use strict';

const express = require('express');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const sessionRoutes = require('./session.routes');
const documentRoutes = require('./document.routes');
const aiRoutes = require('./ai.routes');
const historyRoutes = require('./history.routes');
const adminRoutes = require('./admin.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/sessions', sessionRoutes);
router.use('/documents', documentRoutes);
router.use('/ai', aiRoutes);
router.use('/history', historyRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
