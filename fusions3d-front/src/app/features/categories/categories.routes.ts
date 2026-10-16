import { Routes } from '@angular/router';

export const CATEGORIES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/categories-list/categories-list').then((m) => m.CategoriesListPage), title: 'Categorías | Fusions3D' },
  { path: 'nueva', loadComponent: () => import('./pages/category-create/category-create').then((m) => m.CategoryCreatePage), title: 'Nueva categoría | Fusions3D' },
  { path: ':id/editar', loadComponent: () => import('./pages/category-edit/category-edit').then((m) => m.CategoryEditPage), title: 'Editar categoría | Fusions3D' },
  { path: ':id', loadComponent: () => import('./pages/category-detail/category-detail').then((m) => m.CategoryDetailPage), title: 'Categoría | Fusions3D' },
];
