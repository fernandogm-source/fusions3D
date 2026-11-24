const repository = require('../repositories/variant-review.repository');
const shopRepository = require('../repositories/shop.repository');
const aiService = require('./ai.service');
const { AppError } = require('../utils/app.error');
const { isOwnerOrAdmin } = require('../utils/authorization.util');

const DUPLICATE_KEY = 11000;
const SENTIMENT_SAMPLE_SIZE = 60;

class VariantReviewService {
  async list(printSlug, { stars }) {
    const print = await this.resolvePublishedPrint(printSlug);
    const variants = await repository.findVariantsByPrintId(print._id);
    const reviews = await repository.findByVariantIds(variants.map((variant) => variant._id), stars);

    return this.toViews(reviews, variants);
  }

  async adminPrints() {
    const prints = await repository.findPrintSummaries();

    return prints.map((print) => ({
      _id: print._id,
      name: print.name,
      slug: print.slug,
      reviewCount: print.reviewCount,
      ratingAverage: print.ratingAverage
    }));
  }

  async adminList({ stars, page, limit, printId }) {
    const variantIds = printId ? await repository.findVariantIdsByPrintId(printId) : null;
    const { items, total } = variantIds && variantIds.length === 0
      ? { items: [], total: 0 }
      : await repository.findPage({ stars, skip: (page - 1) * limit, limit, variantIds });

    const variants = await repository.findVariantsByIds([...new Set(items.map((review) => String(review.variantId)))]);
    const prints = await repository.findPrintsByIds([...new Set(variants.map((variant) => String(variant.printId)))]);
    const printNames = new Map(prints.map((print) => [String(print._id), print.name]));
    const printNameByVariant = new Map(
      variants.map((variant) => [String(variant._id), printNames.get(String(variant.printId)) ?? null])
    );

    const views = await this.toViews(items, variants);
    const [print] = printId ? await repository.findPrintsByIds([printId]) : [null];

    return {
      items: views.map((view, index) => ({
        ...view,
        printName: printNameByVariant.get(String(items[index].variantId)) ?? null
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      print: print ? { _id: print._id, name: print.name } : null
    };
  }

  async printSentiment(printId) {
    const [print] = await repository.findPrintsByIds([printId]);
    if (!print) {
      throw new AppError('Impresión no encontrada', 404, 'PRINT_NOT_FOUND');
    }

    const variantIds = await repository.findVariantIdsByPrintId(printId);
    const { count, lastUpdate } = await repository.findSentimentSignature(variantIds);

    if (count === 0) {
      return { reviewCount: 0, sampleSize: 0, sentiment: null, updatedAt: null };
    }

    const signature = `${count}:${lastUpdate.getTime()}`;
    const cached = await repository.findPrintSentiment(printId);

    if (cached?.signature === signature) {
      return this.sentimentView(cached, count);
    }

    const reviews = await repository.findRecentForSentiment(variantIds, SENTIMENT_SAMPLE_SIZE);
    const analysis = await aiService.analyzeSentiment({
      printName: print.name,
      reviews: reviews.map(({ rating, comment }) => ({ rating, comment }))
    });

    const saved = await repository.upsertPrintSentiment(printId, {
      signature,
      ...analysis,
      sampleSize: reviews.length
    });

    return this.sentimentView(saved, count);
  }

  sentimentView(saved, reviewCount) {
    return {
      reviewCount,
      sampleSize: saved.sampleSize,
      sentiment: {
        positive: saved.positive,
        neutral: saved.neutral,
        negative: saved.negative,
        summary: saved.summary
      },
      updatedAt: saved.updatedAt
    };
  }

  async ratingDistribution(printSlug) {
    const print = await this.resolvePublishedPrint(printSlug);
    const variants = await repository.findVariantsByPrintId(print._id);
    const rows = await repository.countByRating(variants.map((variant) => variant._id));

    const countByStar = new Map(rows.map((row) => [row._id, row.count]));
    const total = rows.reduce((sum, row) => sum + row.count, 0);

    return {
      total,
      distribution: [1, 2, 3, 4, 5].map((stars) => {
        const count = countByStar.get(stars) ?? 0;
        return {
          stars,
          count,
          percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0
        };
      })
    };
  }

  async findMine(printSlug, userId) {
    const print = await this.resolvePublishedPrint(printSlug);
    const variants = await repository.findVariantsByPrintId(print._id);
    const reviews = await repository.findByUserAndVariantIds(userId, variants.map((variant) => variant._id));

    return this.toViews(reviews, variants);
  }

  async create(printSlug, userId, { variantSlug, rating, comment }) {
    const print = await this.resolvePublishedPrint(printSlug);
    const variant = await shopRepository.findVisibleVariantBySlug(variantSlug);

    if (!variant || String(variant.printId) !== String(print._id)) {
      throw new AppError('Variante no encontrada', 404, 'VARIANT_NOT_FOUND');
    }

    let review;
    try {
      review = await repository.insert({ variantId: variant._id, userId, rating, comment });
    } catch (error) {
      if (error.code === DUPLICATE_KEY) {
        throw new AppError('Ya has valorado esta variante. Puedes editar tu comentario.', 409, 'REVIEW_ALREADY_EXISTS');
      }
      throw error;
    }

    return this.summary(review, variant._id);
  }

  async update(reviewId, user, data) {
    const existing = await this.findReviewOrFail(reviewId);

    if (String(existing.userId) !== String(user.id)) {
      throw new AppError('Solo puedes editar tus propios comentarios', 403, 'FORBIDDEN');
    }

    const review = await repository.updateById(reviewId, data);
    return this.summary(review, existing.variantId);
  }

  async remove(reviewId, user) {
    const existing = await this.findReviewOrFail(reviewId);

    if (!isOwnerOrAdmin(user, existing)) {
      throw new AppError('No puedes borrar este comentario', 403, 'FORBIDDEN');
    }

    await repository.deleteById(reviewId);
    const variant = await repository.findVariantById(existing.variantId);
    const stats = await repository.syncRatingStats(existing.variantId);

    return { removed: true, variant: this.variantStats(variant, stats) };
  }

  async findReviewOrFail(reviewId) {
    const review = await repository.findById(reviewId);

    if (!review) {
      throw new AppError('Comentario no encontrado', 404, 'REVIEW_NOT_FOUND');
    }

    return review;
  }

  async resolvePublishedPrint(printSlug) {
    const print = await shopRepository.findPublishedBySlug(printSlug);

    if (!print || !print.categoryId) {
      throw new AppError('Impresión no encontrada', 404, 'PRINT_NOT_FOUND');
    }

    return print;
  }

  async summary(review, variantId) {
    const [variant, stats] = await Promise.all([
      repository.findVariantById(variantId),
      repository.syncRatingStats(variantId)
    ]);

    const [view] = await this.toViews([review], [variant]);
    return { review: view, variant: this.variantStats(variant, stats) };
  }

  async toViews(reviews, variants) {
    const variantsById = new Map(variants.map((variant) => [String(variant._id), variant]));
    const { usernames, avatars } = await repository.findAuthors([...new Set(reviews.map((review) => String(review.userId)))]);

    return reviews.map((review) => {
      const variant = variantsById.get(String(review.variantId));

      return {
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        userId: review.userId,
        username: usernames.get(String(review.userId)) ?? null,
        avatarUrl: avatars.get(String(review.userId)) ?? null,
        variantSlug: variant?.slug ?? null,
        variantColor: variant?.color ?? null,
        variantSku: variant?.sku ?? null,
        materialName: variant?.materialId?.name ?? null
      };
    });
  }

  variantStats(variant, stats) {
    return {
      slug: variant.slug,
      ratingAverage: stats.ratingAverage,
      ratingCount: stats.ratingCount
    };
  }
}

module.exports = new VariantReviewService();
