import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout').then((m) => m.MainLayout),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        canActivate: [adminGuard],
        loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'perfil',
        loadChildren: () => import('./features/profile/profile.routes').then((m) => m.PROFILE_ROUTES),
      },
      {
        path: 'impresiones',
        canActivate: [adminGuard],
        loadChildren: () =>
          import('./features/impresions/impresions.routes').then((m) => m.IMPRESIONS_ROUTES),
      },
      {
        path: 'admin/categories',
        canActivate: [adminGuard],
        loadChildren: () => import('./features/categories/categories.routes').then((m) => m.CATEGORIES_ROUTES),
      },
      {
        path: 'admin/materials',
        canActivate: [adminGuard],
        loadChildren: () => import('./features/materials/materials.routes').then((m) => m.MATERIALS_ROUTES),
      },
      {
        path: 'admin/print-variants',
        canActivate: [adminGuard],
        loadChildren: () => import('./features/print-variants/print-variants.routes').then((m) => m.PRINT_VARIANTS_ROUTES),
      },
      {
        path: 'admin/roles',
        canActivate: [adminGuard],
        loadChildren: () => import('./features/roles/roles.routes').then((m) => m.ROLES_ROUTES),
      },
      {
        path: 'admin/users',
        canActivate: [adminGuard],
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
