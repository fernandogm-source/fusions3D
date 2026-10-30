const service = require('../services/auth.service');
const { getAccessTokenMaxAge } = require('../utils/jwt.util');
const { SESSION_COOKIE_NAME, getSessionCookieOptions } = require('../utils/session-cookie.util');

class AuthController {
  async login(req, res, next) {
    try {
      const { accessToken, ...data } = await service.login(req.body);
      res.cookie(SESSION_COOKIE_NAME, accessToken, getSessionCookieOptions(getAccessTokenMaxAge()));
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  me(req, res) {
    res.status(200).json({ success: true, data: { user: req.user } });
  }

  async logout(req, res, next) {
    try {
      await service.logout(req.auth);
      res.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions());
      res.status(200).json({ success: true, data: null, message: 'Sesión cerrada correctamente' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
