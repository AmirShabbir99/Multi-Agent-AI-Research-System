'use strict';

const { z } = require('zod');

const createSession = z.object({
  title: z.string().trim().max(150).optional(),
  documentIds: z.array(z.string()).optional(),
});

const renameSession = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(150),
});

const listSessionsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['active', 'archived']).optional(),
});

const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const sessionIdParam = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid session id'),
});

module.exports = { createSession, renameSession, listSessionsQuery, paginationQuery, sessionIdParam };
