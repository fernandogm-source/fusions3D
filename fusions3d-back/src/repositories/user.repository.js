const User = require('../models/user.model');
require('../models/role.model');

const POPULATE_ROLES = { path: 'roles', select: 'name' };

class UserRepository {
  async findAll() {
    return User.find({ deletedAt: null }).select('-password').sort({ name: 1 }).populate(POPULATE_ROLES).lean();
  }

  async findSoftDeleted() {
    return User.find({ deletedAt: { $ne: null } }).select('-password').sort({ name: 1 }).populate(POPULATE_ROLES).lean();
  }

  async findById(id) {
    return User.findOne({ _id: id, deletedAt: null }).select('-password').populate(POPULATE_ROLES).lean();
  }

  async findByIdWithDeleted(id) {
    return User.findOne({ _id: id }).select('-password').lean();
  }

  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase(), deletedAt: null }).select('-password').populate(POPULATE_ROLES).lean();
  }

  async create(data) {
    return User.create(data);
  }

  async updateById(id, data) {
    return User.findOneAndUpdate(
      { _id: id, deletedAt: null },
      data,
      { new: true, runValidators: true }
    ).select('-password').populate(POPULATE_ROLES).lean();
  }

  async softDelete(id) {
    return User.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date(), updatedAt: new Date(), isActive: false },
      { new: true, runValidators: true }
    ).select('-password').lean();
  }

  async setActiveById(id, isActive) {
    return User.findOneAndUpdate(
      { _id: id },
      { isActive, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password').lean();
  }

  async findByActive(isActive) {
    return User.find({ isActive, deletedAt: null }).select('-password').sort({ name: 1 }).populate(POPULATE_ROLES).lean();
  }

  async restoreById(id) {
    return User.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { deletedAt: null, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password').lean();
  }
}

module.exports = new UserRepository();
