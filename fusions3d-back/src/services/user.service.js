const { hashPassword } = require('../utils/password.util');
const repository = require('../repositories/user.repository');
const profileRepository = require('../repositories/profile.repository');
const roleRepository = require('../repositories/role.repository');
const { AppError } = require('../utils/app.error');
const { ADMIN_ROLE_NAME } = require('../utils/role.util');

const DEFAULT_ROLE_NAME = 'USER';

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
    const { password, role, ...userData } = data;
    const assignedRole = await this.resolveAssignableRole(role);
    const passwordHash = await hashPassword(password);
    const user = await repository.create({ ...userData, role: assignedRole._id, passwordHash });

    try {
      await profileRepository.ensureForUser(user._id, user.email.split('@')[0]);
    } catch (error) {
      await repository.deleteById(user._id);
      throw error;
    }

    return this.withoutPassword(user);
  }

  async update(id, body, requesterId) {
    const cleanData = { ...body };
    delete cleanData._id;
    delete cleanData.createdAt;
    delete cleanData.deletedAt;

    if (cleanData.role !== undefined) {
      await this.ensureRoleChangeAllowed(id, cleanData.role, requesterId);
    }

    if (cleanData.password) {
      cleanData.passwordHash = await hashPassword(cleanData.password);
      delete cleanData.password;
    }

    cleanData.updatedAt = new Date();

    const user = await repository.updateById(id, cleanData);

    if (!user) {
      throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
    }

    return user;
  }

  async updateRole(id, role, requesterId) {
    await this.ensureRoleChangeAllowed(id, role, requesterId);

    const user = await repository.updateById(id, { role, updatedAt: new Date() });
    if (!user) {
      throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
    }
    return user;
  }

  async setActive(id, requesterId) {
    const user = await repository.findByIdWithDeleted(id);

    if (!user) {
      throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
    }

    if (user.deletedAt) {
      throw new AppError('No se puede activar un usuario eliminado', 400, 'USER_DELETED');
    }

    if (user.isActive) {
      this.assertNotSelf(id, requesterId);
      await this.ensureAnotherActiveAdmin(user);
    }

    return repository.setActiveById(id, !user.isActive);
  }

  async softDelete(id, requesterId) {
    const existing = await repository.findById(id);

    if (!existing) {
      throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
    }

    if (existing.deletedAt) {
      throw new AppError('El usuario ya está eliminado', 409, 'ALREADY_DELETED');
    }

    this.assertNotSelf(id, requesterId);
    await this.ensureAnotherActiveAdmin(existing);

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

  assertNotSelf(targetId, requesterId) {
    if (String(targetId) === String(requesterId)) {
      throw new AppError(
        'No puedes realizar esta operación sobre tu propia cuenta',
        403,
        'SELF_MODIFICATION_FORBIDDEN'
      );
    }
  }

  async ensureAnotherActiveAdmin(user) {
    if (!user.isActive || user.deletedAt || !(await this.isAdminRole(user.role))) {
      return;
    }

    const activeAdmins = await repository.countActiveAdmins();
    if (activeAdmins <= 1) {
      throw new AppError('Debe existir al menos un administrador activo', 409, 'LAST_ADMIN');
    }
  }

  async ensureRoleChangeAllowed(id, roleId, requesterId) {
    const user = await repository.findById(id);

    if (!user) {
      throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
    }

    const role = await this.resolveAssignableRole(roleId);

    if (role.name === ADMIN_ROLE_NAME) {
      return;
    }

    this.assertNotSelf(id, requesterId);
    await this.ensureAnotherActiveAdmin(user);
  }

  async resolveAssignableRole(roleId) {
    const id = roleId ?? (await roleRepository.findByName(DEFAULT_ROLE_NAME))?._id;
    const role = id ? await roleRepository.findAssignableById(id) : null;

    if (!role) {
      throw new AppError(
        'El rol asignado no existe o está desactivado',
        409,
        'DEPENDENCY_UNAVAILABLE'
      );
    }

    return role;
  }

  async isAdminRole(roleId) {
    const role = await roleRepository.findAssignableById(roleId);
    return role?.name === ADMIN_ROLE_NAME;
  }

  withoutPassword(user) {
    if (!user) {
      return user;
    }

    const obj = typeof user.toObject === 'function' ? user.toObject() : user;
    const { password, passwordHash, ...rest } = obj;
    return rest;
  }
}

module.exports = new UserService();
