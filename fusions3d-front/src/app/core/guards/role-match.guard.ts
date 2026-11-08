import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { AuthStore } from '../store/auth.store';

/** Coincide la ruta solo para usuarios con rol ADMIN. */
export const adminMatch: CanMatchFn = async () => {
  const auth = inject(AuthStore);
  await auth.restoreSession();
  return auth.isAdmin();
};

/** Coincide la ruta solo para usuarios que no son ADMIN (incluye sesiones no iniciadas). */
export const nonAdminMatch: CanMatchFn = async () => {
  const auth = inject(AuthStore);
  await auth.restoreSession();
  return !auth.isAdmin();
};
