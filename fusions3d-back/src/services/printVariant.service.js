const repository = require('../repositories/printVariant.repository');
const Category = require('../models/category.model');
const Print = require('../models/print.model');
const Material = require('../models/material.model');
const { AppError } = require('../utils/app.error');
const { buildSkuBase, generateSku } = require('../utils/sku.util');
const { attachDependencyIssues } = require('../utils/dependency-issues.util');

const DEPENDENCIES = [
  {
    field: 'printId',
    missingMessage: 'No tiene una impresión válida asignada',
    deletedMessage: 'La impresión asociada está eliminada',
    inactiveMessage: 'La impresión asociada está desactivada'
  },
  {
    field: 'materialId',
    missingMessage: 'No tiene un material válido asignado',
    deletedMessage: 'El material asignado está eliminado',
    inactiveMessage: 'El material asignado está desactivado'
  }
];

class PrintVariantService {
  async getAll() {
    return attachDependencyIssues(await repository.findAll(), DEPENDENCIES);
  }

  async getSoftDeleted() {
    return attachDependencyIssues(await repository.findSoftDeleted(), DEPENDENCIES);
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
    return attachDependencyIssues(await repository.findByPrintId(printId), DEPENDENCIES);
  }

  async create(data) {
    const print = await this.ensurePrintExists(data.printId);
    const material = await this.ensureMaterialExists(data.materialId);

    const sku = await this.resolveSku(print, material, data.color);

    return repository.create({ ...data, sku });
  }

  async resolveSku(print, material, color) {
    const base = buildSkuBase(print.name, material.name, color);
    return generateSku(base);
  }

  async update(id, body) {
    const cleanData = { ...body };
    delete cleanData._id;
    delete cleanData.deletedAt;
    delete cleanData.sku;

    const existing = await repository.findByIdWithDeleted(id);

    if (!existing || existing.deletedAt) {
      throw new AppError('Variante no encontrada', 404, 'VARIANT_NOT_FOUND');
    }

    if (cleanData.color !== undefined) {
      cleanData.color = cleanData.color.trim();
    }

    const skuInputsChanged =
      (cleanData.printId !== undefined && String(cleanData.printId) !== String(existing.printId)) ||
      (cleanData.materialId !== undefined && String(cleanData.materialId) !== String(existing.materialId)) ||
      (cleanData.color !== undefined && cleanData.color !== existing.color);

    if (skuInputsChanged) {
      const print = await this.ensurePrintExists(cleanData.printId ?? existing.printId);
      const material = await this.ensureMaterialExists(cleanData.materialId ?? existing.materialId);
      cleanData.sku = await this.resolveSku(print, material, cleanData.color ?? existing.color);
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

    const newActive = !variant.isActive;
    if (newActive) {
      await this.ensurePrintExists(variant.printId);
      await this.ensureMaterialExists(variant.materialId);
    }

    return repository.setActiveById(id, newActive);
  }

  async softDelete(id) {
    const existing = await repository.findById(id);

    if (!existing) {
      throw new AppError('Variante no encontrada', 404, 'VARIANT_NOT_FOUND');
    }

    const variant = await repository.softDelete(id);

    return { message: 'Variante eliminada correctamente', data: variant };
  }

  async getActive() {
    return attachDependencyIssues(await repository.findByActive(true), DEPENDENCIES);
  }

  async getInactive() {
    return attachDependencyIssues(await repository.findByActive(false), DEPENDENCIES);
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
    const print = await Print.findOne({ _id: printId, deletedAt: null, isActive: true }).lean();

    if (!print) {
      throw new AppError(
        'La impresión asociada no existe, está eliminada o desactivada',
        409,
        'DEPENDENCY_UNAVAILABLE'
      );
    }

    const category = await Category.findOne({
      _id: print.categoryId,
      deletedAt: null,
      isActive: true
    }).select('_id').lean();

    if (!category) {
      throw new AppError(
        'La categoría de la impresión asociada no existe, está eliminada o desactivada',
        409,
        'DEPENDENCY_UNAVAILABLE'
      );
    }

    return print;
  }

  async ensureMaterialExists(materialId) {
    const material = await Material.findOne({ _id: materialId, deletedAt: null, isActive: true }).lean();

    if (!material) {
      throw new AppError(
        'El material asignado no existe, está eliminado o desactivado',
        409,
        'DEPENDENCY_UNAVAILABLE'
      );
    }

    return material;
  }
}

module.exports = new PrintVariantService();
