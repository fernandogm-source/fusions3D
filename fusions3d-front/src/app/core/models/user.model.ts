/**
 * Cuenta de usuario tal y como la devuelve `/api/users`.
 * El nombre, teléfono y direcciones pertenecen al perfil y no se incluyen aquí.
 */
export interface User {
  _id: string;
  email: string;
  username: string;
  /** Id del rol asignado. */
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface UserPayload {
  email: string;
  username: string;
  password?: string;
  role?: string;
}

export type UserUpdatePayload = Partial<UserPayload>;
