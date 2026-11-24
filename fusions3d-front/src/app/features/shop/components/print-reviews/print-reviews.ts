import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, ElementRef, inject, input, untracked, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ShopReview, ShopVariant } from '../../../../core/models/shop.model';
import { AuthStore } from '../../../../core/store/auth.store';
import { UserAvatar } from '../../../../shared/components/user-avatar/user-avatar';
import { ShopReviewsStore } from '../../store/shop-reviews.store';
import { StarRating } from '../star-rating/star-rating';

/** Valoraciones de la impresión: filtro por estrellas, lista y modal para escribir o editar. */
@Component({
  selector: 'app-print-reviews',
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, RouterLink, StarRating, UserAvatar],
  providers: [ShopReviewsStore],
  templateUrl: './print-reviews.html',
})
export class PrintReviews {
  readonly printSlug = input.required<string>();
  readonly variants = input.required<ShopVariant[]>();

  protected readonly store = inject(ShopReviewsStore);
  protected readonly auth = inject(AuthStore);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly form = this.fb.nonNullable.group({
    variantSlug: ['', Validators.required],
    rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  constructor() {
    void this.auth.restoreSession();

    effect(() => {
      const slug = this.printSlug();
      untracked(() => {
        void this.store.load(slug);
        void this.store.loadAiSummary(slug);
      });
    });

    effect(() => {
      const variants = this.variants();
      untracked(() => {
        if (!this.form.controls.variantSlug.value && variants.length > 0) {
          this.form.controls.variantSlug.setValue(variants[0].slug);
        }
      });
    });
  }

  protected variantLabel(variant: ShopVariant): string {
    return `${variant.color} · ${variant.materialId?.name ?? '—'} · ${variant.sku}`;
  }

  protected reviewVariantLabel(review: ShopReview): string {
    if (!review.variantColor) return '';
    return `${review.variantColor} · ${review.materialName ?? '—'}`;
  }

  protected initialOf(username: string | null): string {
    return username?.charAt(0).toUpperCase() ?? '?';
  }

  protected setRating(rating: number): void {
    this.form.controls.rating.setValue(rating);
    this.form.controls.rating.markAsTouched();
  }

  protected toggleStar(star: number): void {
    this.store.toggleStar(star);
  }

  protected readonly allRated = computed(() => {
    const variants = this.variants();
    const rated = this.store.ratedVariantSlugs();
    return variants.length > 0 && variants.every((variant) => rated.has(variant.slug));
  });

  protected isRated(variant: ShopVariant): boolean {
    return this.store.ratedVariantSlugs().has(variant.slug);
  }

  protected openCreate(): void {
    this.store.cancelEdit();
    this.resetForm();
    this.dialog().nativeElement.showModal();
  }

  protected openEdit(review: ShopReview): void {
    this.store.startEdit(review);
    this.form.reset({
      variantSlug: review.variantSlug ?? '',
      rating: review.rating,
      comment: review.comment,
    });
    this.form.controls.variantSlug.disable();
    this.dialog().nativeElement.showModal();
  }

  protected closeModal(): void {
    this.dialog().nativeElement.close();
  }

  /** Se ejecuta al cerrar el modal por cualquier motivo (botón, Escape o guardado). */
  protected onDialogClosed(): void {
    this.store.cancelEdit();
    this.resetForm();
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { variantSlug, rating, comment } = this.form.getRawValue();
    const saved = await this.store.save({ variantSlug, rating, comment: comment.trim() });
    if (saved) this.closeModal();
  }

  protected async remove(review: ShopReview): Promise<void> {
    if (!window.confirm('¿Seguro que quieres borrar esta valoración?')) return;
    await this.store.remove(review);
  }

  /** Mensaje del campo si el usuario ya lo ha tocado y no es válido. */
  protected fieldError(field: 'rating' | 'comment'): string | null {
    const control = this.form.controls[field];
    if (!control.touched || control.valid) return null;

    if (field === 'rating') return 'Elige una valoración de 1 a 5 estrellas.';
    if (control.hasError('required')) return 'Escribe un comentario para publicar tu valoración.';
    return 'El comentario no puede superar los 1000 caracteres.';
  }

  private resetForm(): void {
    const firstFree = this.variants().find((variant) => !this.isRated(variant));
    this.form.reset({ variantSlug: firstFree?.slug ?? '', rating: 0, comment: '' });
    this.form.controls.variantSlug.enable();
  }
}
