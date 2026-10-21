const repository = require('../repositories/role.repository');
const { AppError } = require('../utils/app.error');
const dependencyCascade = require('./dependency-cascade.service');

class RoleService {
  async getAll() {
    return repository.findAll();
  }

  async getSoftDeleted() {
    return repository.findSoftDeleted();
  }

  async getById(id) {
    const role = await repository.findById(id);

    if (!role) {
      throw new AppError('Rol no encontrado', 404, 'ROLE_NOT_FOUND');
    }

    return role;
  }

  async create(data) {
    return repository.create(data);
  }

  async update(id, body) {
    const cleanData = { ...body };
    delete cleanData._id;
    delete cleanData.deletedAt;

    const role = await repository.updateById(id, cleanData);

    if (!role) {
      throw new AppError('Rol no encontrado', 404, 'ROLE_NOT_FOUND');
    }

    return role;
  }

  async setActive(id) {
    const role = await repository.findByIdWithDeleted(id);

    if (!role) {
      throw new AppError('Rol no encontrado', 404, 'ROLE_NOT_FOUND');
    }

    if (role.deletedAt) {
      throw new AppError('No se puede activar un rol eliminado', 400, 'ROLE_DELETED');
    }

    const newActive = !role.isActive;
    if (!newActive) {
      await dependencyCascade.deactivateRoleDependents(id);
    }

    return repository.setActiveById(id, newActive);
  }

  async softDelete(id) {
    const existing = await repository.findById(id);

    if (!existing) {
      throw new AppError('Rol no encontrado', 404, 'ROLE_NOT_FOUND');
    }

    if (existing.deletedAt) {
      throw new AppError('El rol ya está eliminado', 409, 'ALREADY_DELETED');
    }

    await dependencyCascade.deactivateRoleDependents(id);
    const role = await repository.softDelete(id);

    return { message: 'Rol eliminado correctamente', data: role };
  }

  async getActive() {
    return repository.findByActive(true);
  }

  async getInactive() {
    return repository.findByActive(false);
  }

  async restore(id) {
    const role = await repository.findByIdWithDeleted(id);

    if (!role) {
      throw new AppError('Rol no encontrado', 404, 'ROLE_NOT_FOUND');
    }

    if (!role.deletedAt) {
      throw new AppError('El rol no está eliminado', 400, 'NOT_DELETED');
    }

    const restored = await repository.restoreById(id);

    return { message: 'Rol restaurado correctamente', data: restored };
  }
}

module.exports = new RoleService();
