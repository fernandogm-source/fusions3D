const express = require('express');
const controller = require('../controllers/variant-review.controller');
const { validate } = require('../middlewares/validation.middleware');
const { idParamSchema, printIdParamSchema } = require('../schemas/common.schema');
const { adminReviewsQuerySchema } = require('../schemas/variant-review.schema');

const router = express.Router();

router.get('/prints', controller.adminPrints);
router.get('/prints/:printId/sentiment', validate(printIdParamSchema, 'params'), controller.adminSentiment);
router.get('/', validate(adminReviewsQuerySchema, 'query'), controller.adminList);
router.delete('/:id', validate(idParamSchema, 'params'), controller.adminRemove);

module.exports = router;
