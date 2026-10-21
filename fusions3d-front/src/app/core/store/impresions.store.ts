import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { getErrorMessage } from '../../shared/utils/error-message.util';
import {
  Impresion,
  ImpresionCreatePayload,
  ImpresionUpdatePayload,
} from '../models/impresion.model';
import { ImpresionesService } from '../services/impresiones.service';
import { DependencyRefreshStore } from './dependency-refresh.store';
import { isDependencyUnavailable } from '../../shared/utils/error-message.util';

/**
 * Store global de impresiones basado en Angular Signals.
 *
 * Actúa como caché global:
 * - Las impresiones se cargan una sola vez (`loadAll` respeta la caché).
 * - Los datos se comparten entre componentes sin peticiones duplicadas.
 * - `loadBySlug` consulta primero la caché antes de llamar a la API.
 *
 * Estado expuesto (solo lectura): loading, error, impresions, selectedImpresion.
 */
@Injectable({ providedIn: 'root' })
export class ImpresionsStore {
  private readonly impresionesService = inject(ImpresionesService);
  private readonly dependencyRefresh = inject(DependencyRefreshStore);

  // ---------- Estado interno (writable signals) ----------
  private readonly _impresions = signal<Impresion[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedImpresion = signal<Impresion | null>(null);
  /** Indica si el catálogo ya se ha cargado al menos una vez (caché) */
  private readonly _loaded = signal<boolean>(false);
  private readonly _trashView = signal(false);
  private _refreshPending = false;
  private _pendingTrashView: boolean | null = null;
  private readonly _dependencyUnavailable = signal(false);

  // ---------- Estado público (readonly signals) ----------
  readonly impresions = this._impresions.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedImpresion = this._selectedImpresion.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly trashView = this._trashView.asReadonly();
  readonly dependencyUnavailable = this._dependencyUnavailable.asReadonly();

  // ---------- Estado derivado (computed) ----------
  readonly total = computed(() => this._impresions().length);
  readonly activeImpresions = computed(() => this._impresions().filter((i) => i.isActive));
  readonly hasError = computed(() => this._error() !== null);
  readonly isEmpty = computed(
    () => this._loaded() && !this._loading() && this._impresions().length === 0,
  );

  constructor() {
    // effect: si la impresión seleccionada deja de existir en la caché
    // (p. ej. tras eliminarla), limpiamos la selección automáticamente.
    effect(() => {
      const selected = this._selectedImpresion();
      if (
        selected &&
        this._loaded() &&
        !this._impresions().some((i) => i._id === selected._id)
      ) {
        this._selectedImpresion.set(null);
      }
    });

    effect(() => {
      const revision = this.dependencyRefresh.categoryRevision();
      if (revision > 0) {
        untracked(() => {
          if (this._loaded()) void this.loadView(this._trashView(), true);
        });
      }
    });
  }

  /**
   * Carga el catálogo completo. Solo realiza la petición la primera vez;
   * usa `force = true` para recargar la caché.
   */
  async loadAll(force = false): Promise<void> {
    return this.loadView(false, force);
  }

  async loadSoftDeleted(force = false): Promise<void> {
    return this.loadView(true, force);
  }

  private async loadView(trashView: boolean, force: boolean): Promise<void> {
    if (this._loading()) {
      if (force) {
        this._refreshPending = true;
        this._pendingTrashView = trashView;
      }
      return;
    }
    if (this._loaded() && this._trashView() === trashView && !force) return;

    this._trashView.set(trashView);
    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(trashView
        ? this.impresionesService.getSoftDeleted()
        : this.impresionesService.getAll());
      this._impresions.set(data);
      this._loaded.set(true);
    } catch (error) {
      this._error.set(getErrorMessage(error));
    } finally {
      this.finishLoad();
    }
  }

  /**
   * Carga una impresión por su slug. Consulta primero la caché global
   * para evitar peticiones duplicadas.
   */
  async loadBySlug(slug: string): Promise<void> {
    const cached = this._impresions().find((i) => i.slug === slug);
    if (cached) {
      this._selectedImpresion.set(cached);
      this._error.set(null);
      return;
    }

    this._loading.set(true);
    this._error.set(null);
    this._selectedImpresion.set(null);

    try {
      const data = await firstValueFrom(this.impresionesService.getBySlug(slug));
      this._selectedImpresion.set(data);
      this.upsertCache(data);
    } catch (error) {
      this._error.set(getErrorMessage(error));
    } finally {
      this.finishLoad();
    }
  }

