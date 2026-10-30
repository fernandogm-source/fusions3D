import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Profile, ProfilePayload } from '../models/profile.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api = inject(ApiService);
  private readonly resource = '/profiles';

  get(): Observable<Profile> {
    return this.api.get<Profile>(`${this.resource}/getprofile`);
  }

  update(payload: ProfilePayload): Observable<Profile> {
    return this.api.patch<Profile>(`${this.resource}/updateprofile`, payload);
  }
}
