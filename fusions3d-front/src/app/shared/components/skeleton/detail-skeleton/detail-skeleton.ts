import { Component } from '@angular/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

/** Skeleton de la ficha de impresión mientras se carga el detalle. */
@Component({
  selector: 'app-detail-skeleton',
  imports: [NgxSkeletonLoaderModule],
  templateUrl: './detail-skeleton.html',
})
export class DetailSkeleton {}
