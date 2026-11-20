const service = require('../services/auth.service');
const { getAccessTokenMaxAge, getRefreshTokenMaxAge } = require('../utils/jwt.util');
const {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  setSessionCookies,
  clearSessionCookies
} = require('../utils/session-cookie.util');

function setTokens(res, { accessToken, refreshToken }) {
  setSessionCookies(res, {
    accessToken,
    refreshToken,
    accessMaxAge: getAccessTokenMaxAge(),
    refreshMaxAge: getRefreshTokenMaxAge()
  });
}

class AuthController {
  async register(req, res, next) {
    try {
      const data = await service.register(req.body);
      res.status(201).json({ success: true, data, message: 'Cuenta creada correctamente' });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { accessToken, refreshToken, ...data } = await service.login(req.body);
      setTokens(res, { accessToken, refreshToken });
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const { accessToken, refreshToken, ...data } = await service.refresh(req.cookies?.[REFRESH_COOKIE_NAME]);
      setTokens(res, { accessToken, refreshToken });
      res.status(200).json({ success: true, data });
    } catch (error) {
      clearSessionCookies(res);
      next(error);
    }
  }

  me(req, res) {
    res.status(200).json({ success: true, data: { user: req.user } });
  }

  async logout(req, res, next) {
    try {
      await service.logout({
        accessToken: req.cookies?.[ACCESS_COOKIE_NAME],
        refreshToken: req.cookies?.[REFRESH_COOKIE_NAME]
      });
      clearSessionCookies(res);
      res.status(200).json({ success: true, data: null, message: 'Sesión cerrada correctamente' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
