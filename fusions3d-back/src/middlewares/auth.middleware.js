const repository = require('../repositories/auth.repository');
const revokedTokenRepository = require('../repositories/revoked-token.repository');
const { verifyAccessToken } = require('../utils/jwt.util');
const { AppError } = require('../utils/app.error');

const AUTHENTICATION_ERROR = () => new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');

async function _auth(req, _res, next) {
  const authorization = req.get('authorization');
  const match = authorization && authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return next(AUTHENTICATION_ERROR());
  }

  let payload;
  try {
    payload = verifyAccessToken(match[1].trim());
  } catch (_error) {
    return next(AUTHENTICATION_ERROR());
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
      role: role.name
    };
    req.auth = {
      tokenId: payload.jti,
      expiresAt: new Date(payload.exp * 1000)
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { _auth };
