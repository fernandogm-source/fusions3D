const { z } = require('zod');

const MAX_REVIEWS = 60;

const printSentimentRequestSchema = z.object({
  printName: z.string().trim().min(1).max(120),
  reviews: z.array(z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().min(1).max(1000)
  })).min(1).max(MAX_REVIEWS)
});

const printSentimentResponseSchema = z.object({
  positive: z.number().int().min(0).max(100),
  neutral: z.number().int().min(0).max(100),
  negative: z.number().int().min(0).max(100),
  summary: z.string().trim().min(1).max(300)
});

module.exports = { MAX_REVIEWS, printSentimentRequestSchema, printSentimentResponseSchema };
