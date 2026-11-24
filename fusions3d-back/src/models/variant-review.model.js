const mongoose = require('mongoose');

const variantReviewSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: { validator: Number.isInteger, message: 'rating debe ser un entero' }
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 1000
    }
  },
  {
    collection: 'variant_reviews',
    versionKey: false,
    timestamps: true
  }
);

variantReviewSchema.index({ variantId: 1, userId: 1 }, { unique: true });
variantReviewSchema.index({ variantId: 1, rating: 1 });
variantReviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model('VariantReview', variantReviewSchema);
