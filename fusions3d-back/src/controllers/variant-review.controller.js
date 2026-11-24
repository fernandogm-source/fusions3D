const service = require('../services/variant-review.service');

class VariantReviewController {
  async list(req, res, next) {
    try {
      const data = await service.list(req.params.slug, req.query);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async adminPrints(req, res, next) {
    try {
      const data = await service.adminPrints();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async adminList(req, res, next) {
    try {
      const data = await service.adminList(req.query);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async adminSentiment(req, res, next) {
    try {
      const data = await service.printSentiment(req.params.printId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async adminRemove(req, res, next) {
    try {
      const data = await service.remove(req.params.id, req.user);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async summary(req, res, next) {
    try {
      const data = await service.ratingDistribution(req.params.slug);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async findMine(req, res, next) {
    try {
      const data = await service.findMine(req.params.slug, req.user.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const data = await service.create(req.params.slug, req.user.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = await service.update(req.params.id, req.user, req.body);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const data = await service.remove(req.params.id, req.user);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VariantReviewController();
