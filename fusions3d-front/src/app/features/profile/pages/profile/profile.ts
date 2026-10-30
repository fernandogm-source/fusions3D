import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormArray, FormBuilder, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileAddress } from '../../../../core/models/profile.model';
import { AuthStore } from '../../../../core/store/auth.store';
import { ProfileStore } from '../../../../core/store/profile.store';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { showSuccess } from '../../../../shared/utils/alert.util';
import { getControlErrorMessage, urlValidator } from '../../../../shared/utils/custom-validators';

function createAddressGroup(fb: NonNullableFormBuilder, address?: ProfileAddress) {
  return fb.group({
    street: [address?.street ?? '', Validators.required],
    city: [address?.city ?? '', Validators.required],
    state: [address?.state ?? ''],
    postalCode: [address?.postalCode ?? '', Validators.required],
    country: [address?.country ?? '', Validators.required],
    isDefault: [address?.isDefault ?? false],
  });
}

type AddressGroup = ReturnType<typeof createAddressGroup>;
type AddressField = 'street' | 'city' | 'postalCode' | 'country';

/** Página "Mi perfil": datos de contacto, direcciones y username del usuario autenticado. */
@Component({ selector: 'app-profile', imports: [ReactiveFormsModule, ErrorState, PageHeader], templateUrl: './profile.html' })
export class ProfilePage {
  private readonly fb: NonNullableFormBuilder = inject(FormBuilder).nonNullable;
  protected readonly store = inject(ProfileStore);
  protected readonly auth = inject(AuthStore);
  protected readonly submitting = signal(false);
  protected readonly roleLabel = computed(() => (this.auth.isAdmin() ? 'Administrador' : 'Usuario'));
  protected readonly initial = computed(() => this.auth.user()?.username.charAt(0).toUpperCase() ?? '?');
  protected readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(/^[a-zA-Z0-9._-]+$/)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    phone: ['', [Validators.maxLength(30)]],
    avatarUrl: ['', [urlValidator()]],
    addresses: this.fb.array<AddressGroup>([]),
  });

  constructor() {
    void this.store.load();
    effect(() => {
      const profile = this.store.profile();
      const user = this.auth.user();
      if (!profile || !user) return;

      untracked(() => {
        this.form.patchValue({
          username: user.username,
          name: profile.name,
          phone: profile.phone ?? '',
          avatarUrl: profile.avatarUrl ?? '',
        });
        this.form.controls.addresses.clear();
        for (const address of profile.addresses) {
          this.form.controls.addresses.push(createAddressGroup(this.fb, address));
        }
      });
    });
  }

  protected get addresses(): FormArray<AddressGroup> {
    return this.form.controls.addresses;
  }

  protected fieldError(name: 'username' | 'name' | 'phone' | 'avatarUrl', label: string): string | null {
    return getControlErrorMessage(this.form.controls[name], label);
  }

  protected addressError(index: number, field: AddressField, label: string): string | null {
    return getControlErrorMessage(this.addresses.at(index).controls[field], label);
  }

  protected addAddress(): void {
    const isFirst = this.addresses.length === 0;
    this.addresses.push(createAddressGroup(this.fb, { street: '', city: '', state: '', postalCode: '', country: '', isDefault: isFirst }));
  }

  protected removeAddress(index: number): void {
    this.addresses.removeAt(index);
  }

  /** Solo puede haber una dirección predeterminada. */
  protected markDefault(index: number): void {
    const checked = this.addresses.at(index).controls.isDefault.value;
    this.addresses.controls.forEach((group, position) => {
      group.controls.isDefault.setValue(checked && position === index);
    });
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.submitting.set(true);
    const saved = await this.store.save({
      username: value.username.trim().toLowerCase(),
      name: value.name.trim(),
      phone: value.phone.trim() || null,
      avatarUrl: value.avatarUrl.trim() || null,
      addresses: value.addresses.map((address) => ({
        street: address.street.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        postalCode: address.postalCode.trim(),
        country: address.country.trim(),
        isDefault: address.isDefault,
      })),
    });
    this.submitting.set(false);

    if (saved) showSuccess('Perfil actualizado.');
  }
}
