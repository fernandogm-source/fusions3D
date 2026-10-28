const service = require('../services/user.service');

class UserController {
  async getAll(_req, res, next) {
    try {
      const data = await service.getAll();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getSoftDeleted(_req, res, next) {
    try {
      const data = await service.getSoftDeleted();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await service.getById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const data = await service.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = await service.update(req.params.id, req.body, req.user.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req, res, next) {
    try {
      const data = await service.updateRole(req.params.id, req.body.role, req.user.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async setActive(req, res, next) {
    try {
      const data = await service.setActive(req.params.id, req.user.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async softDelete(req, res, next) {
    try {
      const result = await service.softDelete(req.params.id, req.user.id);
      res.status(200).json({ success: true, message: result.message, data: result.data });
    } catch (error) {
      next(error);
    }
  }

  async getActive(_req, res, next) {
    try {
      const data = await service.getActive();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getInactive(_req, res, next) {
    try {
      const data = await service.getInactive();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async restore(req, res, next) {
    try {
      const result = await service.restore(req.params.id);
      res.status(200).json({ success: true, message: result.message, data: result.data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
