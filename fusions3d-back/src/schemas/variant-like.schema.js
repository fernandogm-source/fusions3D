const { z } = require('zod');

const likesListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12)
});

module.exports = { likesListQuerySchema };
