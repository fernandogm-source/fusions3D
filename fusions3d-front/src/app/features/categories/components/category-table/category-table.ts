import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../../../core/models/category.model';

@Component({ selector: 'app-category-table', imports: [RouterLink], templateUrl: './category-table.html' })
export class CategoryTable {
  readonly categories = input.required<Category[]>();
  readonly trashView = input(false);
  readonly edit = output<Category>();
  readonly toggleActive = output<Category>();
  readonly remove = output<Category>();
  readonly restore = output<Category>();
}
