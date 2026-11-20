const ACCESS_COOKIE_NAME = 'fusions3d_access';
const REFRESH_COOKIE_NAME = 'fusions3d_refresh';

const ACCESS_COOKIE_PATH = '/api';
const REFRESH_COOKIE_PATH = '/api/auth';

function getCookieOptions(path, maxAge) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path,
    ...(maxAge !== undefined && { maxAge })
  };
}

function getAccessCookieOptions(maxAge) {
  return getCookieOptions(ACCESS_COOKIE_PATH, maxAge);
}

function getRefreshCookieOptions(maxAge) {
  return getCookieOptions(REFRESH_COOKIE_PATH, maxAge);
}

function setSessionCookies(res, { accessToken, refreshToken, accessMaxAge, refreshMaxAge }) {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, getAccessCookieOptions(accessMaxAge));
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions(refreshMaxAge));
}

function clearSessionCookies(res) {
  res.clearCookie(ACCESS_COOKIE_NAME, getAccessCookieOptions());
  res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
}

module.exports = {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  setSessionCookies,
  clearSessionCookies
};
