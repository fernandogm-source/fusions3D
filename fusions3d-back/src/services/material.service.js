const repository = require('../repositories/material.repository');
const { AppError } = require('../utils/app.error');
const dependencyRestriction = require('./dependency-restriction.service');

class MaterialService {
  async getAll() {
    return repository.findAll();
  }

  async getSoftDeleted() {
    return repository.findSoftDeleted();
  }

  async getById(id) {
    const material = await repository.findById(id);

    if (!material) {
      throw new AppError('Material no encontrado', 404, 'MATERIAL_NOT_FOUND');
    }

    return material;
  }

  async create(data) {
    return repository.create(data);
  }

  async update(id, body) {
    const cleanData = { ...body };
    delete cleanData._id;
    delete cleanData.deletedAt;

    const material = await repository.updateById(id, cleanData);

    if (!material) {
      throw new AppError('Material no encontrado', 404, 'MATERIAL_NOT_FOUND');
    }

    return material;
  }

  async setActive(id) {
    const material = await repository.findByIdWithDeleted(id);

    if (!material) {
      throw new AppError('Material no encontrado', 404, 'MATERIAL_NOT_FOUND');
    }

    if (material.deletedAt) {
      throw new AppError('No se puede activar un material eliminado', 400, 'MATERIAL_DELETED');
    }

    const newActive = !material.isActive;
    if (!newActive) {
      await dependencyRestriction.assertMaterialHasNoVariants(id);
    }

    return repository.setActiveById(id, newActive);
  }

  async softDelete(id) {
    const existing = await repository.findById(id);

    if (!existing) {
      throw new AppError('Material no encontrado', 404, 'MATERIAL_NOT_FOUND');
    }

    if (existing.deletedAt) {
      throw new AppError('El material ya está eliminado', 409, 'ALREADY_DELETED');
    }

    await dependencyRestriction.assertMaterialHasNoVariants(id);
    const material = await repository.softDelete(id);

    return { message: 'Material eliminado correctamente', data: material };
  }

  async getActive() {
    return repository.findByActive(true);
  }

  async getInactive() {
    return repository.findByActive(false);
  }

  async restore(id) {
    const material = await repository.findByIdWithDeleted(id);

    if (!material) {
      throw new AppError('Material no encontrado', 404, 'MATERIAL_NOT_FOUND');
    }

    if (!material.deletedAt) {
      throw new AppError('El material no está eliminado', 400, 'NOT_DELETED');
    }

    const restored = await repository.restoreById(id);

    return { message: 'Material restaurado correctamente', data: restored };
  }
}

module.exports = new MaterialService();
