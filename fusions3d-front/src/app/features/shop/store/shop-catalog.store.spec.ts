import { TestBed } from '@angular/core/testing';
import { ShopCatalogQuery, ShopPrintCard, ShopPrintsPage } from '../../../core/models/shop.model';
import { ShopService } from '../../../core/services/shop.service';
import { emptyShopQuery } from '../../../shared/utils/shop-query.util';
import { ShopCatalogStore } from './shop-catalog.store';

interface PendingCall {
  query: ShopCatalogQuery;
  signal: AbortSignal | undefined;
  resolve: (page: ShopPrintsPage) => void;
  reject: (error: unknown) => void;
}

function print(slug: string): ShopPrintCard {
  return {
    _id: slug,
    name: slug,
    slug,
    minPrice: 10,
    maxPrice: 10,
    materials: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    categoryName: '',
    categorySlug: '',
    cover: null,
  };
}

function page(...slugs: string[]): ShopPrintsPage {
  return { data: slugs.map(print), meta: { total: slugs.length, page: 1, limit: 12, totalPages: 1 } };
}

/** Simula el servicio: cada llamada queda pendiente hasta que el test decide su resultado. */
class FakeShopService {
  readonly calls: PendingCall[] = [];

  getPrints(query: ShopCatalogQuery, signal?: AbortSignal): Promise<ShopPrintsPage> {
    return new Promise<ShopPrintsPage>((resolve, reject) => {
      const call: PendingCall = { query, signal, resolve, reject };
      this.calls.push(call);

      signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    });
  }

  getFilters(): Promise<never> {
    return new Promise(() => undefined);
  }
}

describe('ShopCatalogStore', () => {
  let service: FakeShopService;
  let store: ShopCatalogStore;

  beforeEach(() => {
    service = new FakeShopService();

    TestBed.configureTestingModule({
      providers: [ShopCatalogStore, { provide: ShopService, useValue: service }],
    });

    store = TestBed.inject(ShopCatalogStore);
  });

  it('cancela la petición anterior cuando llega una nueva', async () => {
    const first = store.loadPrints({ ...emptyShopQuery(), q: 'so' });
    const second = store.loadPrints({ ...emptyShopQuery(), q: 'soporte' });

    expect(service.calls[0].signal?.aborted).toBeTrue();
    expect(service.calls[1].signal?.aborted).toBeFalse();

    service.calls[1].resolve(page('soporte-para-movil'));
    await Promise.all([first, second]);

    expect(store.prints().map((item) => item.slug)).toEqual(['soporte-para-movil']);
  });

  it('una respuesta antigua que llega tarde no sobrescribe la última', async () => {
    const first = store.loadPrints({ ...emptyShopQuery(), category: ['figuras'] });
    const second = store.loadPrints({ ...emptyShopQuery(), category: ['hogar'] });

    service.calls[1].resolve(page('maceta'));
    await second;

    service.calls[0].resolve(page('figura-dragon'));
    await first;

    expect(store.prints().map((item) => item.slug)).toEqual(['maceta']);
    expect(store.loading()).toBeFalse();
  });

  it('una cancelación no se muestra como error', async () => {
    const first = store.loadPrints(emptyShopQuery());
    const second = store.loadPrints({ ...emptyShopQuery(), q: 'x' });

    await first;
    expect(store.error()).toBeNull();

    service.calls[1].resolve(page());
    await second;
    expect(store.isEmpty()).toBeTrue();
  });

  it('muestra un error de red y lo limpia en el siguiente intento', async () => {
    const failing = store.loadPrints(emptyShopQuery());
    service.calls[0].reject(new TypeError('Failed to fetch'));
    await failing;

    expect(store.error()).toContain('No se puede conectar');

    const retry = store.loadPrints(emptyShopQuery());
    expect(store.error()).toBeNull();

    service.calls[1].resolve(page('soporte-para-movil'));
    await retry;
    expect(store.prints().length).toBe(1);
  });
});
