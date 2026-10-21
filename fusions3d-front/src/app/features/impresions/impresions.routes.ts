import { Routes } from '@angular/router';

/**
 * Rutas del módulo de impresiones con carga diferida (lazy loading)
 * a nivel de componente standalone.
 */
export const IMPRESIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/impresiones-list/impresiones-list').then((m) => m.ImpresionesListPage),
    title: 'Catálogo | Fusions3D',
  },
  {
    path: 'nueva',
    loadComponent: () =>
      import('./pages/impresion-create/impresion-create').then((m) => m.ImpresionCreatePage),
    title: 'Nueva impresión | Fusions3D',
  },
  {
    path: ':slug',
    loadComponent: () =>
      import('./pages/impresion-detail/impresion-detail').then((m) => m.ImpresionDetailPage),
    title: 'Detalle | Fusions3D',
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./pages/impresion-edit/impresion-edit').then((m) => m.ImpresionEditPage),
    title: 'Editar impresión | Fusions3D',
  },
];
