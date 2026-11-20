const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validation.middleware');
const { _auth } = require('../middlewares/auth.middleware');
const { loginSchema, registerSchema } = require('../schemas/auth.schema');

const router = express.Router();

const createLimitHandler = (message) => (_req, res) => res.status(429).json({
  success: false,
  error: {
    code: 'RATE_LIMITED',
    message
  }
});

const loginLimitHandler = (_req, res) => res.status(429).json({
  success: false,
  error: {
    code: 'LOGIN_RATE_LIMITED',
    message: 'Demasiados intentos de inicio de sesión. Inténtalo más tarde.'
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: loginLimitHandler
});

const loginEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => typeof req.body?.email !== 'string',
  keyGenerator: (req) => req.body.email.trim().toLowerCase(),
  handler: loginLimitHandler
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Demasiados registros desde esta conexión. Inténtalo más tarde.')
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Demasiadas renovaciones de sesión. Inténtalo más tarde.')
});

router.post('/register', registerLimiter, validate(registerSchema), controller.register);
router.post('/login', loginLimiter, loginEmailLimiter, validate(loginSchema), controller.login);
router.post('/refresh', refreshLimiter, controller.refresh);
router.get('/me', _auth, controller.me);
router.post('/logout', controller.logout);

module.exports = router;
