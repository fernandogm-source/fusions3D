import { ShopPageMeta, ShopReview } from './shop.model';

/** Comentario tal y como lo devuelve `/api/reviews` en el panel de administración. */
export interface AdminReview extends ShopReview {
  printName: string | null;
}

/** Impresión con comentarios, para el listado del panel. */
export interface AdminReviewPrint {
  _id: string;
  name: string;
  slug: string;
  reviewCount: number;
  ratingAverage: number;
}

/** Análisis de sentimiento de los comentarios de una impresión (`/api/reviews/prints/:printId/sentiment`). */
export interface AdminPrintSentiment {
  reviewCount: number;
  sampleSize: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    summary: string;
  } | null;
  updatedAt: string | null;
}

export interface AdminReviewsPage {
  items: AdminReview[];
  meta: ShopPageMeta;
  print: { _id: string; name: string } | null;
}
