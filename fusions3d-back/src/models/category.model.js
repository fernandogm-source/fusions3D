const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      default: null
    },
    status: {
      type: String,
      enum: ['published', 'draft', 'archived', 'suspended'],
      default: 'draft'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    collection: 'categories',
    versionKey: false
  }
);

categorySchema.virtual('images', {
  ref: 'Image',
  localField: '_id',
  foreignField: 'entityId',
  match: { entityType: 'Category' }
});

module.exports = mongoose.model('Category', categorySchema);
