import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, firstValueFrom } from 'rxjs';
import { AuthStore } from '../../../../core/store/auth.store';
import { CategoriesService } from '../../../../core/services/categories.service';
import { ImpresionesService } from '../../../../core/services/impresiones.service';
import { MaterialsService } from '../../../../core/services/materials.service';
import { PrintVariantsService } from '../../../../core/services/print-variants.service';
import { RolesService } from '../../../../core/services/roles.service';
import { UsersService } from '../../../../core/services/users.service';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { getErrorMessage } from '../../../../shared/utils/error-message.util';

interface DashboardCounter {
  label: string;
  link: string;
  total: number;
  active: number;
  icon: 'catalog' | 'tag' | 'layers' | 'cube' | 'shield' | 'users';
}

/** Página de inicio del panel: contadores de los recursos principales. */
@Component({ selector: 'app-dashboard', imports: [RouterLink, ErrorState, PageHeader], templateUrl: './dashboard.html' })
export class DashboardPage {
  private readonly auth = inject(AuthStore);
  private readonly impresiones = inject(ImpresionesService);
  private readonly categories = inject(CategoriesService);
  private readonly materials = inject(MaterialsService);
  private readonly variants = inject(PrintVariantsService);
  private readonly roles = inject(RolesService);
  private readonly users = inject(UsersService);

  protected readonly username = computed(() => this.auth.user()?.username ?? '');
  protected readonly counters = signal<DashboardCounter[]>([]);
  protected readonly totalRecords = computed(() => this.counters().reduce((sum, counter) => sum + counter.total, 0));
  protected readonly activeRecords = computed(() => this.counters().reduce((sum, counter) => sum + counter.active, 0));
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  protected retry(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(forkJoin({
        prints: this.impresiones.getAll(),
        categories: this.categories.getAll(),
        materials: this.materials.getAll(),
        variants: this.variants.getAll(),
        roles: this.roles.getAll(),
        users: this.users.getAll(),
      }));

      this.counters.set([
        this.count('Impresiones', '/impresiones', 'catalog', data.prints),
        this.count('Categorías', '/admin/categories', 'tag', data.categories),
        this.count('Materiales', '/admin/materials', 'layers', data.materials),
        this.count('Variantes', '/admin/print-variants', 'cube', data.variants),
        this.count('Roles', '/admin/roles', 'shield', data.roles),
        this.count('Usuarios', '/admin/users', 'users', data.users),
      ]);
    } catch (error) {
      this.error.set(getErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  private count(label: string, link: string, icon: DashboardCounter['icon'], items: { isActive: boolean }[]): DashboardCounter {
    return { label, link, icon, total: items.length, active: items.filter((item) => item.isActive).length };
  }
}
