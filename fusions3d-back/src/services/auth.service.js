const { randomUUID } = require('node:crypto');
const repository = require('../repositories/auth.repository');
const revokedTokenRepository = require('../repositories/revoked-token.repository');
const { hashPassword, verifyPassword } = require('../utils/password.util');
const { signAccessToken, getAccessTokenExpiration } = require('../utils/jwt.util');
const { AppError } = require('../utils/app.error');

const INVALID_CREDENTIALS = 'Email o contraseña incorrectos';

let dummyHashPromise;

function getDummyHash() {
  dummyHashPromise ??= hashPassword(randomUUID());
  return dummyHashPromise;
}

class AuthService {
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

    const accessToken = signAccessToken(user._id, role._id);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: getAccessTokenExpiration(),
      user: {
        id: String(user._id),
        email: user.email,
        role: role.name
      }
    };
  }

  async logout({ tokenId, expiresAt }) {
    await revokedTokenRepository.revoke(tokenId, expiresAt);
  }
}

module.exports = new AuthService();
