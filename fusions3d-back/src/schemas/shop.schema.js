const { z } = require('zod');

const SORT_OPTIONS = ['relevance', 'price_asc', 'price_desc', 'name', 'newest'];
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const listParam = (itemSchema, maxItems) => z.preprocess((value) => {
  if (value === undefined || value === '') return undefined;

  const items = (Array.isArray(value) ? value : [value])
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? [...new Set(items)] : undefined;
}, z.array(itemSchema).max(maxItems).optional());

const numberParam = (schema) => z.preprocess(
  (value) => (value === undefined || value === '' ? undefined : Number(value)),
  schema
);

const slugItem = z.string().trim().toLowerCase().regex(SLUG_REGEX, 'Slug inválido').max(100);

const slugList = listParam(slugItem, 20);
const priceParam = numberParam(z.number().min(0).optional());
const pageParam = numberParam(z.number().int().min(1).max(1000).default(1));
const limitParam = numberParam(z.number().int().min(1).max(48).default(12));

const printsQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: slugList,
  material: slugList,
  color: slugList,
  minPrice: priceParam,
  maxPrice: priceParam,
  sort: z.enum(SORT_OPTIONS).optional(),
  page: pageParam,
  limit: limitParam
}).refine(
  ({ minPrice, maxPrice }) => minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
  { message: 'minPrice no puede ser mayor que maxPrice', path: ['minPrice'] }
);

module.exports = { printsQuerySchema };
