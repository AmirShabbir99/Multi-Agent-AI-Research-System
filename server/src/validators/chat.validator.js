'use strict';

const { z } = require('zod');

const sendMessage = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(4000),
  mode: z.enum(['quick', 'research']).optional().default('quick'),
  documentIds: z.array(z.string()).optional(),
  allowWebSearch: z.boolean().optional().default(true),
});

module.exports = { sendMessage };
