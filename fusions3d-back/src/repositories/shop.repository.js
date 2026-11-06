const Print = require('../models/print.model');
const PrintVariant = require('../models/printVariant.model');
const Category = require('../models/category.model');
const Material = require('../models/material.model');
const Image = require('../models/image.model');
const { buildRelevanceExpression } = require('../utils/search.util');

const PUBLISHED = { status: 'published', isActive: true, deletedAt: null };
const ACTIVE = { isActive: true, deletedAt: null };
const PUBLISHED_CATEGORY_MATCH = { 'category.status': 'published', 'category.isActive': true, 'category.deletedAt': null };

class ShopRepository {
  async findPrints({ printMatch, variantMatch, sort, relevanceToken, skip, limit }) {
    const pipeline = [{ $match: printMatch }];

    if (relevanceToken) {
      pipeline.push({ $addFields: { score: buildRelevanceExpression(relevanceToken) } });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'categories',
          let: { categoryId: '$categoryId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$categoryId'] }, ...PUBLISHED } },
            { $project: { _id: 0, name: 1, slug: 1 } }
          ],
          as: 'category'
        }
      },
      { $match: { 'category.0': { $exists: true } } },
      {
        $lookup: {
          from: 'print_variants',
          let: { printId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$printId', '$$printId'] }, ...ACTIVE, ...variantMatch } },
            {
              $lookup: {
                from: 'materials',
                let: { materialId: '$materialId' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$_id', '$$materialId'] }, ...ACTIVE } },
                  { $project: { _id: 0, name: 1, slug: 1 } }
                ],
                as: 'material'
              }
            },
            { $match: { 'material.0': { $exists: true } } },
            { $project: { _id: 0, salePrice: 1, material: { $arrayElemAt: ['$material', 0] } } }
          ],
          as: 'variants'
        }
      },
      { $match: { 'variants.0': { $exists: true } } },
      {
        $addFields: {
          minPrice: { $min: '$variants.salePrice' },
          maxPrice: { $max: '$variants.salePrice' },
          materials: {
            $setUnion: [{ $map: { input: '$variants', as: 'variant', in: '$$variant.material' } }]
          }
        }
      },
      {
        $lookup: {
          from: 'images',
          let: { printId: '$_id' },
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
      { $sort: sort },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                name: 1,
                slug: 1,
                minPrice: 1,
                maxPrice: 1,
                materials: 1,
                createdAt: 1,
                categoryName: { $arrayElemAt: ['$category.name', 0] },
                categorySlug: { $arrayElemAt: ['$category.slug', 0] },
                cover: { $arrayElemAt: ['$images', 0] }
              }
            }
          ],
          total: [{ $count: 'count' }]
        }
      }
    );

    const [result] = await Print.aggregate(pipeline);

    return {
      items: result?.data ?? [],
      total: result?.total[0]?.count ?? 0
    };
  }

  async findPublishedBySlug(slug) {
    return Print.findOne({ slug, ...PUBLISHED })
      .populate({ path: 'categoryId', select: 'name slug', match: PUBLISHED })
      .populate({
        path: 'images',
        select: 'imageUrl altText position isCover',
        match: { entityType: 'Print', status: 'published', isActive: true },
        options: { sort: { position: 1 } }
      })
      .lean();
  }

  async findActiveVariantsByPrintId(printId) {
    return PrintVariant.find({ printId, ...ACTIVE })
      .select('-costPrice -printId -__v')
      .sort({ salePrice: 1 })
      .populate({ path: 'materialId', select: 'name slug', match: ACTIVE })
      .lean();
  }

  async findPublishedCategoryIdsBySlugs(slugs) {
    const categories = await Category.find({ slug: { $in: slugs }, ...PUBLISHED }).select('_id').lean();
    return categories.map((category) => category._id);
  }

  async findActiveMaterialIdsBySlugs(slugs) {
    const materials = await Material.find({ slug: { $in: slugs }, ...ACTIVE }).select('_id').lean();
    return materials.map((material) => material._id);
  }

  async countPublishedPrintsByCategory() {
    return Print.aggregate([
      { $match: PUBLISHED },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } }
    ]);
  }

  async findPublishedCategoriesByIds(ids) {
    return Category.find({ _id: { $in: ids }, ...PUBLISHED }).select('name slug').lean();
  }

  async findCategoryImages(ids) {
    return Image.find({
      entityType: 'Category',
      entityId: { $in: ids },
      status: 'published',
      isActive: true
    })
      .sort({ isCover: -1, position: 1 })
      .select('entityId imageUrl altText')
      .lean();
  }

  async aggregatePublishedVariants({ extraMatch = {}, group }) {
    return PrintVariant.aggregate([
      { $match: { ...ACTIVE, ...extraMatch } },
      {
        $lookup: {
          from: 'prints',
          localField: 'printId',
          foreignField: '_id',
          as: 'print'
        }
      },
      { $unwind: '$print' },
      {
        $match: {
          'print.status': 'published',
          'print.isActive': true,
          'print.deletedAt': null
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'print.categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      { $match: { ...PUBLISHED_CATEGORY_MATCH } },
      {
        $lookup: {
          from: 'materials',
          localField: 'materialId',
          foreignField: '_id',
          as: 'material'
        }
      },
      { $unwind: '$material' },
      { $match: { 'material.isActive': true, 'material.deletedAt': null } },
      { $group: group }
    ]);
  }

  async countPublishedVariantsByMaterial() {
    return this.aggregatePublishedVariants({
      group: { _id: '$materialId', count: { $sum: 1 } }
    });
  }

  async countPublishedVariantsByColor() {
    return this.aggregatePublishedVariants({
      extraMatch: { colorSlug: { $nin: [null, ''] } },
      group: {
        _id: '$colorSlug',
        name: { $first: '$color' },
        hex: { $first: '$colorHex' },
        count: { $sum: 1 }
      }
    });
  }

  async findPublishedPriceRange() {
    const [range] = await this.aggregatePublishedVariants({
      group: { _id: null, min: { $min: '$salePrice' }, max: { $max: '$salePrice' } }
    });

    return range ? { min: range.min, max: range.max } : { min: 0, max: 0 };
  }

  async findActiveMaterialsByIds(ids) {
    return Material.find({ _id: { $in: ids }, ...ACTIVE }).select('name slug').lean();
  }
}

module.exports = new ShopRepository();
