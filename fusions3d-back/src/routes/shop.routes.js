const express = require('express');
const controller = require('../controllers/shop.controller');
const { validate } = require('../middlewares/validation.middleware');
const { printsQuerySchema } = require('../schemas/shop.schema');
const { slugParamSchema } = require('../schemas/common.schema');

const router = express.Router();

router.get('/home', controller.getHome);
router.get('/filters', controller.getFilters);
router.get('/prints', validate(printsQuerySchema, 'query'), controller.getPrints);
router.get('/prints/:slug', validate(slugParamSchema, 'params'), controller.getPrintBySlug);

module.exports = router;
