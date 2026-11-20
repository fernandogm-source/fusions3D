const { randomUUID } = require('node:crypto');
const repository = require('../repositories/auth.repository');
const revokedTokenRepository = require('../repositories/revoked-token.repository');
const refreshTokenRepository = require('../repositories/refresh-token.repository');
const userService = require('./user.service');
const { hashPassword, verifyPassword } = require('../utils/password.util');
const {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getAccessTokenExpiration
} = require('../utils/jwt.util');
const { AppError } = require('../utils/app.error');

const INVALID_CREDENTIALS = 'Email o contraseña incorrectos';
const SESSION_EXPIRED = 'Tu sesión ha expirado. Inicia sesión de nuevo.';

let dummyHashPromise;

function getDummyHash() {
  dummyHashPromise ??= hashPassword(randomUUID());
  return dummyHashPromise;
}

function toAuthUser(user, role) {
  return {
    id: String(user._id),
    email: user.email,
    username: user.username,
    role: role.name
  };
}

class AuthService {
  async register(data) {
    const user = await userService.create({
      email: data.email,
      username: data.username,
      password: data.password
    });

    return { user: { id: String(user._id), email: user.email, username: user.username } };
  }

  async login({ email, password }) {
    const user = await repository.findByEmailForLogin(email);

    if (!user || !user.passwordHash) {
      await verifyPassword(password, await getDummyHash());
      throw new AppError(INVALID_CREDENTIALS, 401, 'INVALID_CREDENTIALS');
    }

    const role = user.role;
    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches || !user.isActive || user.deletedAt || !role || !role.isActive || role.deletedAt) {
      throw new AppError(INVALID_CREDENTIALS, 401, 'INVALID_CREDENTIALS');
    }

    const tokens = await this.issueTokens(user._id, role._id);

    return {
      ...tokens,
      expiresIn: getAccessTokenExpiration(),
      user: toAuthUser(user, role)
    };
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (_error) {
      throw new AppError(SESSION_EXPIRED, 401, 'SESSION_EXPIRED');
    }

    const stored = await refreshTokenRepository.findActive(payload.jti);
    if (!stored || String(stored.userId) !== payload.sub) {
      throw new AppError(SESSION_EXPIRED, 401, 'SESSION_EXPIRED');
    }

    const user = await repository.findActiveById(payload.sub);
    const role = user?.role;
    if (!role || !role.isActive || role.deletedAt) {
      throw new AppError(SESSION_EXPIRED, 401, 'SESSION_EXPIRED');
    }

    await refreshTokenRepository.revoke(payload.jti);
    const tokens = await this.issueTokens(user._id, role._id);

    return {
      ...tokens,
      expiresIn: getAccessTokenExpiration(),
      user: toAuthUser(user, role)
    };
  }

  async logout({ accessToken, refreshToken }) {
    if (refreshToken) {
      const refreshPayload = this.decodeQuietly(() => verifyRefreshToken(refreshToken));
      if (refreshPayload) {
        await refreshTokenRepository.revoke(refreshPayload.jti);
      }
    }

    if (accessToken) {
      const accessPayload = this.decodeQuietly(() => verifyAccessToken(accessToken));
      if (accessPayload) {
        await revokedTokenRepository.revoke(accessPayload.jti, new Date(accessPayload.exp * 1000));
      }
    }
  }

  async issueTokens(userId, roleId) {
    const access = signAccessToken(userId, roleId);
    const refresh = signRefreshToken(userId);

    await refreshTokenRepository.create(refresh.tokenId, userId, refresh.expiresAt);

    return { accessToken: access.token, refreshToken: refresh.token };
  }

  decodeQuietly(verify) {
    try {
      return verify();
    } catch (_error) {
      return null;
    }
  }
}

module.exports = new AuthService();
