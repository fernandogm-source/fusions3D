import { Routes } from '@angular/router';

export const ROLES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/roles-list/roles-list').then((m) => m.RolesListPage), title: 'Roles | Fusions3D' },
  { path: 'nuevo', loadComponent: () => import('./pages/role-create/role-create').then((m) => m.RoleCreatePage), title: 'Nuevo rol | Fusions3D' },
  { path: ':id/editar', loadComponent: () => import('./pages/role-edit/role-edit').then((m) => m.RoleEditPage), title: 'Editar rol | Fusions3D' },
];
