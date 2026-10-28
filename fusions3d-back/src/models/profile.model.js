const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true, default: '' },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false }
  },
  { _id: true }
);

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      immutable: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100
    },
    phone: {
      type: String,
      trim: true,
      default: null,
      maxlength: 30
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: null,
      maxlength: 2048
    },
    addresses: {
      type: [addressSchema],
      default: []
    }
  },
  {
    collection: 'profiles',
    versionKey: false,
    timestamps: true
  }
);

module.exports = mongoose.model('Profile', profileSchema);
