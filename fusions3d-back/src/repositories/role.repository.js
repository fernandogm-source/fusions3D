const Role = require('../models/role.model');

class RoleRepository {
  async findAll() {
    return Role.find({ deletedAt: null }).sort({ name: 1 }).lean();
  }

  async findSoftDeleted() {
    return Role.find({ deletedAt: { $ne: null } }).sort({ name: 1 }).lean();
  }

  async findById(id) {
    return Role.findOne({ _id: id, deletedAt: null }).lean();
  }

  async findByIdWithDeleted(id) {
    return Role.findOne({ _id: id }).lean();
  }

  async findAssignableById(id) {
    return Role.findOne({ _id: id, isActive: true, deletedAt: null }).lean();
  }

  async findByName(name) {
    return Role.findOne({ name, deletedAt: null }).lean();
  }

  async create(data) {
    return Role.create(data);
  }

  async updateById(id, data) {
    return Role.findOneAndUpdate(
      { _id: id, deletedAt: null },
      data,
      { new: true, runValidators: true }
    ).lean();
  }

  async softDelete(id) {
    return Role.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date(), isActive: false },
      { new: true, runValidators: true }
    ).lean();
  }

  async setActiveById(id, isActive) {
    return Role.findOneAndUpdate(
      { _id: id },
      { isActive },
      { new: true, runValidators: true }
    ).lean();
  }

  async findByActive(isActive) {
    return Role.find({ isActive, deletedAt: null }).sort({ name: 1 }).lean();
  }

  async restoreById(id) {
    return Role.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { deletedAt: null },
      { new: true, runValidators: true }
    ).lean();
  }
}

module.exports = new RoleRepository();
