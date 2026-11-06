import { ShopPriceRange } from '../../core/models/shop.model';

export interface PriceRange {
  min: number;
  max: number;
}

/**
 * Ajusta un rango a los límites del catálogo: recorta valores fuera de rango
 * y ordena min y max si llegan invertidos.
 */
export function clampPriceRange(min: number, max: number, bounds: ShopPriceRange): PriceRange {
  const low = Math.min(Math.max(min, bounds.min), bounds.max);
  const high = Math.min(Math.max(max, bounds.min), bounds.max);
  return low <= high ? { min: low, max: high } : { min: high, max: low };
}

/**
 * Devuelve los valores que deben ir en la URL: `null` si el rango cubre
 * todo el catálogo (equivale a no filtrar por precio).
 */
export function toPriceFilter(
  range: PriceRange,
  bounds: ShopPriceRange,
): { minPrice: number | null; maxPrice: number | null } {
  const clamped = clampPriceRange(range.min, range.max, bounds);
  return {
    minPrice: clamped.min > bounds.min ? clamped.min : null,
    maxPrice: clamped.max < bounds.max ? clamped.max : null,
  };
}
