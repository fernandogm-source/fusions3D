import { Component, input } from '@angular/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

/** Skeleton de la tabla de impresiones mientras se cargan los datos. */
@Component({
  selector: 'app-table-skeleton',
  imports: [NgxSkeletonLoaderModule],
  templateUrl: './table-skeleton.html',
})
export class TableSkeleton {
  readonly rows = input<number>(6);

  protected get items(): number[] {
    return Array.from({ length: this.rows() }, (_, i) => i);
  }
}
