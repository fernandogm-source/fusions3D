const { timingSafeEqual } = require('crypto');
const { env } = require('../config/env');
const { AppError } = require('../utils/app.error');

function requireInternalKey(req, _res, next) {
  const provided = Buffer.from(req.get('X-Internal-Api-Key') || '');
  const expected = Buffer.from(env.aiServiceKey || '');

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return next(new AppError('Clave de servicio no válida', 401, 'UNAUTHORIZED'));
  }

  next();
}

module.exports = { requireInternalKey };
