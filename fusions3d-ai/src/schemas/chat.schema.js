const { z } = require('zod');

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(1000)
});

const productSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().max(80),
  slug: z.string().trim().min(1).max(120),
  minPrice: z.number().min(0),
  maxPrice: z.number().min(0)
});

const chatRequestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(20).refine(
    (messages) => messages.at(-1)?.role === 'user',
    { message: 'El último mensaje debe ser del usuario' }
  ),
  products: z.array(productSchema).max(5).default([])
});

const chatResponseSchema = z.object({
  reply: z.string().min(1).max(1500)
});

module.exports = { chatRequestSchema, chatResponseSchema };
