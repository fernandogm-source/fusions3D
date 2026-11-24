const mongoose = require('mongoose');

const variantLikeSchema = new mongoose.Schema(
  {
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PrintVariant',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: 'variant_likes',
    versionKey: false
  }
);

variantLikeSchema.index({ variantId: 1, userId: 1 }, { unique: true });
variantLikeSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('VariantLike', variantLikeSchema);
