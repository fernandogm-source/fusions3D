import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { getErrorMessage } from '../../shared/utils/error-message.util';
import { Profile, ProfilePayload } from '../models/profile.model';
import { ProfileService } from '../services/profile.service';
import { AuthStore } from './auth.store';

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly service = inject(ProfileService);
  private readonly auth = inject(AuthStore);
  private readonly _profile = signal<Profile | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  readonly profile = this._profile.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      this._profile.set(await firstValueFrom(this.service.get()));
    } catch (error) {
      this._error.set(getErrorMessage(error));
    } finally {
      this._loading.set(false);
    }
  }

  async save(payload: ProfilePayload): Promise<boolean> {
    this._error.set(null);
    try {
      this._profile.set(await firstValueFrom(this.service.update(payload)));
      if (payload.username !== undefined) await this.auth.refreshSession();
      return true;
    } catch (error) {
      this._error.set(getErrorMessage(error));
      return false;
    }
  }
}
