const Profile = require('../models/profile.model');

class ProfileRepository {
  findByUserId(userId) {
    return Profile.findOne({ userId }).lean();
  }

  ensureForUser(userId, name) {
    return Profile.updateOne(
      { userId },
      { $setOnInsert: { userId, name } },
      { upsert: true }
    );
  }

  updateByUserId(userId, data, fallbackName) {
    const setOnInsert = { userId };
    if (!Object.hasOwn(data, 'name')) {
      setOnInsert.name = fallbackName;
    }

    return Profile.findOneAndUpdate(
      { userId },
      {
        $set: data,
        $setOnInsert: setOnInsert
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    ).lean();
  }
}

module.exports = new ProfileRepository();
