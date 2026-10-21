const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      required: true,
      enum: ['Print', 'Category']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'entityType'
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true
    },
    altText: {
      type: String,
      trim: true,
      default: ''
    },
    position: {
      type: Number,
      default: 0
    },
    isCover: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['published', 'draft', 'archived', 'suspended'],
      default: 'published'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    collection: 'images',
    versionKey: false
  }
);

imageSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('Image', imageSchema);
