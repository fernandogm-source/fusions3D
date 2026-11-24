import { Routes } from '@angular/router';

export const REVIEWS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/reviews-prints/reviews-prints').then((m) => m.ReviewsPrintsPage), title: 'Comentarios | Fusions3D' },
  { path: ':printId', loadComponent: () => import('./pages/reviews-list/reviews-list').then((m) => m.ReviewsListPage), title: 'Comentarios de la impresión | Fusions3D' },
];
