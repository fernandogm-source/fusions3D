const service = require('../services/auth.service');

class AuthController {
  async login(req, res, next) {
    try {
      const data = await service.login(req.body);
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
      res.status(200).json({ success: true, message: 'Sesión cerrada correctamente' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
