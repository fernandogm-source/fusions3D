const repository = require('../repositories/variant-review.repository');
const aiService = require('./ai.service');
const variantReviewService = require('./variant-review.service');

const SUMMARY_SAMPLE_SIZE = 60;

class ReviewSummaryService {
  async printSummary(printSlug) {
    const print = await variantReviewService.resolvePublishedPrint(printSlug);
    const variantIds = await repository.findVariantIdsByPrintId(print._id);
    const { count, lastUpdate } = await repository.findSentimentSignature(variantIds);

    if (count === 0) {
      return { summary: null, reviewCount: 0, sampleSize: 0, updatedAt: null };
    }

    const signature = `${count}:${lastUpdate.getTime()}`;
    const cached = await repository.findPrintReviewSummary(print._id);

    if (cached?.signature === signature) {
      return this.view(cached, count);
    }

    const reviews = await repository.findRecentForSentiment(variantIds, SUMMARY_SAMPLE_SIZE);
    const { summary } = await aiService.summarizeReviews({
      printName: print.name,
      reviews: reviews.map(({ rating, comment }) => ({ rating, comment }))
    });

    const saved = await repository.upsertPrintReviewSummary(print._id, {
      signature,
      summary,
      sampleSize: reviews.length
    });

    return this.view(saved, count);
  }

  view(saved, reviewCount) {
    return {
      summary: saved.summary,
      reviewCount,
      sampleSize: saved.sampleSize,
      updatedAt: saved.updatedAt
    };
  }
}

module.exports = new ReviewSummaryService();
