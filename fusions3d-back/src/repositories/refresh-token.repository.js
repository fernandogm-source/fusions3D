const RefreshToken = require('../models/refresh-token.model');

class RefreshTokenRepository {
  async create(tokenId, userId, expiresAt) {
    await RefreshToken.create({ tokenId, userId, expiresAt });
  }

  findActive(tokenId) {
    return RefreshToken.findOne({
      tokenId,
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    }).lean();
  }

  async revoke(tokenId) {
    await RefreshToken.updateOne(
      { tokenId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  }
}

module.exports = new RefreshTokenRepository();
