import { Routes } from '@angular/router';

export const MATERIALS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/materials-list/materials-list').then((m) => m.MaterialsListPage), title: 'Materiales | Fusions3D' },
  { path: 'nuevo', loadComponent: () => import('./pages/material-create/material-create').then((m) => m.MaterialCreatePage), title: 'Nuevo material | Fusions3D' },
  { path: ':id/editar', loadComponent: () => import('./pages/material-edit/material-edit').then((m) => m.MaterialEditPage), title: 'Editar material | Fusions3D' },
];
