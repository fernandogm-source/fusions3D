const express = require('express');
const controller = require('../controllers/printVariant.controller');
const { validate } = require('../middlewares/validation.middleware');
const { createPrintVariantSchema, updatePrintVariantSchema } = require('../schemas/printVariant.schema');
const { idParamSchema, printIdParamSchema } = require('../schemas/common.schema');

const router = express.Router();

router.get('/', controller.getAll);
router.get('/soft-deleted', controller.getSoftDeleted);
router.get('/active', controller.getActive);
router.get('/inactive', controller.getInactive);
router.get('/sku/:sku', controller.getBySku);
router.get('/print/:printId', validate(printIdParamSchema, 'params'), controller.getByPrintId);
router.post('/', validate(createPrintVariantSchema), controller.create);
router.get('/:id', validate(idParamSchema, 'params'), controller.getById);
router.patch('/:id', validate(idParamSchema, 'params'), validate(updatePrintVariantSchema), controller.update);
router.patch('/:id/active', validate(idParamSchema, 'params'), controller.setActive);
router.patch('/:id/soft-delete', validate(idParamSchema, 'params'), controller.softDelete);
router.patch('/:id/restore', validate(idParamSchema, 'params'), controller.restore);

module.exports = router;
