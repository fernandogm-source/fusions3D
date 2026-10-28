const User = require('../models/user.model');
const Role = require('../models/role.model');
const { ADMIN_ROLE_NAME } = require('../utils/role.util');

class UserRepository {
  async findAll() {
    return User.find({ deletedAt: null }).select('-password -passwordHash').sort({ email: 1 }).lean();
  }

  async findSoftDeleted() {
    return User.find({ deletedAt: { $ne: null } }).select('-password -passwordHash').sort({ email: 1 }).lean();
  }

  async findById(id) {
    return User.findOne({ _id: id, deletedAt: null }).select('-password -passwordHash').lean();
  }

  async findByIdWithDeleted(id) {
    return User.findOne({ _id: id }).select('-password -passwordHash').lean();
  }

  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase(), deletedAt: null }).select('-password -passwordHash').lean();
  }

  async create(data) {
    return User.create(data);
  }

  async deleteById(id) {
    return User.deleteOne({ _id: id });
  }

  async updateById(id, data) {
    return User.findOneAndUpdate(
      { _id: id, deletedAt: null },
      data,
      { new: true, runValidators: true }
    ).select('-password -passwordHash').lean();
  }

  async softDelete(id) {
    return User.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date(), updatedAt: new Date(), isActive: false },
      { new: true, runValidators: true }
    ).select('-password -passwordHash').lean();
  }

  async setActiveById(id, isActive) {
    return User.findOneAndUpdate(
      { _id: id },
      { isActive, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password -passwordHash').lean();
  }

  async findByActive(isActive) {
    return User.find({ isActive, deletedAt: null }).select('-password -passwordHash').sort({ email: 1 }).lean();
  }

  async countActiveAdmins() {
    const adminRoleIds = await Role.find({ name: ADMIN_ROLE_NAME, isActive: true, deletedAt: null }).distinct('_id');
    return User.countDocuments({ role: { $in: adminRoleIds }, isActive: true, deletedAt: null });
  }

  async restoreById(id) {
    return User.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { deletedAt: null, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password -passwordHash').lean();
  }
}

module.exports = new UserRepository();
