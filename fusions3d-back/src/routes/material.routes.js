const express = require('express');
const controller = require('../controllers/material.controller');
const { validate } = require('../middlewares/validation.middleware');
const { createMaterialSchema, updateMaterialSchema } = require('../schemas/material.schema');
const { idParamSchema } = require('../schemas/common.schema');

const router = express.Router();

router.get('/', controller.getAll);
router.get('/soft-deleted', controller.getSoftDeleted);
router.get('/active', controller.getActive);
router.get('/inactive', controller.getInactive);
router.post('/', validate(createMaterialSchema), controller.create);
router.get('/:id', validate(idParamSchema, 'params'), controller.getById);
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateMaterialSchema), controller.update);
router.patch('/:id/active', validate(idParamSchema, 'params'), controller.setActive);
router.patch('/:id/soft-delete', validate(idParamSchema, 'params'), controller.softDelete);
router.patch('/:id/restore', validate(idParamSchema, 'params'), controller.restore);

module.exports = router;
