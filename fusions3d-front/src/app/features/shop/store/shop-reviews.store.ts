import { computed, inject, Injectable, signal } from '@angular/core';
import { ShopReview, ShopReviewAiSummary, ShopReviewInput, ShopReviewSummary } from '../../../core/models/shop.model';
import { PrintReviewsService } from '../../../core/services/print-reviews.service';
import { AuthStore } from '../../../core/store/auth.store';
import { getErrorMessage } from '../../../shared/utils/error-message.util';
import { ShopPrintStore } from './shop-print.store';

/**
 * Comentarios de la impresión que se está viendo. El filtro por estrellas se aplica en la API.
 * El comentario del usuario conectado va siempre el primero y se guarda aparte (`mine`), para que
 * el botón de editar funcione aunque el filtro lo oculte. Tras cada cambio se actualiza la media
 * de la variante en `ShopPrintStore`.
 */
@Injectable()
export class ShopReviewsStore {
  private readonly api = inject(PrintReviewsService);
  private readonly printStore = inject(ShopPrintStore);
  private readonly auth = inject(AuthStore);
  private printSlug = '';
  private requestId = 0;

  private readonly _reviews = signal<ShopReview[]>([]);
  private readonly _mine = signal<ShopReview[]>([]);
  private readonly _summary = signal<ShopReviewSummary | null>(null);
  private readonly _stars = signal<ReadonlySet<number>>(new Set());
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _saving = signal(false);
  private readonly _formError = signal<string | null>(null);
  private readonly _editing = signal<ShopReview | null>(null);
  private readonly _aiSummary = signal<ShopReviewAiSummary | null>(null);
  private readonly _aiSummaryLoading = signal(false);

  readonly stars = this._stars.asReadonly();
  readonly mine = this._mine.asReadonly();
  readonly summary = this._summary.asReadonly();
  readonly aiSummary = this._aiSummary.asReadonly();
  readonly aiSummaryLoading = this._aiSummaryLoading.asReadonly();
  /** Slugs de las variantes que el usuario ya ha valorado en esta impresión. */
  readonly ratedVariantSlugs = computed(() => new Set(this._mine().map((review) => review.variantSlug)));
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly formError = this._formError.asReadonly();
  readonly editing = this._editing.asReadonly();
  readonly hasFilter = computed(() => this._stars().size > 0);

  /** Comentarios visibles, con el del usuario conectado en primer lugar. */
  readonly reviews = computed(() => {
    const userId = this.auth.user()?.id;
    return [...this._reviews()].sort((a, b) => Number(b.userId === userId) - Number(a.userId === userId));
  });

  async load(printSlug = this.printSlug): Promise<void> {
    this.printSlug = printSlug;
    const id = ++this.requestId;
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.auth.restoreSession();
      const [reviews, mine, summary] = await Promise.all([
        this.api.list(printSlug, [...this._stars()].sort()),
        this.auth.isAuthenticated() ? this.api.getMine(printSlug) : Promise.resolve([]),
        this.api.getSummary(printSlug),
      ]);
      if (id !== this.requestId) return;
      this._reviews.set(reviews);
      this._mine.set(mine);
      this._summary.set(summary);
    } catch (error) {
      if (id === this.requestId) this._error.set(getErrorMessage(error));
    } finally {
      if (id === this.requestId) this._loading.set(false);
    }
  }

  /** Resumen de IA de la impresión. Es opcional: si falla, simplemente no se muestra. */
  async loadAiSummary(printSlug: string): Promise<void> {
    this._aiSummary.set(null);
    this._aiSummaryLoading.set(true);

    try {
      const summary = await this.api.getAiSummary(printSlug);
      if (printSlug === this.printSlug) this._aiSummary.set(summary);
    } catch {
      if (printSlug === this.printSlug) this._aiSummary.set(null);
    } finally {
      if (printSlug === this.printSlug) this._aiSummaryLoading.set(false);
    }
  }

  toggleStar(star: number): void {
    this._stars.update((stars) => {
      const next = new Set(stars);
      if (next.has(star)) next.delete(star);
      else next.add(star);
      return next;
    });
    void this.load();
  }

  canEdit(review: ShopReview): boolean {
    return this.auth.user()?.id === review.userId;
  }

  canDelete(review: ShopReview): boolean {
    return this.canEdit(review) || this.auth.isAdmin();
  }

  startEdit(review: ShopReview): void {
    this._formError.set(null);
    this._editing.set(review);
  }

  cancelEdit(): void {
    this._formError.set(null);
    this._editing.set(null);
  }

  /** Crea el comentario o, si hay uno en edición, actualiza su valoración y texto. */
  async save(input: ShopReviewInput): Promise<boolean> {
    if (this._saving()) return false;

    const editing = this._editing();
    this._saving.set(true);
    this._formError.set(null);

    try {
      const result = editing
        ? await this.api.update(editing._id, { rating: input.rating, comment: input.comment })
        : await this.api.create(this.printSlug, input);

      this.printStore.applyRatingStats(result.variant);
      this._editing.set(null);
      await this.load();
      return true;
    } catch (error) {
      this._formError.set(getErrorMessage(error));
      return false;
    } finally {
      this._saving.set(false);
    }
  }

  async remove(review: ShopReview): Promise<void> {
    try {
      const result = await this.api.remove(review._id);
      this.printStore.applyRatingStats(result.variant);
      if (this._editing()?._id === review._id) this._editing.set(null);
      await this.load();
    } catch (error) {
      this._error.set(getErrorMessage(error));
    }
  }
}
