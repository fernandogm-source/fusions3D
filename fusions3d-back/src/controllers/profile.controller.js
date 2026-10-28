const service = require('../services/profile.service');

class ProfileController {
  async getProfile(req, res, next) {
    try {
      const data = await service.getProfile(req.user, req.profileTargetUserId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const data = await service.updateProfile(req.user, req.profileTargetUserId, req.body);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProfileController();
