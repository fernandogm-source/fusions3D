const repository = require('../repositories/shop.repository');
const { AppError } = require('../utils/app.error');
const { buildMatch, buildSort } = require('../utils/query-builder.util');
const { tokenize, buildSearchMatch } = require('../utils/search.util');

const HOME_LATEST_LIMIT = 12;

const byName = (a, b) => a.name.localeCompare(b.name);

class ShopService {
  async getPrints(query) {
    const { q, sort, page, limit, ...params } = query;
    const tokens = tokenize(q);
    const hasQuery = tokens.length > 0;
    const filters = await this.resolveSlugFilters(params);

    if (!filters) {
      return this.emptyResult(page, limit);
    }

    const printMatch = {
      status: 'published',
      isActive: true,
      deletedAt: null,
      ...(hasQuery && buildSearchMatch(tokens)),
      ...buildMatch('print', filters)
    };

    const { items, total } = await repository.findPrints({
      printMatch,
      variantMatch: buildMatch('variant', filters),
      sort: buildSort(sort, hasQuery),
      relevanceToken: hasQuery ? tokens[0] : null,
      skip: (page - 1) * limit,
      limit
    });

    return this.paginate(items, total, page, limit);
  }

  /**
   * Convierte los slugs de categoría y material en IDs.
   * Devuelve null si algún filtro pedido no existe, porque el resultado es vacío.
   */
  async resolveSlugFilters({ category, material, ...rest }) {
    const resolved = { ...rest };

    if (category) {
      const ids = await repository.findPublishedCategoryIdsBySlugs(category);
      if (ids.length === 0) return null;
      resolved.category = ids;
    }

    if (material) {
      const ids = await repository.findActiveMaterialIdsBySlugs(material);
      if (ids.length === 0) return null;
      resolved.material = ids;
    }

    return resolved;
  }

  emptyResult(page, limit) {
    return this.paginate([], 0, page, limit);
  }

  paginate(items, total, page, limit) {
    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getPrintBySlug(slug) {
    const print = await repository.findPublishedBySlug(slug);

    if (!print || !print.categoryId) {
      throw new AppError('Impresión no encontrada', 404, 'PRINT_NOT_FOUND');
    }

    const variants = (await repository.findActiveVariantsByPrintId(print._id))
      .filter((variant) => variant.materialId);

    if (variants.length === 0) {
      throw new AppError('Impresión no encontrada', 404, 'PRINT_NOT_FOUND');
    }

    const prices = variants.map((variant) => variant.salePrice);

    return {
      ...print,
      variants,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices)
    };
  }

  async getCategories() {
    const counts = await repository.countPublishedPrintsByCategory();
    const ids = counts.map((row) => row._id);

    const [categories, images] = await Promise.all([
      repository.findPublishedCategoriesByIds(ids),
      repository.findCategoryImages(ids)
    ]);

    const countById = new Map(counts.map((row) => [String(row._id), row.count]));
    const coverById = new Map();

    for (const image of images) {
      const key = String(image.entityId);
      if (!coverById.has(key)) coverById.set(key, image);
    }

    return categories
      .map((category) => {
        const cover = coverById.get(String(category._id));

        return {
          _id: category._id,
          name: category.name,
          slug: category.slug,
          count: countById.get(String(category._id)) ?? 0,
          image: cover ? { imageUrl: cover.imageUrl, altText: cover.altText } : null
        };
      })
      .sort(byName);
  }

  async getMaterials() {
    const counts = await repository.countPublishedVariantsByMaterial();
    const materials = await repository.findActiveMaterialsByIds(counts.map((row) => row._id));
    const countById = new Map(counts.map((row) => [String(row._id), row.count]));

    return materials
      .map((material) => ({
        _id: material._id,
        name: material.name,
        slug: material.slug,
        count: countById.get(String(material._id)) ?? 0
      }))
      .sort(byName);
  }

  async getColors() {
    const counts = await repository.countPublishedVariantsByColor();

    return counts
      .map((row) => ({ slug: row._id, name: row.name, hex: row.hex ?? null, count: row.count }))
      .sort(byName);
  }

  async getFilters() {
    const [categories, materials, colors, priceRange] = await Promise.all([
      this.getCategories(),
      this.getMaterials(),
      this.getColors(),
      repository.findPublishedPriceRange()
    ]);

    return { categories, materials, colors, priceRange };
  }

  async getHome() {
    const [categories, materials, colors, latest] = await Promise.all([
      this.getCategories(),
      this.getMaterials(),
      this.getColors(),
      this.getPrints({ sort: 'newest', page: 1, limit: HOME_LATEST_LIMIT })
    ]);

    return {
      categories,
      materials,
      colors,
      latestPrints: latest.data
    };
  }
}

module.exports = new ShopService();
