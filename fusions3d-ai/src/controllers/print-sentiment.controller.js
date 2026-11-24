const { printSentimentRequestSchema } = require('../schemas/print-sentiment.schema');
const { analyzePrintSentiment } = require('../services/print-sentiment.service');

async function sentimentForPrint(req, res, next) {
  try {
    const input = printSentimentRequestSchema.parse(req.body);
    const data = await analyzePrintSentiment(input);

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { sentimentForPrint };
