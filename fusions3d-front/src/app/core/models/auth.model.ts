/** Rol con acceso al panel de administración. */
export const ADMIN_ROLE = 'ADMIN';

/**
 * Usuario autenticado tal y como lo devuelve la API
 * (respuestas de login y de `/auth/me`).
 */
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Respuesta del login. El token viaja en una cookie HttpOnly,
 * por lo que no aparece en el cuerpo de la respuesta.
 */
export interface LoginResponse {
  expiresIn: string;
  user: AuthUser;
}
