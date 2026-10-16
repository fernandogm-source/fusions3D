import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MaterialsStore } from '../../../../core/store/materials.store';
import { MaterialPayload } from '../../../../core/models/material.model';
import { MaterialForm } from '../../components/material-form/material-form';
import { showSuccess } from '../../../../shared/utils/alert.util';

@Component({ selector: 'app-material-create', imports: [MaterialForm], templateUrl: './material-create.html' })
export class MaterialCreatePage {
  private readonly store = inject(MaterialsStore); private readonly router = inject(Router); protected readonly saving = signal(false);
  protected async submit(payload: MaterialPayload): Promise<void> { this.saving.set(true); try { const item = await this.store.create(payload); if (item) { showSuccess('Material creado.'); void this.router.navigate(['/admin/materials', item._id]); } } finally { this.saving.set(false); } }
}
