import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../store/auth.store';

/**
 * Permite el acceso solo a usuarios con rol ADMIN. Si no hay sesión, redirige
 * al login; si la sesión es de un usuario normal, lo lleva a su perfil.
 */
export const adminGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  await auth.restoreSession();

  if (auth.isAdmin()) {
    return true;
  }

  return auth.isAuthenticated()
    ? router.createUrlTree(['/perfil'])
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
