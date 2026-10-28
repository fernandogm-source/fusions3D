const Print = require('../models/print.model');
const PrintVariant = require('../models/printVariant.model');
const User = require('../models/user.model');
const { AppError } = require('../utils/app.error');

class DependencyRestrictionService {
  async assertCategoryHasNoPrints(categoryId) {
    const count = await Print.countDocuments({ categoryId });
    this.assertNoDependents('la categoría', 'impresión asociada', 'impresiones asociadas', count);
  }

  async assertPrintHasNoVariants(printId) {
    const count = await PrintVariant.countDocuments({ printId });
    this.assertNoDependents('la impresión', 'variante asociada', 'variantes asociadas', count);
  }

  async assertMaterialHasNoVariants(materialId) {
    const count = await PrintVariant.countDocuments({ materialId });
    this.assertNoDependents('el material', 'variante asociada', 'variantes asociadas', count);
  }

  async assertRoleHasNoUsers(roleId) {
    const count = await User.countDocuments({ role: roleId });
    this.assertNoDependents('el rol', 'usuario asignado', 'usuarios asignados', count);
  }

  assertNoDependents(parentName, dependentSingular, dependentPlural, count) {
    if (count === 0) {
      return;
    }

    const dependentName = count === 1 ? dependentSingular : dependentPlural;
    throw new AppError(
      `No se puede desactivar o eliminar lógicamente ${parentName}: tiene ${count} ${dependentName}. Reasigna o quita esas referencias primero; si el dependiente está en la papelera, restáuralo antes de cambiar la referencia.`,
      409,
      'DEPENDENTS_EXIST'
    );
  }
}

module.exports = new DependencyRestrictionService();
