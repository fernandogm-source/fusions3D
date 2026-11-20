const repository = require('../repositories/auth.repository');
const revokedTokenRepository = require('../repositories/revoked-token.repository');
const { verifyAccessToken, isTokenExpiredError } = require('../utils/jwt.util');
const { AppError } = require('../utils/app.error');
const { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } = require('../utils/session-cookie.util');

const AUTHENTICATION_ERROR = () => new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
const ACCESS_EXPIRED_ERROR = () => new AppError('El token de acceso ha expirado', 401, 'ACCESS_TOKEN_EXPIRED');

function extractToken(req) {
  const authorization = req.get('authorization');
  const match = authorization && authorization.match(/^Bearer\s+(.+)$/i);

  if (match) {
    return match[1].trim();
  }

  return req.cookies?.[ACCESS_COOKIE_NAME] || null;
}

async function _auth(req, _res, next) {
  const token = extractToken(req);

  if (!token) {
    // El navegador elimina la cookie del access token al caducar; si queda el refresh, hay que renovar.
    return next(req.cookies?.[REFRESH_COOKIE_NAME] ? ACCESS_EXPIRED_ERROR() : AUTHENTICATION_ERROR());
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    return next(isTokenExpiredError(error) ? ACCESS_EXPIRED_ERROR() : AUTHENTICATION_ERROR());
  }

  try {
    if (await revokedTokenRepository.isRevoked(payload.jti)) {
      return next(AUTHENTICATION_ERROR());
    }

    const user = await repository.findActiveById(payload.sub);
    const role = user?.role;
    if (
      !role ||
      !role.isActive ||
      role.deletedAt ||
      String(role._id) !== payload.roleId
    ) {
      return next(AUTHENTICATION_ERROR());
    }

    req.user = {
      id: String(user._id),
      email: user.email,
      username: user.username,
      role: role.name
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { _auth };
