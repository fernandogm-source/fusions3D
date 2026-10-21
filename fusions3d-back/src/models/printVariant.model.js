const mongoose = require('mongoose');

const printVariantSchema = new mongoose.Schema(
  {
    printId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Print',
      required: true,
      index: true
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 50
    },
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      required: true,
      index: true
    },
    color: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    salePrice: {
      type: Number,
      required: true,
      min: 0
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0
    },
    printTime: {
      type: Number,
      required: true,
      min: 0
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
    collection: 'print_variants',
    versionKey: false,
    timestamps: true
  }
);

module.exports = mongoose.model('PrintVariant', printVariantSchema);
