import { Routes } from '@angular/router';

export const PRINT_VARIANTS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/print-variants-list/print-variants-list').then((m) => m.PrintVariantsListPage), title: 'Variantes | Fusions3D' },
  { path: 'nueva', loadComponent: () => import('./pages/print-variant-create/print-variant-create').then((m) => m.PrintVariantCreatePage), title: 'Nueva variante | Fusions3D' },
  { path: ':id/editar', loadComponent: () => import('./pages/print-variant-edit/print-variant-edit').then((m) => m.PrintVariantEditPage), title: 'Editar variante | Fusions3D' },
];
