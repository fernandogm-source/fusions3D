const { ADMIN_ROLE_NAME } = require('./role.util');

function isOwnerOrAdmin(user, resource) {
  if (!user || !resource?.userId) {
    return false;
  }

  if (user.role === ADMIN_ROLE_NAME) {
    return true;
  }

  return String(user.id).toLowerCase() === String(resource.userId).toLowerCase();
}

module.exports = { isOwnerOrAdmin };
