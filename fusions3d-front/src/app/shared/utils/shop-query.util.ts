import { Params } from '@angular/router';
import { ShopCatalogQuery, ShopSort } from '../../core/models/shop.model';

export const SHOP_LIMIT = 12;
const SHOP_SORTS: readonly ShopSort[] = ['relevance', 'price_asc', 'price_desc', 'name', 'newest'];

/** Orden por defecto: relevancia si hay búsqueda, novedades si no. */
export function defaultSort(q: string): ShopSort {
  return q ? 'relevance' : 'newest';
}

export function emptyShopQuery(): ShopCatalogQuery {
  return {
    q: '',
    category: [],
    material: [],
    color: [],
    minPrice: null,
    maxPrice: null,
    sort: 'newest',
    page: 1,
    limit: SHOP_LIMIT,
  };
}

/** Convierte los query params de la URL en un ShopCatalogQuery válido. */
export function parseShopQuery(params: Params): ShopCatalogQuery {
  const q = readString(params['q']).slice(0, 100);
  const sortParam = readString(params['sort']) as ShopSort;
  const sort = SHOP_SORTS.includes(sortParam) ? sortParam : defaultSort(q);

  return {
    q,
    category: readList(params['category']),
    material: readList(params['material']),
    color: readList(params['color']),
    minPrice: readPrice(params['minPrice']),
    maxPrice: readPrice(params['maxPrice']),
    sort: sort === 'relevance' && !q ? 'newest' : sort,
    page: readPositiveInt(params['page'], 1),
    limit: SHOP_LIMIT,
  };
}

/** Convierte el estado del catálogo en query params. Omite lo que está en su valor por defecto. */
export function toShopParams(query: ShopCatalogQuery): Record<string, string> {
  const params: Record<string, string> = {};

  if (query.q) params['q'] = query.q;
  if (query.category.length) params['category'] = query.category.join(',');
  if (query.material.length) params['material'] = query.material.join(',');
  if (query.color.length) params['color'] = query.color.join(',');
  if (query.minPrice !== null) params['minPrice'] = String(query.minPrice);
  if (query.maxPrice !== null) params['maxPrice'] = String(query.maxPrice);
  if (query.sort !== defaultSort(query.q)) params['sort'] = query.sort;
  if (query.page > 1) params['page'] = String(query.page);

  return params;
}

/**
 * Query params para una búsqueda desde cualquier página de la tienda.
 * Conserva los filtros del estado actual y vuelve a la primera página.
 */
export function searchQueryParams(base: ShopCatalogQuery, q: string): Record<string, string> {
  // Si el orden era el de por defecto, la búsqueda usa el orden por defecto de su nuevo texto (relevancia si hay texto).
  const sort = base.sort === defaultSort(base.q) ? defaultSort(q) : base.sort;
  return toShopParams({ ...base, q, sort, page: 1 });
}

function readString(value: unknown): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === 'string' ? raw.trim() : '';
}

function readList(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : [value];
  const items = raw
    .filter((item): item is string => typeof item === 'string')
    .flatMap((item) => item.split(','))
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(items)];
}

function readPrice(value: unknown): number | null {
  const text = readString(value);
  if (text === '') return null;

  const price = Number(text);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

function readPositiveInt(value: unknown, fallback: number): number {
  const number = Number(readString(value));
  return Number.isInteger(number) && number >= 1 ? number : fallback;
}
