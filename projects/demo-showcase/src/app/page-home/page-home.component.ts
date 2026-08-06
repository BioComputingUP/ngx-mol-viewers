import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  templateUrl: './page-home.component.html',
  styleUrl: './page-home.component.scss',
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'page-home',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class PageHomeComponent {}
