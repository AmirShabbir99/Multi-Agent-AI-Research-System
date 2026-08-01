'use strict';

const { z } = require('zod');
const { ALL_ROLES } = require('../utils/constants');

const updateProfile = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

const setRole = z.object({
  role: z.enum(ALL_ROLES),
});

const setActiveStatus = z.object({
  isActive: z.boolean(),
});

const listUsersQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(ALL_ROLES).optional(),
  search: z.string().trim().max(100).optional(),
});

const mongoIdParam = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id'),
});

module.exports = { updateProfile, setRole, setActiveStatus, listUsersQuery, mongoIdParam };
