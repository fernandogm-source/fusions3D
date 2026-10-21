import { Injectable, signal } from '@angular/core';

export type DependencyDomain = 'category' | 'print' | 'material' | 'role';

@Injectable({ providedIn: 'root' })
export class DependencyRefreshStore {
  private readonly _categoryRevision = signal(0);
  private readonly _printRevision = signal(0);
  private readonly _materialRevision = signal(0);
  private readonly _roleRevision = signal(0);

  readonly categoryRevision = this._categoryRevision.asReadonly();
  readonly printRevision = this._printRevision.asReadonly();
  readonly materialRevision = this._materialRevision.asReadonly();
  readonly roleRevision = this._roleRevision.asReadonly();

  notify(domain: DependencyDomain): void {
    switch (domain) {
      case 'category': this._categoryRevision.update((revision) => revision + 1); break;
      case 'print': this._printRevision.update((revision) => revision + 1); break;
      case 'material': this._materialRevision.update((revision) => revision + 1); break;
      case 'role': this._roleRevision.update((revision) => revision + 1); break;
    }
  }
}
