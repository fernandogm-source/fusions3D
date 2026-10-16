const Category = require('../models/category.model');
require('../models/image.model');

const POPULATE_IMAGES = { path: 'images', select: 'imageUrl altText position isCover status' };

class CategoryRepository {
  async findAll() {
    return Category.find({ deletedAt: null }).sort({ name: 1 }).populate(POPULATE_IMAGES).lean();
  }

  async findSoftDeleted() {
    return Category.find({ deletedAt: { $ne: null } }).sort({ name: 1 }).populate(POPULATE_IMAGES).lean();
  }

  async findById(id) {
    return Category.findOne({ _id: id, deletedAt: null }).populate(POPULATE_IMAGES).lean();
  }

  async findByIdWithDeleted(id) {
    return Category.findOne({ _id: id }).lean();
  }

  async findBySlug(slug) {
    return Category.findOne({ slug, deletedAt: null }).populate(POPULATE_IMAGES).lean();
  }

  async create(data) {
    return Category.create(data);
  }

  async updateById(id, data) {
    return Category.findOneAndUpdate(
      { _id: id, deletedAt: null },
      data,
      { new: true, runValidators: true }
    ).populate(POPULATE_IMAGES).lean();
  }

  async softDelete(id) {
    return Category.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date(), isActive: false },
      { new: true, runValidators: true }
    ).lean();
  }

  async setActiveById(id, isActive) {
    return Category.findOneAndUpdate(
      { _id: id },
      { isActive },
      { new: true, runValidators: true }
    ).lean();
  }

  async findByActive(isActive) {
    return Category.find({ isActive, deletedAt: null }).sort({ name: 1 }).populate(POPULATE_IMAGES).lean();
  }

  async restoreById(id) {
    return Category.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { deletedAt: null },
      { new: true, runValidators: true }
    ).lean();
  }
}

module.exports = new CategoryRepository();
