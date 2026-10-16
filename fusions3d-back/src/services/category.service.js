const repository = require('../repositories/category.repository');
const Category = require('../models/category.model');
const { AppError } = require('../utils/app.error');
const { generateSlug } = require('../utils/slug.util');

class CategoryService {
  async getAll() {
    return repository.findAll();
  }

  async getSoftDeleted() {
    return repository.findSoftDeleted();
  }

  async getById(id) {
    const category = await repository.findById(id);

    if (!category) {
      throw new AppError('Categoría no encontrada', 404, 'CATEGORY_NOT_FOUND');
    }

    return category;
  }

  async getBySlug(slug) {
    const category = await repository.findBySlug(slug);

    if (!category) {
      throw new AppError('Categoría no encontrada', 404, 'CATEGORY_NOT_FOUND');
    }

    return category;
  }

  async create(data) {
    const slug = await generateSlug(data.name, Category);
    return repository.create({ ...data, slug });
  }

  async update(id, body) {
    const cleanData = { ...body };
    delete cleanData._id;
    delete cleanData.deletedAt;

    if (cleanData.name) {
      cleanData.slug = await generateSlug(cleanData.name, Category);
    }

    const category = await repository.updateById(id, cleanData);

    if (!category) {
      throw new AppError('Categoría no encontrada', 404, 'CATEGORY_NOT_FOUND');
    }

    return category;
  }

  async setActive(id) {
    const category = await repository.findByIdWithDeleted(id);

    if (!category) {
      throw new AppError('Categoría no encontrada', 404, 'CATEGORY_NOT_FOUND');
    }

    if (category.deletedAt) {
      throw new AppError('No se puede activar una categoría eliminada', 400, 'CATEGORY_DELETED');
    }

    return repository.setActiveById(id, !category.isActive);
  }

  async softDelete(id) {
    const existing = await repository.findById(id);

    if (!existing) {
      throw new AppError('Categoría no encontrada', 404, 'CATEGORY_NOT_FOUND');
    }

    if (existing.deletedAt) {
      throw new AppError('La categoría ya está eliminada', 409, 'ALREADY_DELETED');
    }

    const category = await repository.softDelete(id);

    return { message: 'Categoría eliminada correctamente', data: category };
  }

  async getActive() {
    return repository.findByActive(true);
  }

  async getInactive() {
    return repository.findByActive(false);
  }

  async restore(id) {
    const category = await repository.findByIdWithDeleted(id);

    if (!category) {
      throw new AppError('Categoría no encontrada', 404, 'CATEGORY_NOT_FOUND');
    }

    if (!category.deletedAt) {
      throw new AppError('La categoría no está eliminada', 400, 'NOT_DELETED');
    }

    const restored = await repository.restoreById(id);

    return { message: 'Categoría restaurada correctamente', data: restored };
  }
}

module.exports = new CategoryService();
