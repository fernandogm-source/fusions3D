const repository = require('../repositories/print.repository');
const Category = require('../models/category.model');
const { AppError } = require('../utils/app.error');
const { generateSlug } = require('../utils/slug.util');
const { attachDependencyIssues } = require('../utils/dependency-issues.util');
const dependencyCascade = require('./dependency-cascade.service');

const DEPENDENCIES = [{
  field: 'categoryId',
  missingMessage: 'No tiene una categoría válida asignada',
  deletedMessage: 'La categoría asignada está eliminada',
  inactiveMessage: 'La categoría asignada está desactivada'
}];

class PrintService {
  async getAll() {
    return attachDependencyIssues(await repository.findAll(), DEPENDENCIES);
  }

  async getSoftDeleted() {
    return attachDependencyIssues(await repository.findSoftDeleted(), DEPENDENCIES);
  }

  async getById(id) {
    const print = await repository.findById(id);

    if (!print) {
      throw new AppError('Impresión no encontrada', 404, 'PRINT_NOT_FOUND');
    }

    return print;
  }

  async getBySlug(slug) {
    const print = await repository.findBySlug(slug);

    if (!print) {
      throw new AppError('Impresión no encontrada', 404, 'PRINT_NOT_FOUND');
    }

    return print;
  }

  async create(data) {
    await this.ensureCategoryExists(data.categoryId);
    const slug = await generateSlug(data.name);
    return repository.create({ ...data, slug });
  }

  async update(id, body) {
    const cleanData = { ...body };
    delete cleanData._id;
    delete cleanData.createdAt;
    delete cleanData.deletedAt;

    if (cleanData.categoryId !== undefined) {
      await this.ensureCategoryExists(cleanData.categoryId);
    }

    if (cleanData.name) {
      cleanData.slug = await generateSlug(cleanData.name);
    }

    cleanData.updatedAt = new Date();

    const print = await repository.updateById(id, cleanData);

    if (!print) {
      throw new AppError('Impresión no encontrada', 404, 'PRINT_NOT_FOUND');
    }

    return print;
  }

  async setActive(id) {
    const print = await repository.findByIdWithDeleted(id);

    if (!print) {
      throw new AppError('Impresión no encontrada', 404, 'PRINT_NOT_FOUND');
    }

    if (print.deletedAt) {
      throw new AppError('No se puede activar una impresión eliminada', 400, 'PRINT_DELETED');
    }

    const newActive = !print.isActive;
    if (newActive) {
      await this.ensureCategoryExists(print.categoryId);
    } else {
      await dependencyCascade.deactivatePrintDependents(id);
    }
    const updated = await repository.setActiveById(id, newActive);

    return updated;
  }

  async softDelete(id) {
    const existing = await repository.findById(id);

    if (!existing) {
      throw new AppError('Impresión no encontrada', 404, 'PRINT_NOT_FOUND');
    }

    if (existing.deletedAt) {
      throw new AppError('La impresión ya está eliminada', 409, 'ALREADY_DELETED');
    }

    await dependencyCascade.deactivatePrintDependents(id);
    const print = await repository.softDelete(id);

    return { message: 'Impresión eliminada correctamente', data: print };
  }

  async getActive() {
    return attachDependencyIssues(await repository.findByActive(true), DEPENDENCIES);
  }

  async getInactive() {
    return attachDependencyIssues(await repository.findByActive(false), DEPENDENCIES);
  }

  async restore(id) {
    const print = await repository.findByIdWithDeleted(id);

    if (!print) {
      throw new AppError('Impresión no encontrada', 404, 'PRINT_NOT_FOUND');
    }

    if (!print.deletedAt) {
      throw new AppError('La impresión no está eliminada', 400, 'NOT_DELETED');
    }

    const restored = await repository.restoreById(id);

    return { message: 'Impresión restaurada correctamente', data: restored };
  }

  async ensureCategoryExists(categoryId) {
    const category = await Category.findOne({
      _id: categoryId,
      deletedAt: null,
      isActive: true
    }).select('_id').lean();

    if (!category) {
      throw new AppError(
        'La categoría asignada no existe, está eliminada o desactivada',
        409,
        'DEPENDENCY_UNAVAILABLE'
      );
    }
  }
}

module.exports = new PrintService();
