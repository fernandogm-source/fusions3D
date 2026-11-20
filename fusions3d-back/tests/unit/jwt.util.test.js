const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  isTokenExpiredError,
  getAccessTokenMaxAge,
  getRefreshTokenMaxAge
} = require('../../src/utils/jwt.util');

const USER_ID = '507f1f77bcf86cd799439011';
const ROLE_ID = '507f1f77bcf86cd799439012';

before(() => {
  process.env.JWT_SECRET = 'a'.repeat(32);
  process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
});

test('el access token se verifica y conserva usuario, rol y tipo', () => {
  const { token, tokenId } = signAccessToken(USER_ID, ROLE_ID);
  const payload = verifyAccessToken(token);

  assert.equal(payload.sub, USER_ID);
  assert.equal(payload.roleId, ROLE_ID);
  assert.equal(payload.type, 'access');
  assert.equal(payload.jti, tokenId);
});

test('el refresh token no sirve como access token', () => {
  const { token } = signRefreshToken(USER_ID);
  assert.throws(() => verifyAccessToken(token));
});

test('el access token no sirve como refresh token', () => {
  const { token } = signAccessToken(USER_ID, ROLE_ID);
  assert.throws(() => verifyRefreshToken(token));
});

test('el refresh token expira a los 7 días y el access a 1 hora', () => {
  const refresh = signRefreshToken(USER_ID);
  const access = signAccessToken(USER_ID, ROLE_ID);

  assert.equal(getAccessTokenMaxAge(), 60 * 60 * 1000);
  assert.equal(getRefreshTokenMaxAge(), 7 * 24 * 60 * 60 * 1000);
  assert.ok(refresh.expiresAt.getTime() - Date.now() > 6.9 * 24 * 60 * 60 * 1000);
  assert.ok(access.expiresAt.getTime() - Date.now() <= 60 * 60 * 1000);
});

test('un access token caducado se identifica como expirado', () => {
  const expired = require('jsonwebtoken').sign(
    { roleId: ROLE_ID, type: 'access', exp: Math.floor(Date.now() / 1000) - 10 },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', subject: USER_ID, jwtid: 'expired-id', issuer: 'fusions3d-api', audience: 'fusions3d-admin' }
  );

  try {
    verifyAccessToken(expired);
    assert.fail('debería haber lanzado error');
  } catch (error) {
    assert.equal(isTokenExpiredError(error), true);
  }
});
