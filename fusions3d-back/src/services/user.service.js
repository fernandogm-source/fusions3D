const bcrypt = require('bcryptjs');
const repository = require('../repositories/user.repository');
const Role = require('../models/role.model');
const { AppError } = require('../utils/app.error');

const SALT_ROUNDS = 10;

class UserService {
  async getAll() {
    return repository.findAll();
  }

  async getSoftDeleted() {
    return repository.findSoftDeleted();
  }

  async getById(id) {
    const user = await repository.findById(id);

    if (!user) {
      throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
    }

    return user;
  }

  async create(data) {
    await this.ensureRolesExist(data.roles);

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    const user = await repository.create({ ...data, password: hashedPassword });

    return this.withoutPassword(user);
  }

  async update(id, body) {
    const cleanData = { ...body };
    delete cleanData._id;
    delete cleanData.createdAt;
    delete cleanData.deletedAt;

    if (cleanData.roles) {
      await this.ensureRolesExist(cleanData.roles);
    }

    if (cleanData.password) {
      cleanData.password = await bcrypt.hash(cleanData.password, SALT_ROUNDS);
    }

    cleanData.updatedAt = new Date();

    const user = await repository.updateById(id, cleanData);

    if (!user) {
      throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
    }

    return user;
  }

  async updateRoles(id, roles) {
    const user = await repository.findById(id);

    if (!user) {
      throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
    }

    await this.ensureRolesExist(roles);

    return repository.updateById(id, { roles, updatedAt: new Date() });
  }

  async setActive(id) {
    const user = await repository.findByIdWithDeleted(id);

    if (!user) {
      throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
    }

    if (user.deletedAt) {
      throw new AppError('No se puede activar un usuario eliminado', 400, 'USER_DELETED');
    }

    return repository.setActiveById(id, !user.isActive);
  }

  async softDelete(id) {
    const existing = await repository.findById(id);

    if (!existing) {
      throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
    }

    if (existing.deletedAt) {
      throw new AppError('El usuario ya está eliminado', 409, 'ALREADY_DELETED');
    }

    const user = await repository.softDelete(id);

    return { message: 'Usuario eliminado correctamente', data: user };
  }

  async getActive() {
    return repository.findByActive(true);
  }

  async getInactive() {
    return repository.findByActive(false);
  }

  async restore(id) {
    const user = await repository.findByIdWithDeleted(id);

    if (!user) {
      throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
    }

    if (!user.deletedAt) {
      throw new AppError('El usuario no está eliminado', 400, 'NOT_DELETED');
    }

    const restored = await repository.restoreById(id);

    return { message: 'Usuario restaurado correctamente', data: restored };
  }

  withoutPassword(user) {
    if (!user) {
      return user;
    }

    const obj = typeof user.toObject === 'function' ? user.toObject() : user;
    const { password, ...rest } = obj;
    return rest;
  }

  async ensureRolesExist(roles) {
    if (!roles || roles.length === 0) {
      return;
    }

    const uniqueRoles = [...new Set(roles)];
    const count = await Role.countDocuments({ _id: { $in: uniqueRoles }, deletedAt: null });

    if (count !== uniqueRoles.length) {
      throw new AppError('Uno o más roles no existen', 400, 'ROLE_NOT_FOUND');
    }
  }
}

module.exports = new UserService();
