const Material = require('../models/material.model');

class MaterialRepository {
  async findAll() {
    return Material.find({ deletedAt: null }).sort({ name: 1 }).lean();
  }

  async findSoftDeleted() {
    return Material.find({ deletedAt: { $ne: null } }).sort({ name: 1 }).lean();
  }

  async findById(id) {
    return Material.findOne({ _id: id, deletedAt: null }).lean();
  }

  async findByIdWithDeleted(id) {
    return Material.findOne({ _id: id }).lean();
  }

  async create(data) {
    return Material.create(data);
  }

  async updateById(id, data) {
    return Material.findOneAndUpdate(
      { _id: id, deletedAt: null },
      data,
      { new: true, runValidators: true }
    ).lean();
  }

  async softDelete(id) {
    return Material.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date(), isActive: false },
      { new: true, runValidators: true }
    ).lean();
  }

  async setActiveById(id, isActive) {
    return Material.findOneAndUpdate(
      { _id: id },
      { isActive },
      { new: true, runValidators: true }
    ).lean();
  }

  async findByActive(isActive) {
    return Material.find({ isActive, deletedAt: null }).sort({ name: 1 }).lean();
  }

  async restoreById(id) {
    return Material.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { deletedAt: null },
      { new: true, runValidators: true }
    ).lean();
  }
}

module.exports = new MaterialRepository();
