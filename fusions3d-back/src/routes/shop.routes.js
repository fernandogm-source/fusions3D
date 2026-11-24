const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/shop.controller');
const likeController = require('../controllers/variant-like.controller');
const reviewController = require('../controllers/variant-review.controller');
const reviewSummaryController = require('../controllers/review-summary.controller');
const { _auth } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { printsQuerySchema, chatSchema } = require('../schemas/shop.schema');
const { slugParamSchema, variantSlugParamSchema, idParamSchema } = require('../schemas/common.schema');
const { createReviewSchema, updateReviewSchema, reviewsQuerySchema } = require('../schemas/variant-review.schema');

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({
    success: false,
    error: {
      code: 'CHAT_RATE_LIMITED',
      message: 'Has enviado demasiados mensajes. Inténtalo más tarde.'
    }
  })
});

router.get('/home', controller.getHome);
router.get('/filters', controller.getFilters);
router.get('/prints', validate(printsQuerySchema, 'query'), controller.getPrints);
router.get('/prints/:slug', validate(slugParamSchema, 'params'), controller.getPrintBySlug);
router.post('/chat', chatLimiter, validate(chatSchema), controller.chat);
router.get('/variants/:variantSlug/likes/me', _auth, validate(variantSlugParamSchema, 'params'), likeController.getStatus);
router.post('/variants/:variantSlug/likes', _auth, validate(variantSlugParamSchema, 'params'), likeController.like);
router.delete('/variants/:variantSlug/likes', _auth, validate(variantSlugParamSchema, 'params'), likeController.unlike);
router.get('/prints/:slug/reviews', validate(slugParamSchema, 'params'), validate(reviewsQuerySchema, 'query'), reviewController.list);
router.get('/prints/:slug/reviews/summary', validate(slugParamSchema, 'params'), reviewController.summary);
router.get('/prints/:slug/reviews/ai-summary', validate(slugParamSchema, 'params'), reviewSummaryController.printSummary);
router.get('/prints/:slug/reviews/me', _auth, validate(slugParamSchema, 'params'), reviewController.findMine);
router.post('/prints/:slug/reviews', _auth, validate(slugParamSchema, 'params'), validate(createReviewSchema), reviewController.create);
router.patch('/reviews/:id', _auth, validate(idParamSchema, 'params'), validate(updateReviewSchema), reviewController.update);
router.delete('/reviews/:id', _auth, validate(idParamSchema, 'params'), reviewController.remove);

module.exports = router;
