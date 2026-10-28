const profileRepository = require('../repositories/profile.repository');
const userRepository = require('../repositories/auth.repository');
const { isOwnerOrAdmin } = require('../utils/authorization.util');
const { AppError } = require('../utils/app.error');
const { ADMIN_ROLE_NAME } = require('../utils/role.util');

class ProfileService {
  async getProfile(requester, requestedUserId) {
    const user = await this.resolveTargetUser(requester, requestedUserId);
    const profile = await profileRepository.findByUserId(user._id);

    if (!profile) {
      throw new AppError('Perfil no encontrado', 404, 'PROFILE_NOT_FOUND');
    }

    return profile;
  }

  async updateProfile(requester, requestedUserId, data) {
    const user = await this.resolveTargetUser(requester, requestedUserId);
    const fallbackName = user.email.split('@')[0];
    return profileRepository.updateByUserId(user._id, data, fallbackName);
  }

  async resolveTargetUser(requester, requestedUserId) {
    const userId = requestedUserId || requester.id;

    if (!isOwnerOrAdmin(requester, { userId })) {
      throw new AppError(
        'You do not have permission to access this resource',
        403,
        'FORBIDDEN'
      );
    }

    const user = requester.role === ADMIN_ROLE_NAME && requestedUserId
      ? await userRepository.findByIdForProfile(userId)
      : await userRepository.findActiveById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
    }

    return user;
  }
}

module.exports = new ProfileService();
