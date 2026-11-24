import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ProfileLikesResponse } from '../models/profile-likes.model';
import { ApiService } from './api.service';

/** Likes del usuario autenticado (`/api/profiles/likes`). */
@Injectable({ providedIn: 'root' })
export class ProfileLikesService {
  private readonly api = inject(ApiService);

  list(page: number, limit: number): Promise<ProfileLikesResponse> {
    return firstValueFrom(this.api.get<ProfileLikesResponse>('/profiles/likes', { page, limit }));
  }
}
