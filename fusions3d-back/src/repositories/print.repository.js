const Print = require('../models/print.model');
const Image = require('../models/image.model');
require('../models/category.model');

const POPULATE = [
  { path: 'categoryId', select: 'name slug deletedAt isActive' },
  {
    path: 'images',
    select: 'imageUrl altText position isCover status',
    match: { entityType: 'Print', status: 'published', isActive: true },
    options: { sort: { position: 1 } }
  }
];

class PrintRepository {
  async findAll() {
    return Print.find({ deletedAt: null }).sort({ name: 1 }).populate(POPULATE).lean();
  }

  async findSoftDeleted() {
    return Print.find({ deletedAt: { $ne: null } }).sort({ name: 1 }).populate(POPULATE).lean();
  }

  async findById(id) {
    return Print.findOne({ _id: id, deletedAt: null }).populate(POPULATE).lean();
  }

  async findByIdWithDeleted(id) {
    return Print.findOne({ _id: id }).lean();
  }

  async findBySlug(slug) {
    return Print.findOne({ slug, deletedAt: null }).populate(POPULATE).lean();
  }

  async create(data) {
    return Print.create(data);
  }

  async replaceImages(id, imageUrls, altText) {
    await Image.deleteMany({ entityType: 'Print', entityId: id });

    const uniqueImageUrls = [...new Set(imageUrls)];
    if (uniqueImageUrls.length === 0) return;

    await Image.insertMany(uniqueImageUrls.map((imageUrl, position) => ({
      entityType: 'Print',
      entityId: id,
      imageUrl,
      altText,
      position,
      isCover: position === 0,
      status: 'published',
      isActive: true
    })));
  }

  async updateById(id, data) {
    return Print.findOneAndUpdate(
      { _id: id, deletedAt: null },
      data,
      { new: true, runValidators: true }
    ).populate(POPULATE).lean();
  }

  async softDelete(id) {
    return Print.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date(), updatedAt: new Date(), isActive: false },
      { new: true, runValidators: true }
    ).lean();
  }

  async setActiveById(id, isActive) {
    const update = { isActive, updatedAt: new Date() };

    return Print.findOneAndUpdate(
      { _id: id },
      update,
      { new: true, runValidators: true }
    ).populate(POPULATE).lean();
  }

  async findByActive(isActive) {
    return Print.find({ isActive, deletedAt: null }).sort({ name: 1 }).populate(POPULATE).lean();
  }

  async restoreById(id) {
    return Print.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { deletedAt: null, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();
  }
}

module.exports = new PrintRepository();
