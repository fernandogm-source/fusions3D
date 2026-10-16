const express = require('express');
const controller = require('../controllers/user.controller');
const { validate } = require('../middlewares/validation.middleware');
const { createUserSchema, updateUserSchema, updateUserRolesSchema } = require('../schemas/user.schema');
const { idParamSchema } = require('../schemas/common.schema');

const router = express.Router();

router.get('/', controller.getAll);
router.get('/soft-deleted', controller.getSoftDeleted);
router.get('/active', controller.getActive);
router.get('/inactive', controller.getInactive);
router.post('/', validate(createUserSchema), controller.create);
router.get('/:id', validate(idParamSchema, 'params'), controller.getById);
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateUserSchema), controller.update);
router.patch('/:id/roles', validate(idParamSchema, 'params'), validate(updateUserRolesSchema), controller.updateRoles);
router.patch('/:id/active', validate(idParamSchema, 'params'), controller.setActive);
router.patch('/:id/soft-delete', validate(idParamSchema, 'params'), controller.softDelete);
router.patch('/:id/restore', validate(idParamSchema, 'params'), controller.restore);

module.exports = router;
