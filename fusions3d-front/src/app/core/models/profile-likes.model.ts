import { ShopImage } from './shop.model';

/** Variante que el usuario ha marcado con me gusta, tal y como la devuelve `/api/profiles/likes`. */
export interface ProfileLikeItem {
  likedAt: string;
  variantSlug: string;
  sku: string;
  color: string;
  colorHex: string | null;
  salePrice: number;
  likesCount: number;
  materialName: string | null;
  printName: string;
  printSlug: string;
  cover: ShopImage | null;
}

export interface ProfileLikesMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProfileLikesResponse {
  items: ProfileLikeItem[];
  meta: ProfileLikesMeta;
}
