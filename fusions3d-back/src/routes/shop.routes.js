const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/shop.controller');
const { validate } = require('../middlewares/validation.middleware');
const { printsQuerySchema, chatSchema } = require('../schemas/shop.schema');
const { slugParamSchema } = require('../schemas/common.schema');

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

module.exports = router;
