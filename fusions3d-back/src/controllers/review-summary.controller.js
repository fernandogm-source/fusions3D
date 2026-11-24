const service = require('../services/review-summary.service');

class ReviewSummaryController {
  async printSummary(req, res, next) {
    try {
      const data = await service.printSummary(req.params.slug);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReviewSummaryController();
