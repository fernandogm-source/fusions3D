import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Material } from '../../../../core/models/material.model';

@Component({ selector: 'app-material-table', imports: [RouterLink], templateUrl: './material-table.html' })
export class MaterialTable {
  readonly materials = input.required<Material[]>();
  readonly trashView = input(false);
  readonly toggleActive = output<Material>();
  readonly remove = output<Material>();
  readonly restore = output<Material>();
}
