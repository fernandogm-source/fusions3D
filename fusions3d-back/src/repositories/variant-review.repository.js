const mongoose = require('mongoose');
const VariantReview = require('../models/variant-review.model');
const PrintVariant = require('../models/printVariant.model');
const Print = require('../models/print.model');
const User = require('../models/user.model');
const Profile = require('../models/profile.model');
const PrintSentiment = require('../models/print-sentiment.model');
const PrintReviewSummary = require('../models/print-review-summary.model');

const MAX_LIST = 50;

class VariantReviewRepository {
  findVariantsByPrintId(printId) {
    return PrintVariant.find({ printId })
      .select('slug color sku materialId ratingAverage ratingCount')
      .populate({ path: 'materialId', select: 'name' })
      .lean();
  }

  findVariantById(variantId) {
    return PrintVariant.findById(variantId)
      .select('slug color sku materialId ratingAverage ratingCount')
      .populate({ path: 'materialId', select: 'name' })
      .lean();
  }

  findByVariantIds(variantIds, stars) {
    const match = { variantId: { $in: variantIds } };
    if (stars.length > 0) match.rating = { $in: stars };

    return VariantReview.find(match).sort({ createdAt: -1, _id: -1 }).limit(MAX_LIST).lean();
  }

  findPrintSummaries() {
    return VariantReview.aggregate([
      { $lookup: { from: 'print_variants', localField: 'variantId', foreignField: '_id', as: 'variant' } },
      { $unwind: '$variant' },
      {
        $group: {
          _id: '$variant.printId',
          reviewCount: { $sum: 1 },
          ratingAverage: { $avg: '$rating' }
        }
      },
      { $lookup: { from: 'prints', localField: '_id', foreignField: '_id', as: 'print' } },
      { $unwind: '$print' },
      { $project: { _id: 1, name: '$print.name', slug: '$print.slug', reviewCount: 1, ratingAverage: 1 } },
      { $sort: { name: 1 } }
    ]);
  }

  async findVariantIdsByPrintId(printId) {
    const variants = await PrintVariant.find({ printId }).select('_id').lean();
    return variants.map((variant) => variant._id);
  }

  async findPage({ stars, skip, limit, variantIds }) {
    const match = stars.length > 0 ? { rating: { $in: stars } } : {};
    if (variantIds) match.variantId = { $in: variantIds };
    const [items, total] = await Promise.all([
      VariantReview.find(match).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
      VariantReview.countDocuments(match)
    ]);

    return { items, total };
  }

  findVariantsByIds(variantIds) {
    return PrintVariant.find({ _id: { $in: variantIds } })
      .select('printId slug color sku materialId ratingAverage ratingCount')
      .populate({ path: 'materialId', select: 'name' })
      .lean();
  }

  findPrintsByIds(printIds) {
    return Print.find({ _id: { $in: printIds } }).select('name').lean();
  }

  countByRating(variantIds) {
    return VariantReview.aggregate([
      { $match: { variantId: { $in: variantIds } } },
      { $group: { _id: '$rating', count: { $sum: 1 } } }
    ]);
  }

  findByUserAndVariantIds(userId, variantIds) {
    return VariantReview.find({ userId, variantId: { $in: variantIds } }).sort({ createdAt: -1 }).lean();
  }

  findById(reviewId) {
    return VariantReview.findById(reviewId).lean();
  }

  /** Inserta un comentario; lanza el error de duplicado de MongoDB si el usuario ya comentó la variante. */
  insert(data) {
    return VariantReview.create(data).then((review) => review.toObject());
  }

  updateById(reviewId, data) {
    return VariantReview.findByIdAndUpdate(reviewId, { $set: data }, { new: true, runValidators: true }).lean();
  }

  deleteById(reviewId) {
    return VariantReview.deleteOne({ _id: reviewId });
  }

  async findAuthors(userIds) {
    const [users, profiles] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select('username').lean(),
      Profile.find({ userId: { $in: userIds } }).select('userId avatarUrl').lean()
    ]);

    return {
      usernames: new Map(users.map((user) => [String(user._id), user.username])),
      avatars: new Map(profiles.map((profile) => [String(profile.userId), profile.avatarUrl]))
    };
  }

  async findSentimentSignature(variantIds) {
    const [result] = await VariantReview.aggregate([
      { $match: { variantId: { $in: variantIds } } },
      { $group: { _id: null, count: { $sum: 1 }, lastUpdate: { $max: '$updatedAt' } } }
    ]);

    return result ? { count: result.count, lastUpdate: result.lastUpdate } : { count: 0, lastUpdate: null };
  }

  findRecentForSentiment(variantIds, limit) {
    return VariantReview.find({ variantId: { $in: variantIds } })
      .sort({ updatedAt: -1, _id: -1 })
      .limit(limit)
      .select('rating comment')
      .lean();
  }

  findPrintSentiment(printId) {
    return PrintSentiment.findOne({ printId }).lean();
  }

  upsertPrintSentiment(printId, data) {
    return PrintSentiment.findOneAndUpdate({ printId }, { $set: { printId, ...data } }, { upsert: true, new: true }).lean();
  }

  findPrintReviewSummary(printId) {
    return PrintReviewSummary.findOne({ printId }).lean();
  }

  upsertPrintReviewSummary(printId, data) {
    return PrintReviewSummary.findOneAndUpdate({ printId }, { $set: { printId, ...data } }, { upsert: true, new: true }).lean();
  }

  /** Recalcula la media y el total de valoraciones de una variante a partir de sus comentarios. */
  async syncRatingStats(variantId) {
    const [result] = await VariantReview.aggregate([
      { $match: { variantId: new mongoose.Types.ObjectId(variantId) } },
      { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    const stats = { ratingAverage: result?.average ?? 0, ratingCount: result?.count ?? 0 };
    await PrintVariant.updateOne({ _id: variantId }, { $set: stats });
    return stats;
  }
}

module.exports = new VariantReviewRepository();
