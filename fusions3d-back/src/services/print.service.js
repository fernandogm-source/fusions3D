const repository = require('../repositories/print.repository');
const { AppError } = require('../utils/app.error');
const { generateSlug } = require('../utils/slug.util');

class PrintService {
  async getAll() {
    return repository.findAll();
  }

  async getSoftDeleted() {
    return repository.findSoftDeleted();
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
    const slug = await generateSlug(data.name);
    return repository.create({ ...data, slug });
  }

  async update(id, body) {
    const cleanData = { ...body };
    delete cleanData._id;
    delete cleanData.createdAt;
    delete cleanData.deletedAt;

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

    const print = await repository.softDelete(id);

    return { message: 'Impresión eliminada correctamente', data: print };
  }

  async getActive() {
    return repository.findByActive(true);
  }

  async getInactive() {
    return repository.findByActive(false);
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
}

module.exports = new PrintService();
