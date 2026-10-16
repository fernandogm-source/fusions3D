const Print = require('../models/print.model');
require('../models/category.model');
require('../models/image.model');

const POPULATE = [
  { path: 'categoryId', select: 'name slug' },
  { path: 'images', select: 'imageUrl altText position isCover status' }
];

class PrintRepository {
  async findAll() {
    return Print.find({ deletedAt: null }).sort({ name: 1 }).populate(POPULATE).lean();
  }

  async findSoftDeleted() {
    return Print.find({ deletedAt: { $ne: null } }).sort({ name: 1 }).populate(POPULATE).lean();
  }

  async findById(id) {
    return Print.findOne({ _id: id, deletedAt: null }).populate(POPULATE).lean();
  }

  async findByIdWithDeleted(id) {
    return Print.findOne({ _id: id }).lean();
  }

  async findBySlug(slug) {
    return Print.findOne({ slug, deletedAt: null }).populate(POPULATE).lean();
  }

  async create(data) {
    return Print.create(data);
  }

  async updateById(id, data) {
    return Print.findOneAndUpdate(
      { _id: id, deletedAt: null },
      data,
      { new: true, runValidators: true }
    ).populate(POPULATE).lean();
  }

  async softDelete(id) {
    return Print.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date(), updatedAt: new Date(), isActive: false },
      { new: true, runValidators: true }
    ).lean();
  }

  async setActiveById(id, isActive) {
    const update = { isActive, updatedAt: new Date() };

    return Print.findOneAndUpdate(
      { _id: id },
      update,
      { new: true, runValidators: true }
    ).populate(POPULATE).lean();
  }

  async findByActive(isActive) {
    return Print.find({ isActive, deletedAt: null }).sort({ name: 1 }).populate(POPULATE).lean();
  }

  async restoreById(id) {
    return Print.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { deletedAt: null, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();
  }
}

module.exports = new PrintRepository();
