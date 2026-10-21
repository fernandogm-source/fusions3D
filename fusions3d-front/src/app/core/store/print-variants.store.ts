import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { getErrorMessage, isDependencyUnavailable } from '../../shared/utils/error-message.util';
import { PrintVariant, PrintVariantPayload, PrintVariantUpdatePayload } from '../models/print-variant.model';
import { PrintVariantsService } from '../services/print-variants.service';
import { DependencyRefreshStore } from './dependency-refresh.store';

@Injectable({ providedIn: 'root' })
export class PrintVariantsStore {
  private readonly service = inject(PrintVariantsService);
  private readonly dependencyRefresh = inject(DependencyRefreshStore);
  private readonly _items = signal<PrintVariant[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _trashView = signal(false);
  private readonly _selected = signal<PrintVariant | null>(null);
  private readonly _loaded = signal(false);
  private _refreshPending = false;
  private _pendingTrashView: boolean | null = null;
  private readonly _dependencyUnavailable = signal(false);
  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly trashView = this._trashView.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly dependencyUnavailable = this._dependencyUnavailable.asReadonly();
  readonly total = computed(() => this._items().length);
  readonly activeItems = computed(() => this._items().filter((item) => item.isActive));
  readonly hasError = computed(() => this._error() !== null);
  readonly isEmpty = computed(() => this._loaded() && !this._loading() && this._items().length === 0);

  constructor() {
    effect(() => {
      const selected = this._selected();
      if (selected && this._loaded() && !this._items().some((item) => item._id === selected._id)) this._selected.set(null);
    });

    effect(() => {
      const categoryRevision = this.dependencyRefresh.categoryRevision();
      const printRevision = this.dependencyRefresh.printRevision();
      const materialRevision = this.dependencyRefresh.materialRevision();
      if (categoryRevision + printRevision + materialRevision > 0) {
        untracked(() => {
          if (this._loaded()) void this.loadView(this._trashView(), true);
        });
      }
    });
  }

  loadAll(force = false): Promise<void> { return this.loadView(false, force); }
  loadSoftDeleted(force = false): Promise<void> { return this.loadView(true, force); }

  private async loadView(trashView: boolean, force: boolean): Promise<void> {
    if (this._loading()) {
      if (force) {
        this._refreshPending = true;
        this._pendingTrashView = trashView;
      }
      return;
    }
    if (this._loaded() && this._trashView() === trashView && !force) return;
    this._trashView.set(trashView); this._loading.set(true); this._error.set(null);
    try { this._items.set(await firstValueFrom(trashView ? this.service.getSoftDeleted() : this.service.getAll())); this._loaded.set(true); }
    catch (error) { this._error.set(getErrorMessage(error)); this._items.set([]); }
    finally { this.finishLoad(); }
  }

  async loadById(id: string, force = false): Promise<void> {
    const cached = this._items().find((item) => item._id === id);
    if (!force && cached && !this._trashView()) { this._selected.set(cached); this._error.set(null); return; }
    this._loading.set(true); this._error.set(null); this._selected.set(null);
    try { const variant = await firstValueFrom(this.service.getById(id)); this._selected.set(variant); this.upsert(variant); }
    catch (error) { this._error.set(getErrorMessage(error)); }
    finally { this.finishLoad(); }
  }
  clearSelected(): void { this._selected.set(null); }
  clearError(): void { this._error.set(null); this._dependencyUnavailable.set(false); }
  async create(payload: PrintVariantPayload): Promise<PrintVariant | null> {
    this._error.set(null);
    try { const created = await firstValueFrom(this.service.create(payload)); this._items.update((items) => [...items, created]); this._selected.set(created); return created; }
    catch (error) { this._error.set(getErrorMessage(error)); return null; }
  }
  async update(id: string, payload: PrintVariantUpdatePayload): Promise<PrintVariant | null> {
    this._error.set(null);
    this._dependencyUnavailable.set(false);
    try { const updated = await firstValueFrom(this.service.update(id, payload)); this.upsert(updated); return updated; }
    catch (error) { this._error.set(getErrorMessage(error)); this._dependencyUnavailable.set(isDependencyUnavailable(error)); return null; }
  }
  async toggleActive(item: PrintVariant): Promise<boolean> {
    this._error.set(null);
    try { this.upsert(await firstValueFrom(this.service.toggleActive(item._id))); return true; }
    catch (error) { this._error.set(getErrorMessage(error)); return false; }
  }
  async softDelete(item: PrintVariant): Promise<boolean> {
    try { await firstValueFrom(this.service.softDelete(item._id)); this._items.update((items) => items.filter((entry) => entry._id !== item._id)); this._selected.update((selected) => selected?._id === item._id ? null : selected); return true; }
    catch (error) { this._error.set(getErrorMessage(error)); return false; }
  }
  async restore(item: PrintVariant): Promise<boolean> {
    try { const restored = await firstValueFrom(this.service.restore(item._id)); if (this._trashView()) this._items.update((items) => items.filter((entry) => entry._id !== item._id)); else this.upsert(restored); return true; }
    catch (error) { this._error.set(getErrorMessage(error)); return false; }
  }
  private upsert(variant: PrintVariant): void {
    this._items.update((items) => items.some((item) => item._id === variant._id) ? items.map((item) => item._id === variant._id ? variant : item) : [...items, variant]);
    this._selected.update((item) => item?._id === variant._id ? variant : item);
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
