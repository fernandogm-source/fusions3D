const jwt = require('jsonwebtoken');
const { randomUUID } = require('node:crypto');

const JWT_ISSUER = 'fusions3d-api';
const JWT_AUDIENCE = 'fusions3d-admin';
const DEFAULT_EXPIRES_IN = '1h';

function getJwtConfig() {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN;

  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('JWT_SECRET debe contener al menos 32 bytes aleatorios');
  }

  if (!/^\d+(s|m|h|d)$/.test(expiresIn)) {
    throw new Error('JWT_EXPIRES_IN debe usar un formato como 15m, 1h o 7d');
  }

  return { secret, expiresIn };
}

function validateJwtConfig() {
  getJwtConfig();
}

function signAccessToken(userId, roleId) {
  if (!roleId) {
    throw new TypeError('El token requiere un rol');
  }

  const { secret, expiresIn } = getJwtConfig();
  return jwt.sign({ roleId: String(roleId) }, secret, {
    algorithm: 'HS256',
    jwtid: randomUUID(),
    subject: String(userId),
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn
  });
}

function verifyAccessToken(token) {
  const { secret } = getJwtConfig();
  const payload = jwt.verify(token, secret, {
    algorithms: ['HS256'],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE
  });

  if (
    typeof payload === 'string' ||
    !payload.sub ||
    typeof payload.roleId !== 'string' ||
    typeof payload.jti !== 'string' ||
    !Number.isFinite(payload.exp)
  ) {
    throw new jwt.JsonWebTokenError('El token no contiene identidad, rol y expiración válidos');
  }

  return payload;
}

function getAccessTokenExpiration() {
  return getJwtConfig().expiresIn;
}

const EXPIRATION_UNIT_MS = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };

function getAccessTokenMaxAge() {
  const [, value, unit] = getJwtConfig().expiresIn.match(/^(\d+)(s|m|h|d)$/);
  return Number(value) * EXPIRATION_UNIT_MS[unit];
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  validateJwtConfig,
  getAccessTokenExpiration,
  getAccessTokenMaxAge
};
