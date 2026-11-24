const { z } = require('zod');

const MAX_REVIEWS = 60;

const printReviewSummaryRequestSchema = z.object({
  printName: z.string().trim().min(1).max(120),
  reviews: z.array(z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().min(1).max(1000)
  })).min(1).max(MAX_REVIEWS)
});

const printReviewSummaryResponseSchema = z.object({
  summary: z.string().trim().min(1).max(300)
});

module.exports = { MAX_REVIEWS, printReviewSummaryRequestSchema, printReviewSummaryResponseSchema };
