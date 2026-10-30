const User = require('../models/user.model');

const ROLE_POPULATE = { path: 'role', select: 'name isActive deletedAt' };

class AuthRepository {
  findByEmailForLogin(email) {
    return User.findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .populate(ROLE_POPULATE)
      .lean();
  }

  findActiveById(id) {
    return User.findOne({
      _id: id,
      isActive: true,
      deletedAt: null
    })
      .select('email username role isActive deletedAt')
      .populate(ROLE_POPULATE)
      .lean();
  }

  findByIdForProfile(id) {
    return User.findById(id)
      .select('email role isActive deletedAt')
      .lean();
  }
}

module.exports = new AuthRepository();
