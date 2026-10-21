import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/users-list/users-list').then((m) => m.UsersListPage), title: 'Usuarios | Fusions3D' },
  { path: 'nuevo', loadComponent: () => import('./pages/user-create/user-create').then((m) => m.UserCreatePage), title: 'Nuevo usuario | Fusions3D' },
  { path: ':id/editar', loadComponent: () => import('./pages/user-edit/user-edit').then((m) => m.UserEditPage), title: 'Editar usuario | Fusions3D' },
];
