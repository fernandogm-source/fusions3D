const Print = require('../modules/print/print.model');

class PrintRepository {
  async findAll() {
    return Print.find({ deletedAt: null }).sort({ nombre: 1 }).lean();
  }

  async findSoftDeleted() {
    return Print.find({ deletedAt: { $ne: null } }).sort({ nombre: 1 }).lean();
  }

  async findById(id) {
    return Print.findOne({ _id: id, deletedAt: null }).lean();
  }

  async findByIdWithDeleted(id) {
    return Print.findOne({ _id: id }).lean();
  }

  async findBySlug(slug) {
    return Print.findOne({ slug, deletedAt: null }).lean();
  }

  async create(data) {
    return Print.create(data);
  }

  async updateById(id, data) {
    return Print.findOneAndUpdate(
      { _id: id, deletedAt: null },
      data,
      { new: true, runValidators: true }
    ).lean();
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
    ).lean();
  }

  async findByActive(isActive) {
    return Print.find({ isActive, deletedAt: null }).sort({ nombre: 1 }).lean();
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
