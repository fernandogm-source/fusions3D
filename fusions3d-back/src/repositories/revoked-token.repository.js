const RevokedToken = require('../models/revoked-token.model');

class RevokedTokenRepository {
  async isRevoked(tokenId) {
    if (typeof tokenId !== 'string' || !tokenId) {
      throw new TypeError('El identificador del token es obligatorio');
    }

    const record = await RevokedToken.exists({
      tokenId,
      expiresAt: { $gt: new Date() }
    });
    return Boolean(record);
  }

  async revoke(tokenId, expiresAt) {
    if (
      typeof tokenId !== 'string' ||
      !tokenId ||
      !(expiresAt instanceof Date) ||
      !Number.isFinite(expiresAt.getTime()) ||
      expiresAt <= new Date()
    ) {
      throw new TypeError('El identificador y la expiración del token deben ser válidos');
    }

    await RevokedToken.updateOne(
      { tokenId },
      { $setOnInsert: { tokenId, expiresAt } },
      { upsert: true }
    );
  }
}

module.exports = new RevokedTokenRepository();
