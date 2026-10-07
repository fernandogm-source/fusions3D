const mongoose = require('mongoose');

const printSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 150
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    precio_venta: {
      type: Number,
      required: true,
      min: 0
    },
    precio_coste: {
      type: Number,
      required: true,
      min: 0
    },
    tiempo_impresion: {
      type: Number,
      required: true,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['published', 'draft', 'archived','suspended'],
      default: 'draft'
    },
    slug: {
      type: String,
      default: null
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
    collection: 'impresiones',
    versionKey: false
  }
);

module.exports = mongoose.model('Print', printSchema);