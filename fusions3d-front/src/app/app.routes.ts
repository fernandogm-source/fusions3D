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
        path: 'admin/categories',
        loadChildren: () => import('./features/categories/categories.routes').then((m) => m.CATEGORIES_ROUTES),
      },
      {
        path: 'admin/materials',
        loadChildren: () => import('./features/materials/materials.routes').then((m) => m.MATERIALS_ROUTES),
      },
      {
        path: 'admin/print-variants',
        loadChildren: () => import('./features/print-variants/print-variants.routes').then((m) => m.PRINT_VARIANTS_ROUTES),
      },
      {
        path: 'admin/roles',
        loadChildren: () => import('./features/roles/roles.routes').then((m) => m.ROLES_ROUTES),
      },
      {
        path: 'admin/users',
        loadChildren: () => import('./features/users/users.routes').then((m) => m.USERS_ROUTES),
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
