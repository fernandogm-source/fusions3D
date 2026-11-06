import { emptyShopQuery, parseShopQuery, searchQueryParams, toShopParams } from './shop-query.util';

describe('shop-query util', () => {
  it('buscar conserva los filtros activos y vuelve a la primera página', () => {
    const params = searchQueryParams(
      { ...emptyShopQuery(), category: ['figuras'], color: ['negro'], page: 3 },
      'dragón',
    );

    expect(params).toEqual({ q: 'dragón', category: 'figuras', color: 'negro' });
  });

  it('buscar mantiene el orden que el usuario eligió', () => {
    const params = searchQueryParams({ ...emptyShopQuery(), sort: 'price_asc' }, 'soporte');

    expect(params).toEqual({ q: 'soporte', sort: 'price_asc' });
  });

  it('buscar desde otra página empieza un catálogo limpio', () => {
    expect(searchQueryParams(emptyShopQuery(), 'soporte')).toEqual({ q: 'soporte' });
  });

  it('parsea una URL vacía con valores por defecto', () => {
    const query = parseShopQuery({});

    expect(query).toEqual(emptyShopQuery());
  });

  it('acepta slugs separados por coma y repetidos, sin duplicados', () => {
    const query = parseShopQuery({ category: 'figuras,hogar', material: ['pla', 'pla,petg'] });

    expect(query.category).toEqual(['figuras', 'hogar']);
    expect(query.material).toEqual(['pla', 'petg']);
  });

  it('descarta precios no válidos y negativos', () => {
    const query = parseShopQuery({ minPrice: 'abc', maxPrice: '-5' });

    expect(query.minPrice).toBeNull();
    expect(query.maxPrice).toBeNull();
  });

  it('usa relevancia solo cuando hay búsqueda', () => {
    expect(parseShopQuery({ q: 'soporte' }).sort).toBe('relevance');
    expect(parseShopQuery({ q: '', sort: 'relevance' }).sort).toBe('newest');
  });

  it('ignora un orden desconocido', () => {
    expect(parseShopQuery({ sort: 'inventado' }).sort).toBe('newest');
  });

  it('serializa solo lo que difiere del valor por defecto', () => {
    const params = toShopParams({
      ...emptyShopQuery(),
      category: ['figuras'],
      color: ['negro', 'azul'],
      minPrice: 5,
      page: 3,
    });

    expect(params).toEqual({
      category: 'figuras',
      color: 'negro,azul',
      minPrice: '5',
      page: '3',
    });
  });

  it('round-trip: parsear lo que se serializa devuelve el mismo estado', () => {
    const original = {
      ...emptyShopQuery(),
      q: 'soporte',
      material: ['pla', 'petg'],
      maxPrice: 20,
      sort: 'price_asc' as const,
      page: 2,
    };

    expect(parseShopQuery(toShopParams(original))).toEqual(original);
  });
});
