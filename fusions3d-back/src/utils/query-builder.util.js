const mongoose = require('mongoose');

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

const FILTERS = {
  category: { target: 'print', field: 'categoryId', operator: 'in', cast: toObjectId },
  material: { target: 'variant', field: 'materialId', operator: 'in', cast: toObjectId },
  color: { target: 'variant', field: 'colorSlug', operator: 'in' },
  price: { target: 'variant', field: 'salePrice', operator: 'range' }
};

const SORTS = {
  relevance: { score: -1, _id: 1 },
  price_asc: { minPrice: 1, _id: 1 },
  price_desc: { minPrice: -1, _id: -1 },
  name: { name: 1, _id: 1 },
  newest: { createdAt: -1, _id: -1 }
};

function buildCondition(name, definition, params) {
  if (definition.operator === 'in') {
    const values = params[name];
    if (!values) return null;
    return { $in: definition.cast ? values.map(definition.cast) : values };
  }

  const range = {};
  if (params.minPrice !== undefined) range.$gte = params.minPrice;
  if (params.maxPrice !== undefined) range.$lte = params.maxPrice;
  return Object.keys(range).length > 0 ? range : null;
}

function buildMatch(target, params) {
  const match = {};

  for (const [name, definition] of Object.entries(FILTERS)) {
    if (definition.target !== target) continue;

    const condition = buildCondition(name, definition, params);
    if (condition) match[definition.field] = condition;
  }

  return match;
}

function buildSort(sort, hasQuery) {
  const key = sort ?? (hasQuery ? 'relevance' : 'newest');
  if (key === 'relevance' && !hasQuery) return SORTS.newest;
  return SORTS[key] ?? SORTS.newest;
}

module.exports = { buildMatch, buildSort };
