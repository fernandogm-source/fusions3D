export interface Role {
  _id: string;
  name: string;
  isActive: boolean;
  deletedAt: string | null;
}

export interface RolePayload {
  name: string;
}

export type RoleUpdatePayload = Partial<RolePayload>;
