import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ShopPrintDetail, ShopVariant } from '../../../core/models/shop.model';
import { ShopService } from '../../../core/services/shop.service';
import { VariantLikesService } from '../../../core/services/variant-likes.service';
import { AuthStore } from '../../../core/store/auth.store';
import { ShopPrintStore } from './shop-print.store';

function variant(id: string, likesCount: number): ShopVariant {
  return {
    _id: id,
    slug: id,
    sku: id,
    color: 'Negro',
    colorSlug: 'negro',
    colorHex: null,
    salePrice: 10,
    printTime: 60,
    likesCount,
    ratingAverage: 0,
    ratingCount: 0,
    materialId: null,
  };
}

function print(...variants: ShopVariant[]): ShopPrintDetail {
  return {
    _id: 'print-1',
    name: 'Soporte',
    slug: 'soporte',
    description: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    categoryId: null,
    images: [],
    variants,
    minPrice: 10,
    maxPrice: 10,
  };
}

describe('ShopPrintStore (likes por variante)', () => {
  let store: ShopPrintStore;
  let authenticated: boolean;
  let likeResult: () => Promise<{ liked: boolean; likesCount: number }>;
  let unlikeResult: () => Promise<{ liked: boolean; likesCount: number }>;
  let likeCalls: string[];
  let router: Router;

  beforeEach(() => {
    authenticated = true;
    likeCalls = [];
    likeResult = () => Promise.resolve({ liked: true, likesCount: 4 });
    unlikeResult = () => Promise.resolve({ liked: false, likesCount: 2 });

    const shop = {
      getPrintBySlug: () => Promise.resolve(print(variant('v1', 3), variant('v2', 0))),
    };
    const likes = {
      getStatus: () => Promise.resolve({ liked: false }),
      like: (id: string) => {
        likeCalls.push(`like:${id}`);
        return likeResult();
      },
      unlike: (id: string) => {
        likeCalls.push(`unlike:${id}`);
        return unlikeResult();
      },
    };
    const auth = {
      restoreSession: () => Promise.resolve(),
      isAuthenticated: () => authenticated,
    };

    TestBed.configureTestingModule({
      providers: [
        ShopPrintStore,
        { provide: ShopService, useValue: shop },
        { provide: VariantLikesService, useValue: likes },
        { provide: AuthStore, useValue: auth },
      ],
    });

    store = TestBed.inject(ShopPrintStore);
    router = TestBed.inject(Router);
  });

  async function loadPrint(): Promise<void> {
    await store.load('soporte');
  }

  it('selecciona la primera variante por defecto', async () => {
    await loadPrint();

    expect(store.selectedVariant()?._id).toBe('v1');
  });

  it('selecciona la variante indicada en la URL', async () => {
    await store.load('soporte', 'v2');

    expect(store.selectedVariant()?._id).toBe('v2');
  });

  it('si la variante de la URL no existe, selecciona la primera', async () => {
    await store.load('soporte', 'no-existe');

    expect(store.selectedVariant()?._id).toBe('v1');
  });

  it('dar like actualiza el estado y usa el recuento del servidor', async () => {
    await loadPrint();

    await store.toggleLike();

    expect(likeCalls).toEqual(['like:v1']);
    expect(store.selectedLiked()).toBe(true);
    expect(store.selectedVariant()?.likesCount).toBe(4);
  });

  it('quitar like llama a unlike sobre la variante seleccionada', async () => {
    await loadPrint();
    await store.toggleLike();

    await store.toggleLike();

    expect(likeCalls).toEqual(['like:v1', 'unlike:v1']);
    expect(store.selectedLiked()).toBe(false);
    expect(store.selectedVariant()?.likesCount).toBe(2);
  });

  it('el like afecta solo a la variante seleccionada', async () => {
    await loadPrint();
    store.selectVariant('v2');

    await store.toggleLike();

    expect(likeCalls).toEqual(['like:v2']);
    const v1 = store.print()?.variants.find((item) => item._id === 'v1');
    expect(v1?.likesCount).toBe(3);
  });

  it('revierte la actualización optimista si la petición falla', async () => {
    await loadPrint();
    likeResult = () => Promise.reject(new Error('sin conexión'));

    await store.toggleLike();

    expect(store.selectedLiked()).toBe(false);
    expect(store.selectedVariant()?.likesCount).toBe(3);
    expect(store.likePending()).toBe(false);
  });

  it('un usuario anónimo es redirigido al login con returnUrl', async () => {
    await loadPrint();
    authenticated = false;
    const navigate = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    await store.toggleLike();

    expect(likeCalls).toEqual([]);
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/shop/soporte' } });
  });
});
