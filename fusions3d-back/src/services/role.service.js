const repository = require('../repositories/role.repository');
const { AppError } = require('../utils/app.error');
const { ADMIN_ROLE_NAME } = require('../utils/role.util');
const dependencyRestriction = require('./dependency-restriction.service');

function assertNotAdminRole(role, action) {
  if (role.name === ADMIN_ROLE_NAME) {
    throw new AppError(`No se puede ${action} el rol ${ADMIN_ROLE_NAME}`, 409, 'ADMIN_ROLE_PROTECTED');
  }
}

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

    const existing = await repository.findById(id);

    if (!existing) {
      throw new AppError('Rol no encontrado', 404, 'ROLE_NOT_FOUND');
    }

    if (cleanData.name !== undefined && cleanData.name !== existing.name) {
      assertNotAdminRole(existing, 'renombrar');
    }

    const role = await repository.updateById(id, cleanData);

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
      assertNotAdminRole(role, 'desactivar');
      await dependencyRestriction.assertRoleHasNoUsers(id);
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

    assertNotAdminRole(existing, 'eliminar');
    await dependencyRestriction.assertRoleHasNoUsers(id);
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
