const mongoose = require('mongoose');
const VariantLike = require('../models/variant-like.model');
const PrintVariant = require('../models/printVariant.model');

const DUPLICATE_KEY = 11000;

const VISIBLE_PRINT = { 'print.status': 'published', 'print.isActive': true, 'print.deletedAt': null };
const VISIBLE_CATEGORY = { 'category.status': 'published', 'category.isActive': true, 'category.deletedAt': null };
const VISIBLE_MATERIAL = { 'material.isActive': true, 'material.deletedAt': null };

class VariantLikeRepository {
  /** Devuelve true solo si el like se ha creado ahora (no existía). */
  async insertIfAbsent(variantId, userId) {
    try {
      const result = await VariantLike.updateOne(
        { variantId, userId },
        { $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
      return result.upsertedCount === 1;
    } catch (error) {
      if (error.code === DUPLICATE_KEY) return false;
      throw error;
    }
  }

  /** Devuelve true solo si el like existía y se ha eliminado. */
  async delete(variantId, userId) {
    const result = await VariantLike.deleteOne({ variantId, userId });
    return result.deletedCount === 1;
  }

  async exists(variantId, userId) {
    return Boolean(await VariantLike.exists({ variantId, userId }));
  }

  async adjustLikesCount(variantId, delta) {
    const match = delta < 0 ? { _id: variantId, likesCount: { $gt: 0 } } : { _id: variantId };
    await PrintVariant.updateOne(match, { $inc: { likesCount: delta } });
  }

  /** Likes del usuario sobre variantes visibles, más recientes primero. */
  async findLikedVariantsPage(userId, { skip, limit }) {
    const [result] = await VariantLike.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $sort: { createdAt: -1, _id: -1 } },
      { $lookup: { from: 'print_variants', localField: 'variantId', foreignField: '_id', as: 'variant' } },
      { $unwind: '$variant' },
      { $match: { 'variant.isActive': true, 'variant.deletedAt': null } },
      { $lookup: { from: 'prints', localField: 'variant.printId', foreignField: '_id', as: 'print' } },
      { $unwind: '$print' },
      { $match: VISIBLE_PRINT },
      { $lookup: { from: 'categories', localField: 'print.categoryId', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $match: VISIBLE_CATEGORY },
      { $lookup: { from: 'materials', localField: 'variant.materialId', foreignField: '_id', as: 'material' } },
      { $unwind: '$material' },
      { $match: VISIBLE_MATERIAL },
      {
        $lookup: {
          from: 'images',
          let: { printId: '$print._id' },
          pipeline: [
            {
              $match: {
                $expr: { $and: [{ $eq: ['$entityType', 'Print'] }, { $eq: ['$entityId', '$$printId'] }] },
                status: 'published',
                isActive: true
              }
            },
            { $sort: { isCover: -1, position: 1 } },
            { $limit: 1 },
            { $project: { _id: 0, imageUrl: 1, altText: 1 } }
          ],
          as: 'images'
        }
      },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                likedAt: '$createdAt',
                variantSlug: '$variant.slug',
                sku: '$variant.sku',
                color: '$variant.color',
                colorHex: '$variant.colorHex',
                salePrice: '$variant.salePrice',
                likesCount: '$variant.likesCount',
                materialName: '$material.name',
                printName: '$print.name',
                printSlug: '$print.slug',
                cover: { $arrayElemAt: ['$images', 0] }
              }
            }
          ],
          total: [{ $count: 'count' }]
        }
      }
    ]);

    return {
      items: result?.data ?? [],
      total: result?.total[0]?.count ?? 0
    };
  }

  async findLikesCount(variantId) {
    const variant = await PrintVariant.findById(variantId).select('likesCount').lean();
    return variant?.likesCount ?? 0;
  }
}

module.exports = new VariantLikeRepository();
