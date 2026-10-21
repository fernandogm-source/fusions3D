import { Role } from './role.model';
import { DependencyIssue } from './dependency-issue.model';

export interface UserAddress {
  _id?: string;
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  roles: (string | Pick<Role, '_id' | 'name'>)[];
  addresses: UserAddress[];
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  dependencyIssues?: DependencyIssue[];
}

export interface UserPayload {
  name: string;
  email: string;
  password?: string;
  roles?: string[];
  addresses?: UserAddress[];
  phone?: string | null;
}

export type UserUpdatePayload = Partial<UserPayload>;
