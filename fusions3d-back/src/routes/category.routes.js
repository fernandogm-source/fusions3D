const express = require('express');
const controller = require('../controllers/category.controller');
const { validate } = require('../middlewares/validation.middleware');
const { createCategorySchema, updateCategorySchema } = require('../schemas/category.schema');
const { idParamSchema, slugParamSchema } = require('../schemas/common.schema');

const router = express.Router();

router.get('/', controller.getAll);
router.get('/soft-deleted', controller.getSoftDeleted);
router.get('/active', controller.getActive);
router.get('/inactive', controller.getInactive);
router.get('/slug/:slug', validate(slugParamSchema, 'params'), controller.getBySlug);
router.post('/', validate(createCategorySchema), controller.create);
router.get('/:id', validate(idParamSchema, 'params'), controller.getById);
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateCategorySchema), controller.update);
router.patch('/:id/active', validate(idParamSchema, 'params'), controller.setActive);
router.patch('/:id/soft-delete', validate(idParamSchema, 'params'), controller.softDelete);
router.patch('/:id/restore', validate(idParamSchema, 'params'), controller.restore);

module.exports = router;
