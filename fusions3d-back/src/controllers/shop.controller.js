const service = require('../services/shop.service');

class ShopController {
  async getHome(_req, res, next) {
    try {
      const data = await service.getHome();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getFilters(_req, res, next) {
    try {
      const data = await service.getFilters();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getPrints(req, res, next) {
    try {
      const { data, meta } = await service.getPrints(req.query);
      res.status(200).json({ success: true, data, meta });
    } catch (error) {
      next(error);
    }
  }

  async getPrintBySlug(req, res, next) {
    try {
      const data = await service.getPrintBySlug(req.params.slug);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ShopController();
