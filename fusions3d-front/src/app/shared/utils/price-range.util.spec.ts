import { clampPriceRange, toPriceFilter } from './price-range.util';

describe('price-range util', () => {
  const bounds = { min: 5, max: 50 };

  it('recorta valores fuera del catálogo', () => {
    expect(clampPriceRange(0, 100, bounds)).toEqual({ min: 5, max: 50 });
  });

  it('ordena min y max si llegan invertidos', () => {
    expect(clampPriceRange(30, 10, bounds)).toEqual({ min: 10, max: 30 });
  });

  it('no envía filtro cuando el rango cubre todo el catálogo', () => {
    expect(toPriceFilter({ min: 5, max: 50 }, bounds)).toEqual({ minPrice: null, maxPrice: null });
  });

  it('envía solo el límite que restringe', () => {
    expect(toPriceFilter({ min: 12, max: 50 }, bounds)).toEqual({ minPrice: 12, maxPrice: null });
    expect(toPriceFilter({ min: 5, max: 20 }, bounds)).toEqual({ minPrice: null, maxPrice: 20 });
  });
});
