const { printReviewSummaryRequestSchema } = require('../schemas/print-review-summary.schema');
const { summarizePrintReviews } = require('../services/print-review-summary.service');

async function summarizeReviews(req, res, next) {
  try {
    const input = printReviewSummaryRequestSchema.parse(req.body);
    const data = await summarizePrintReviews(input);

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { summarizeReviews };
