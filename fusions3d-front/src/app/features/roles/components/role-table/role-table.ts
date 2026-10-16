import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Role } from '../../../../core/models/role.model';

@Component({ selector: 'app-role-table', imports: [RouterLink], templateUrl: './role-table.html' })
export class RoleTable {
  readonly roles = input.required<Role[]>(); readonly trashView = input(false);
  readonly toggleActive = output<Role>(); readonly remove = output<Role>(); readonly restore = output<Role>();
}
