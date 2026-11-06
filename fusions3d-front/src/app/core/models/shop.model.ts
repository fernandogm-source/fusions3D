/** Modelos de la parte pública (tienda). Reflejan las respuestas de `/api/shop`. */

export type ShopSort = 'relevance' | 'price_asc' | 'price_desc' | 'name' | 'newest';

export interface ShopImage {
  imageUrl: string;
  altText?: string;
}

export interface ShopMaterialRef {
  name: string;
  slug: string;
}

/** Impresión tal y como aparece en listados y carruseles. */
export interface ShopPrintCard {
  _id: string;
  name: string;
  slug: string;
  minPrice: number;
  maxPrice: number;
  materials: ShopMaterialRef[];
  createdAt: string;
  categoryName: string;
  categorySlug: string;
  cover: ShopImage | null;
}

export interface ShopVariant {
  _id: string;
  sku: string;
  color: string;
  colorSlug: string;
  colorHex: string | null;
  salePrice: number;
  printTime: number;
  materialId: { _id: string; name: string; slug: string } | null;
}

/** Detalle de impresión por slug. */
export interface ShopPrintDetail {
  _id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  categoryId: { _id: string; name: string; slug: string } | null;
  images: ShopImage[];
  variants: ShopVariant[];
  minPrice: number;
  maxPrice: number;
}

export interface ShopCategory {
  _id: string;
  name: string;
  slug: string;
  count: number;
  image: ShopImage | null;
}

export interface ShopMaterial {
  _id: string;
  name: string;
  slug: string;
  count: number;
}

export interface ShopColor {
  slug: string;
  name: string;
  hex: string | null;
  count: number;
}

export interface ShopPriceRange {
  min: number;
  max: number;
}

export interface ShopFilters {
  categories: ShopCategory[];
  materials: ShopMaterial[];
  colors: ShopColor[];
  priceRange: ShopPriceRange;
}

export interface ShopHome {
  categories: ShopCategory[];
  materials: ShopMaterial[];
  colors: ShopColor[];
  latestPrints: ShopPrintCard[];
}

export interface ShopPageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ShopPrintsPage {
  data: ShopPrintCard[];
  meta: ShopPageMeta;
}

/** Estado completo del catálogo; es la fuente de verdad que se sincroniza con la URL. */
export interface ShopCatalogQuery {
  q: string;
  category: string[];
  material: string[];
  color: string[];
  minPrice: number | null;
  maxPrice: number | null;
  sort: ShopSort;
  page: number;
  limit: number;
}