  /**
   * Carga una impresión por su ID. Consulta primero la caché global
   * para evitar peticiones duplicadas.
   */
  async loadById(id: string): Promise<void> {
    const cached = this._impresions().find((i) => i._id === id);
    if (cached) {
      this._selectedImpresion.set(cached);
      this._error.set(null);
      return;
    }

    this._loading.set(true);
    this._error.set(null);
    this._selectedImpresion.set(null);

    try {
      const data = await firstValueFrom(this.impresionesService.getById(id));
      this._selectedImpresion.set(data);
      this.upsertCache(data);
    } catch (error) {
      this._error.set(getErrorMessage(error));
    } finally {
      this.finishLoad();
    }
  }

  clearSelected(): void {
    this._selectedImpresion.set(null);
  }

  clearError(): void {
    this._error.set(null);
    this._dependencyUnavailable.set(false);
  }

  /** Crea una impresión y la añade a la caché. Devuelve null si falla. */
  async create(payload: ImpresionCreatePayload): Promise<Impresion | null> {
    this._error.set(null);

    try {
      const created = await firstValueFrom(this.impresionesService.create(payload));
      this._impresions.update((list) => [...list, created]);
      this.dependencyRefresh.notify('print');
      return created;
    } catch (error) {
      this._error.set(getErrorMessage(error));
      this._dependencyUnavailable.set(isDependencyUnavailable(error));
      return null;
    }
  }

  /** Actualiza una impresión y sincroniza la caché. Devuelve null si falla. */
  async update(id: string, payload: ImpresionUpdatePayload): Promise<Impresion | null> {
    this._error.set(null);
    this._dependencyUnavailable.set(false);

    try {
      const updated = await firstValueFrom(this.impresionesService.update(id, payload));
      this._impresions.update((list) => list.map((i) => (i._id === id ? updated : i)));
      this._selectedImpresion.update((sel) => (sel?._id === id ? updated : sel));
      this.dependencyRefresh.notify('print');
      return updated;
    } catch (error) {
      this._error.set(getErrorMessage(error));
      this._dependencyUnavailable.set(isDependencyUnavailable(error));
      return null;
    }
  }

  /** Alterna el estado activo/inactivo. Devuelve true si tiene éxito. */
  async toggleActive(id: string): Promise<boolean> {
    this._error.set(null);
    const current = this._impresions().find((impresion) => impresion._id === id);
    if (!current) return false;

    try {
      const updated = await firstValueFrom(this.impresionesService.toggleActive(id, !current.isActive));
      this._impresions.update((list) => list.map((i) => (i._id === id ? updated : i)));
      this._selectedImpresion.update((sel) => (sel?._id === id ? updated : sel));
      this.dependencyRefresh.notify('print');
      return true;
    } catch (error) {
      this._error.set(getErrorMessage(error));
      return false;
    }
  }

  /** Borrado lógico: elimina la impresión de la caché. Devuelve true si tiene éxito. */
  async softDelete(id: string): Promise<boolean> {
    this._error.set(null);

    try {
      await firstValueFrom(this.impresionesService.softDelete(id));
      this._impresions.update((list) => list.filter((i) => i._id !== id));
      this.dependencyRefresh.notify('print');
      return true;
    } catch (error) {
      this._error.set(getErrorMessage(error));
      return false;
    }
  }

  async restore(id: string): Promise<boolean> {
    this._error.set(null);
    try {
      await firstValueFrom(this.impresionesService.restore(id));
      await (this._trashView() ? this.loadSoftDeleted(true) : this.loadAll(true));
      this.dependencyRefresh.notify('print');
      return true;
    } catch (error) {
      this._error.set(getErrorMessage(error));
      return false;
    }
  }

  /** Inserta o reemplaza una impresión en la caché. */
  private upsertCache(impresion: Impresion): void {
    this._impresions.update((list) =>
      list.some((i) => i._id === impresion._id)
        ? list.map((i) => (i._id === impresion._id ? impresion : i))
        : [...list, impresion],
    );
  }

  private finishLoad(): void {
    this._loading.set(false);
    if (!this._refreshPending) return;

    const trashView = this._pendingTrashView ?? this._trashView();
    this._refreshPending = false;
    this._pendingTrashView = null;
    void this.loadView(trashView, true);
  }
}
