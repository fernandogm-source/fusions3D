const mongoose = require('mongoose');

const printSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 150
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true
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
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: null
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    collection: 'prints',
    versionKey: false
  }
);

printSchema.virtual('images', {
  ref: 'Image',
  localField: '_id',
  foreignField: 'entityId',
  match: { entityType: 'Print' }
});

module.exports = mongoose.model('Print', printSchema);
