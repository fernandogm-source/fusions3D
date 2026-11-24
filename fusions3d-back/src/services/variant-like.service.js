const repository = require('../repositories/variant-like.repository');
const shopRepository = require('../repositories/shop.repository');
const { AppError } = require('../utils/app.error');

class VariantLikeService {
  async getStatus(variantSlug, userId) {
    const variant = await this.resolveVisible(variantSlug);

    return { liked: await repository.exists(variant._id, userId) };
  }

  async like(variantSlug, userId) {
    const variant = await this.resolveVisible(variantSlug);

    if (await repository.insertIfAbsent(variant._id, userId)) {
      await repository.adjustLikesCount(variant._id, 1);
    }

    return this.summary(variant._id, userId);
  }

  async unlike(variantSlug, userId) {
    const variant = await this.resolveVisible(variantSlug);

    if (await repository.delete(variant._id, userId)) {
      await repository.adjustLikesCount(variant._id, -1);
    }

    return this.summary(variant._id, userId);
  }

  async listForUser(userId, { page, limit }) {
    const { items, total } = await repository.findLikedVariantsPage(userId, {
      skip: (page - 1) * limit,
      limit
    });

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async resolveVisible(variantSlug) {
    const variant = await shopRepository.findVisibleVariantBySlug(variantSlug);

    if (!variant) {
      throw new AppError('Variante no encontrada', 404, 'VARIANT_NOT_FOUND');
    }

    return variant;
  }

  async summary(variantId, userId) {
    const [liked, likesCount] = await Promise.all([
      repository.exists(variantId, userId),
      repository.findLikesCount(variantId)
    ]);

    return { liked, likesCount };
  }
}

module.exports = new VariantLikeService();
