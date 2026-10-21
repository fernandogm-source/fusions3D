const Print = require('../models/print.model');
const PrintVariant = require('../models/printVariant.model');
const User = require('../models/user.model');

class DependencyCascadeService {
  async deactivateCategoryDependents(categoryId) {
    const prints = await Print.find({ categoryId }).select('_id').lean();
    const printIds = prints.map((print) => print._id);
    const updatedAt = new Date();

    await Print.updateMany({ categoryId }, { $set: { isActive: false, updatedAt } });
    await PrintVariant.updateMany({ printId: { $in: printIds } }, { $set: { isActive: false } });
  }

  async deactivatePrintDependents(printId) {
    await PrintVariant.updateMany({ printId }, { $set: { isActive: false } });
  }

  async deactivateMaterialDependents(materialId) {
    await PrintVariant.updateMany({ materialId }, { $set: { isActive: false } });
  }

  async deactivateRoleDependents(roleId) {
    await User.updateMany(
      { roles: roleId },
      { $set: { isActive: false, updatedAt: new Date() } }
    );
  }
}

module.exports = new DependencyCascadeService();
