import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { getErrorMessage } from '../../shared/utils/error-message.util';
import { Material, MaterialPayload, MaterialUpdatePayload } from '../models/material.model';
import { MaterialsService } from '../services/materials.service';
import { DependencyRefreshStore } from './dependency-refresh.store';

@Injectable({ providedIn: 'root' })
export class MaterialsStore {
  private readonly service = inject(MaterialsService);
  private readonly dependencyRefresh = inject(DependencyRefreshStore);
  private readonly _items = signal<Material[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _trashView = signal(false);
  private readonly _selected = signal<Material | null>(null);
  private readonly _loaded = signal(false);
  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly trashView = this._trashView.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly total = computed(() => this._items().length);
  readonly activeItems = computed(() => this._items().filter((item) => item.isActive));
  readonly hasError = computed(() => this._error() !== null);
  readonly isEmpty = computed(() => this._loaded() && !this._loading() && this._items().length === 0);

  constructor() {
    effect(() => {
      const selected = this._selected();
      if (selected && this._loaded() && !this._items().some((item) => item._id === selected._id)) this._selected.set(null);
    });
  }

  loadAll(force = false): Promise<void> { return this.loadView(false, force); }
  loadSoftDeleted(force = false): Promise<void> { return this.loadView(true, force); }

  private async loadView(trashView: boolean, force: boolean): Promise<void> {
    if (this._loading() || (this._loaded() && this._trashView() === trashView && !force)) return;
    this._trashView.set(trashView); this._loading.set(true); this._error.set(null);
    try { this._items.set(await firstValueFrom(trashView ? this.service.getSoftDeleted() : this.service.getAll())); this._loaded.set(true); }
    catch (error) { this._error.set(getErrorMessage(error)); this._items.set([]); }
    finally { this._loading.set(false); }
  }

  async loadById(id: string): Promise<void> {
    const cached = this._items().find((item) => item._id === id);
    if (cached && !this._trashView()) { this._selected.set(cached); this._error.set(null); return; }
    this._loading.set(true); this._error.set(null); this._selected.set(null);
    try { const material = await firstValueFrom(this.service.getById(id)); this._selected.set(material); this.upsert(material); }
    catch (error) { this._error.set(getErrorMessage(error)); }
    finally { this._loading.set(false); }
  }

  clearSelected(): void { this._selected.set(null); }
  clearError(): void { this._error.set(null); }

  async create(payload: MaterialPayload): Promise<Material | null> {
    this._error.set(null);
    try { const created = await firstValueFrom(this.service.create(payload)); this._items.update((items) => [...items, created]); this._selected.set(created); this.dependencyRefresh.notify('material'); return created; }
    catch (error) { this._error.set(getErrorMessage(error)); return null; }
  }
  async update(id: string, payload: MaterialUpdatePayload): Promise<Material | null> {
    this._error.set(null);
    try { const updated = await firstValueFrom(this.service.update(id, payload)); this.upsert(updated); this.dependencyRefresh.notify('material'); return updated; }
    catch (error) { this._error.set(getErrorMessage(error)); return null; }
  }
  async toggleActive(item: Material): Promise<boolean> {
    try { this.upsert(await firstValueFrom(this.service.toggleActive(item._id))); this.dependencyRefresh.notify('material'); return true; }
    catch (error) { this._error.set(getErrorMessage(error)); return false; }
  }
  async softDelete(item: Material): Promise<boolean> {
    try { await firstValueFrom(this.service.softDelete(item._id)); this._items.update((items) => items.filter((entry) => entry._id !== item._id)); this._selected.update((selected) => selected?._id === item._id ? null : selected); this.dependencyRefresh.notify('material'); return true; }
    catch (error) { this._error.set(getErrorMessage(error)); return false; }
  }
  async restore(item: Material): Promise<boolean> {
    try { const restored = await firstValueFrom(this.service.restore(item._id)); if (this._trashView()) this._items.update((items) => items.filter((entry) => entry._id !== item._id)); else this.upsert(restored); this.dependencyRefresh.notify('material'); return true; }
    catch (error) { this._error.set(getErrorMessage(error)); return false; }
  }
  private upsert(material: Material): void {
    this._items.update((items) => items.some((item) => item._id === material._id) ? items.map((item) => item._id === material._id ? material : item) : [...items, material]);
    this._selected.update((item) => item?._id === material._id ? material : item);
  }
}
