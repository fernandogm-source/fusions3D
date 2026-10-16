const repository = require('../repositories/printVariant.repository');
const Print = require('../models/print.model');
const Material = require('../models/material.model');
const { AppError } = require('../utils/app.error');

class PrintVariantService {
  async getAll() {
    return repository.findAll();
  }

  async getSoftDeleted() {
    return repository.findSoftDeleted();
  }

  async getById(id) {
    const variant = await repository.findById(id);

    if (!variant) {
      throw new AppError('Variante no encontrada', 404, 'VARIANT_NOT_FOUND');
    }

    return variant;
  }

  async getBySku(sku) {
    const variant = await repository.findBySku(sku);

    if (!variant) {
      throw new AppError('Variante no encontrada', 404, 'VARIANT_NOT_FOUND');
    }

    return variant;
  }

  async getByPrintId(printId) {
    await this.ensurePrintExists(printId);
    return repository.findByPrintId(printId);
  }

  async create(data) {
    await this.ensurePrintExists(data.printId);
    await this.ensureMaterialExists(data.materialId);

    return repository.create({ ...data, sku: data.sku.trim().toUpperCase() });
  }

  async update(id, body) {
    const cleanData = { ...body };
    delete cleanData._id;
    delete cleanData.deletedAt;

    if (cleanData.printId) {
      await this.ensurePrintExists(cleanData.printId);
    }

    if (cleanData.materialId) {
      await this.ensureMaterialExists(cleanData.materialId);
    }

    if (cleanData.sku) {
      cleanData.sku = cleanData.sku.trim().toUpperCase();
    }

    const variant = await repository.updateById(id, cleanData);

    if (!variant) {
      throw new AppError('Variante no encontrada', 404, 'VARIANT_NOT_FOUND');
    }

    return variant;
  }

  async setActive(id) {
    const variant = await repository.findByIdWithDeleted(id);

    if (!variant) {
      throw new AppError('Variante no encontrada', 404, 'VARIANT_NOT_FOUND');
    }

    if (variant.deletedAt) {
      throw new AppError('No se puede activar una variante eliminada', 400, 'VARIANT_DELETED');
    }

    return repository.setActiveById(id, !variant.isActive);
  }

  async softDelete(id) {
    const existing = await repository.findById(id);

    if (!existing) {
      throw new AppError('Variante no encontrada', 404, 'VARIANT_NOT_FOUND');
    }

    if (existing.deletedAt) {
      throw new AppError('La variante ya está eliminada', 409, 'ALREADY_DELETED');
    }

    const variant = await repository.softDelete(id);

    return { message: 'Variante eliminada correctamente', data: variant };
  }

  async getActive() {
    return repository.findByActive(true);
  }

  async getInactive() {
    return repository.findByActive(false);
  }

  async restore(id) {
    const variant = await repository.findByIdWithDeleted(id);

    if (!variant) {
      throw new AppError('Variante no encontrada', 404, 'VARIANT_NOT_FOUND');
    }

    if (!variant.deletedAt) {
      throw new AppError('La variante no está eliminada', 400, 'NOT_DELETED');
    }

    const restored = await repository.restoreById(id);

    return { message: 'Variante restaurada correctamente', data: restored };
  }

  async ensurePrintExists(printId) {
    const exists = await Print.exists({ _id: printId, deletedAt: null });

    if (!exists) {
      throw new AppError('Impresión no encontrada', 404, 'PRINT_NOT_FOUND');
    }
  }

  async ensureMaterialExists(materialId) {
    const exists = await Material.exists({ _id: materialId, deletedAt: null });

    if (!exists) {
      throw new AppError('Material no encontrado', 404, 'MATERIAL_NOT_FOUND');
    }
  }
}

module.exports = new PrintVariantService();
