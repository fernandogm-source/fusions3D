import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage),
    title: 'Iniciar sesión | Fusions3D',
  },
];

export const REGISTER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/register/register').then((m) => m.RegisterPage),
    title: 'Crear cuenta | Fusions3D',
  },
];
