const PrintVariant = require('../models/printVariant.model');
require('../models/print.model');
require('../models/material.model');

const POPULATE = [
  { path: 'printId', select: 'name slug deletedAt isActive' },
  { path: 'materialId', select: 'name deletedAt isActive' }
];

class PrintVariantRepository {
  async findAll() {
    return PrintVariant.find({ deletedAt: null }).sort({ sku: 1 }).populate(POPULATE).lean();
  }

  async findSoftDeleted() {
    return PrintVariant.find({ deletedAt: { $ne: null } }).sort({ sku: 1 }).populate(POPULATE).lean();
  }

  async findById(id) {
    return PrintVariant.findOne({ _id: id, deletedAt: null }).populate(POPULATE).lean();
  }

  async findByIdWithDeleted(id) {
    return PrintVariant.findOne({ _id: id }).lean();
  }

  async findBySku(sku) {
    return PrintVariant.findOne({ sku: sku.toUpperCase(), deletedAt: null }).populate(POPULATE).lean();
  }

  async findByPrintId(printId) {
    return PrintVariant.find({ printId, deletedAt: null }).sort({ sku: 1 }).populate(POPULATE).lean();
  }

  async create(data) {
    const variant = await PrintVariant.create(data);
    return PrintVariant.findById(variant._id).populate(POPULATE).lean();
  }

  async updateById(id, data) {
    return PrintVariant.findOneAndUpdate(
      { _id: id, deletedAt: null },
      data,
      { new: true, runValidators: true }
    ).populate(POPULATE).lean();
  }

  async softDelete(id) {
    return PrintVariant.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date(), isActive: false },
      { new: true, runValidators: true }
    ).lean();
  }

  async setActiveById(id, isActive) {
    return PrintVariant.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { isActive },
      { new: true, runValidators: true }
    ).populate(POPULATE).lean();
  }

  async findByActive(isActive) {
    return PrintVariant.find({ isActive, deletedAt: null }).sort({ sku: 1 }).populate(POPULATE).lean();
  }

  async restoreById(id) {
    return PrintVariant.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { deletedAt: null },
      { new: true, runValidators: true }
    ).populate(POPULATE).lean();
  }
}

module.exports = new PrintVariantRepository();
