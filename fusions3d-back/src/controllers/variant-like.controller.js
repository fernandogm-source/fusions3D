const service = require('../services/variant-like.service');

class VariantLikeController {
  async listMine(req, res, next) {
    try {
      const data = await service.listForUser(req.user.id, req.query);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req, res, next) {
    try {
      const data = await service.getStatus(req.params.variantSlug, req.user.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async like(req, res, next) {
    try {
      const data = await service.like(req.params.variantSlug, req.user.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async unlike(req, res, next) {
    try {
      const data = await service.unlike(req.params.variantSlug, req.user.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VariantLikeController();
