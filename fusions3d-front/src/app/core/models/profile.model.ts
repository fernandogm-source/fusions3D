export interface ProfileAddress {
  _id?: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

/** Perfil del usuario autenticado (colección `profiles`). */
export interface Profile {
  _id: string;
  userId: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  addresses: ProfileAddress[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Datos enviados a `PATCH /api/profiles/updateprofile`.
 * `username` cambia la cuenta, el resto de campos el perfil.
 */
export interface ProfilePayload {
  username?: string;
  name?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  addresses?: Omit<ProfileAddress, '_id'>[];
}
