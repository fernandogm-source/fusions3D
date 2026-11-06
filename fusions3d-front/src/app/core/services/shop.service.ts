import { inject, Injectable } from '@angular/core';
import {
  ShopCatalogQuery,
  ShopFilters,
  ShopHome,
  ShopPageMeta,
  ShopPrintCard,
  ShopPrintDetail,
  ShopPrintsPage,
} from '../models/shop.model';
import { ShopApiClient } from './shop-api.client';
import { toShopParams } from '../../shared/utils/shop-query.util';

interface ShopEnvelope<T> {
  success: true;
  data: T;
  meta?: ShopPageMeta;
}

/** Endpoints públicos de la tienda (`/api/shop`). Todas las llamadas aceptan AbortSignal. */
@Injectable({ providedIn: 'root' })
export class ShopService {
  private readonly client = inject(ShopApiClient);

  async getHome(signal?: AbortSignal): Promise<ShopHome> {
    const body = await this.client.get<ShopEnvelope<ShopHome>>('/home', {}, signal);
    return body.data;
  }

  async getFilters(signal?: AbortSignal): Promise<ShopFilters> {
    const body = await this.client.get<ShopEnvelope<ShopFilters>>('/filters', {}, signal);
    return body.data;
  }

  async getPrints(query: ShopCatalogQuery, signal?: AbortSignal): Promise<ShopPrintsPage> {
    const params = toShopParams(query);
    params['limit'] = String(query.limit);

    const body = await this.client.get<ShopEnvelope<ShopPrintCard[]>>('/prints', params, signal);
    return { data: body.data, meta: body.meta as ShopPageMeta };
  }

  async getPrintBySlug(slug: string, signal?: AbortSignal): Promise<ShopPrintDetail> {
    const body = await this.client.get<ShopEnvelope<ShopPrintDetail>>(
      `/prints/${encodeURIComponent(slug)}`,
      {},
      signal,
    );
    return body.data;
  }
}
