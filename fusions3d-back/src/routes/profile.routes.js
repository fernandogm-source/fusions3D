const express = require('express');
const { ZodError } = require('zod');
const controller = require('../controllers/profile.controller');
const { validate } = require('../middlewares/validation.middleware');
const { _auth } = require('../middlewares/auth.middleware');
const { updateProfileSchema, profileTargetQuerySchema } = require('../schemas/profile.schema');
const { likesListQuerySchema } = require('../schemas/variant-like.schema');
const likeController = require('../controllers/variant-like.controller');

const router = express.Router();

function validateProfileTarget(req, _res, next) {
  try {
    const query = profileTargetQuerySchema.parse(req.query);
    req.profileTargetUserId = query.userId;
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(error);
    }
    return next(error);
  }
}

router.get('/getprofile', _auth, validateProfileTarget, controller.getProfile);
router.patch('/updateprofile', _auth, validateProfileTarget, validate(updateProfileSchema), controller.updateProfile);
router.get('/likes', _auth, validate(likesListQuerySchema, 'query'), likeController.listMine);

module.exports = router;
