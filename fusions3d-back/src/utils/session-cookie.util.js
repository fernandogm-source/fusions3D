const SESSION_COOKIE_NAME = 'fusions3d_session';

function getSessionCookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
    ...(maxAge !== undefined && { maxAge })
  };
}

module.exports = { SESSION_COOKIE_NAME, getSessionCookieOptions };
