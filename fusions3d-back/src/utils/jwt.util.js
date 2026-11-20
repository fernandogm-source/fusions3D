const jwt = require('jsonwebtoken');
const { randomUUID } = require('node:crypto');

const JWT_ISSUER = 'fusions3d-api';
const JWT_AUDIENCE = 'fusions3d-admin';
const DEFAULT_ACCESS_EXPIRES_IN = '1h';
const DEFAULT_REFRESH_EXPIRES_IN = '7d';

const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh'
};

const EXPIRATION_UNIT_MS = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };

function getSecret(name) {
  const secret = process.env[name];

  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error(`${name} debe contener al menos 32 bytes aleatorios`);
  }

  return secret;
}

function getExpiresIn(name, fallback) {
  const expiresIn = process.env[name] || fallback;

  if (!/^\d+(s|m|h|d)$/.test(expiresIn)) {
    throw new Error(`${name} debe usar un formato como 15m, 1h o 7d`);
  }

  return expiresIn;
}

function getJwtConfig(type) {
  if (type === TOKEN_TYPES.REFRESH) {
    return {
      secret: getSecret('JWT_REFRESH_SECRET'),
      expiresIn: getExpiresIn('JWT_REFRESH_EXPIRES_IN', DEFAULT_REFRESH_EXPIRES_IN)
    };
  }

  return {
    secret: getSecret('JWT_SECRET'),
    expiresIn: getExpiresIn('JWT_EXPIRES_IN', DEFAULT_ACCESS_EXPIRES_IN)
  };
}

function signToken(type, claims, userId) {
  const { secret, expiresIn } = getJwtConfig(type);
  const tokenId = randomUUID();
  const token = jwt.sign({ ...claims, type }, secret, {
    algorithm: 'HS256',
    jwtid: tokenId,
    subject: String(userId),
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn
  });

  return { token, tokenId, expiresAt: new Date(jwt.decode(token).exp * 1000) };
}

function verifyToken(token, type) {
  const { secret } = getJwtConfig(type);
  const payload = jwt.verify(token, secret, {
    algorithms: ['HS256'],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE
  });

  if (
    typeof payload === 'string' ||
    !payload.sub ||
    payload.type !== type ||
    typeof payload.jti !== 'string' ||
    !Number.isFinite(payload.exp)
  ) {
    throw new jwt.JsonWebTokenError('El token no contiene identidad, tipo y expiración válidos');
  }

  return payload;
}

function signAccessToken(userId, roleId) {
  if (!roleId) {
    throw new TypeError('El token requiere un rol');
  }

  return signToken(TOKEN_TYPES.ACCESS, { roleId: String(roleId) }, userId);
}

function signRefreshToken(userId) {
  return signToken(TOKEN_TYPES.REFRESH, {}, userId);
}

function verifyAccessToken(token) {
  const payload = verifyToken(token, TOKEN_TYPES.ACCESS);

  if (typeof payload.roleId !== 'string') {
    throw new jwt.JsonWebTokenError('El token de acceso no contiene un rol válido');
  }

  return payload;
}

function verifyRefreshToken(token) {
  return verifyToken(token, TOKEN_TYPES.REFRESH);
}

function isTokenExpiredError(error) {
  return error instanceof jwt.TokenExpiredError;
}

function getDurationMs(expiresIn) {
  const [, value, unit] = expiresIn.match(/^(\d+)(s|m|h|d)$/);
  return Number(value) * EXPIRATION_UNIT_MS[unit];
}

function getAccessTokenExpiration() {
  return getJwtConfig(TOKEN_TYPES.ACCESS).expiresIn;
}

function getAccessTokenMaxAge() {
  return getDurationMs(getAccessTokenExpiration());
}

function getRefreshTokenMaxAge() {
  return getDurationMs(getJwtConfig(TOKEN_TYPES.REFRESH).expiresIn);
}

function validateJwtConfig() {
  getJwtConfig(TOKEN_TYPES.ACCESS);
  getJwtConfig(TOKEN_TYPES.REFRESH);

  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET debe ser distinto de JWT_SECRET');
  }
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  isTokenExpiredError,
  validateJwtConfig,
  getAccessTokenExpiration,
  getAccessTokenMaxAge,
  getRefreshTokenMaxAge
};
