import { Routes } from '@angular/router';

/** Rutas públicas de la tienda. Se montan bajo `ShopLayout` en `app.routes.ts`. */
export const SHOP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.ShopHomePage),
    title: 'Fusions3D | Impresiones 3D',
  },
  {
    path: 'shop',
    loadComponent: () => import('./pages/catalog/catalog').then((m) => m.ShopCatalogPage),
    title: 'Catálogo | Fusions3D',
  },
  {
    path: 'shop/:slug',
    loadComponent: () => import('./pages/print-detail/print-detail').then((m) => m.ShopPrintDetailPage),
    title: 'Impresión | Fusions3D',
  },
];
