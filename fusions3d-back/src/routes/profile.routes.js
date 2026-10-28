const express = require('express');
const { ZodError } = require('zod');
const controller = require('../controllers/profile.controller');
const { validate } = require('../middlewares/validation.middleware');
const { _auth } = require('../middlewares/auth.middleware');
const { updateProfileSchema, profileTargetQuerySchema } = require('../schemas/profile.schema');

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

module.exports = router;
