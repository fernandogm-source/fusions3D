const PrintVariant = require('../models/printVariant.model');
const Print = require('../models/print.model');
const Material = require('../models/material.model');
const { buildSkuBase, generateSku } = require('../utils/sku.util');
const { toSlug, generateUniqueSlug } = require('../utils/slug.util');

/**
 * Calcula el sku y el slug de una variante. Ambos se derivan de la impresión, el material y el color,
 * y se regeneran cuando cambian esos datos. El slug es `<slug-impresión>-<slug-material>-<slug-color>`.
 */
async function build({ print, material, color, excludeId }) {
  const sku = await generateSku(buildSkuBase(print.name, material.name, color), PrintVariant, excludeId);
  const slug = await generateUniqueSlug(
    `${print.slug}-${material.slug}-${toSlug(color)}`,
    PrintVariant,
    excludeId
  );

  return { sku, slug };
}

async function refreshVariants(variants) {
  for (const variant of variants) {
    const [print, material] = await Promise.all([
      Print.findById(variant.printId).lean(),
      Material.findById(variant.materialId).lean()
    ]);

    if (!print || !material) continue;

    const identifiers = await build({ print, material, color: variant.color, excludeId: variant._id });
    await PrintVariant.updateOne({ _id: variant._id }, identifiers);
  }
}

async function refreshForPrint(printId) {
  await refreshVariants(await PrintVariant.find({ printId }).lean());
}

async function refreshForMaterial(materialId) {
  await refreshVariants(await PrintVariant.find({ materialId }).lean());
}

module.exports = { build, refreshForPrint, refreshForMaterial };
