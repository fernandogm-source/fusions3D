import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Página 404. */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.html',
})
export class NotFound {}
