export interface Material {
  _id: string;
  name: string;
  isActive: boolean;
  deletedAt: string | null;
}

export interface MaterialPayload {
  name: string;
}

export type MaterialUpdatePayload = Partial<MaterialPayload>;
