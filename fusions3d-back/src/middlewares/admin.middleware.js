const { AppError } = require('../utils/app.error');
const { ADMIN_ROLE_NAME } = require('../utils/role.util');

function _admin(req, _res, next) {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
  }

  if (req.user.role !== ADMIN_ROLE_NAME) {
    return next(new AppError(
      'You do not have permission to access this resource',
      403,
      'FORBIDDEN'
    ));
  }

  return next();
}

module.exports = { _admin };
