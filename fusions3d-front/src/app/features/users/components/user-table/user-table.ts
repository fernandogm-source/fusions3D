import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { User } from '../../../../core/models/user.model';

@Component({ selector: 'app-user-table', imports: [RouterLink], templateUrl: './user-table.html' })
export class UserTable {
  readonly users = input.required<User[]>(); readonly trashView = input(false);
  readonly toggleActive = output<User>(); readonly remove = output<User>(); readonly restore = output<User>();
  protected roleNames(user: User): string {
    return user.roles
      .map((role) => !role ? 'Rol no disponible' : typeof role === 'string' ? role : role.name)
      .join(', ') || 'Sin roles';
  }
}
