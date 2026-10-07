import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'impresiones' },
      {
        path: 'impresiones',
        loadChildren: () =>
          import('./features/impresions/impresions.routes').then((m) => m.IMPRESIONS_ROUTES),
      },
      {
        path: '**',
        loadComponent: () =>
          import('./shared/components/not-found/not-found').then((m) => m.NotFound),
        title: 'Página no encontrada | Fusions3D',
      },
    ],
  },
];
