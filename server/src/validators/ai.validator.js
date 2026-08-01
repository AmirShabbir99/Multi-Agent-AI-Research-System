'use strict';

const { z } = require('zod');

const ask = z.object({
  query: z.string().trim().min(3, 'Query must be at least 3 characters').max(2000),
  sessionId: z.string().optional(),
  documentIds: z.array(z.string()).optional(),
  mode: z.enum(['quick', 'research']).optional().default('quick'),
  topK: z.coerce.number().int().min(1).max(20).optional().default(5),
  allowWebSearch: z.boolean().optional().default(true),
});

const search = z.object({
  query: z.string().trim().min(2, 'Query must be at least 2 characters').max(500),
  mode: z.enum(['documents', 'web', 'hybrid']).optional().default('documents'),
  documentIds: z.array(z.string()).optional(),
  topK: z.coerce.number().int().min(1).max(20).optional().default(5),
});

const summarize = z
  .object({
    documentId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid document id').optional(),
    text: z.string().trim().min(40, 'Text must be at least 40 characters long').optional(),
    length: z.enum(['short', 'medium', 'detailed']).optional().default('medium'),
  })
  .refine((data) => Boolean(data.documentId) !== Boolean(data.text), {
    message: "Provide exactly one of 'documentId' or 'text'.",
  });

module.exports = { ask, search, summarize };
