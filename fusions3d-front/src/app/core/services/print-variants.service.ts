import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PrintVariant, PrintVariantPayload, PrintVariantUpdatePayload } from '../models/print-variant.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class PrintVariantsService {
  private readonly api = inject(ApiService);
  private readonly resource = '/print-variants';

  getAll(): Observable<PrintVariant[]> { return this.api.get<PrintVariant[]>(this.resource); }
  getActive(): Observable<PrintVariant[]> { return this.api.get<PrintVariant[]>(`${this.resource}/active`); }
  getInactive(): Observable<PrintVariant[]> { return this.api.get<PrintVariant[]>(`${this.resource}/inactive`); }
  getSoftDeleted(): Observable<PrintVariant[]> { return this.api.get<PrintVariant[]>(`${this.resource}/soft-deleted`); }
  getById(id: string): Observable<PrintVariant> { return this.api.get<PrintVariant>(`${this.resource}/${id}`); }
  getBySku(sku: string): Observable<PrintVariant> {
    return this.api.get<PrintVariant>(`${this.resource}/sku/${encodeURIComponent(sku)}`);
  }
  getByPrintId(printId: string): Observable<PrintVariant[]> {
    return this.api.get<PrintVariant[]>(`${this.resource}/print/${printId}`);
  }
  create(payload: PrintVariantPayload): Observable<PrintVariant> {
    return this.api.post<PrintVariant>(this.resource, payload);
  }
  update(id: string, payload: PrintVariantUpdatePayload): Observable<PrintVariant> {
    return this.api.patch<PrintVariant>(`${this.resource}/${id}`, payload);
  }
  toggleActive(id: string): Observable<PrintVariant> {
    return this.api.patch<PrintVariant>(`${this.resource}/${id}/active`, {});
  }
  softDelete(id: string): Observable<PrintVariant> {
    return this.api.patch<PrintVariant>(`${this.resource}/${id}/soft-delete`, {});
  }
  restore(id: string): Observable<PrintVariant> {
    return this.api.patch<PrintVariant>(`${this.resource}/${id}/restore`, {});
  }
}
