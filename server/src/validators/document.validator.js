'use strict';

const { z } = require('zod');

const listDocumentsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'processing', 'indexed', 'failed', 'deleted']).optional(),
});

const documentIdParam = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid document id'),
});

module.exports = { listDocumentsQuery, documentIdParam };
