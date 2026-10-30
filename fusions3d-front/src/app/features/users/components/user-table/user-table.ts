import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Role } from '../../../../core/models/role.model';
import { User } from '../../../../core/models/user.model';

@Component({ selector: 'app-user-table', imports: [RouterLink], templateUrl: './user-table.html' })
export class UserTable {
  readonly users = input.required<User[]>();
  readonly roles = input<Role[]>([]);
  readonly currentUserId = input<string | null>(null);
  readonly trashView = input(false);
  readonly toggleActive = output<User>(); readonly remove = output<User>(); readonly restore = output<User>();

  protected roleName(user: User): string {
    return this.roles().find((role) => role._id === user.role)?.name ?? 'Rol no disponible';
  }

  protected isCurrentUser(user: User): boolean {
    return user._id === this.currentUserId();
  }
}
