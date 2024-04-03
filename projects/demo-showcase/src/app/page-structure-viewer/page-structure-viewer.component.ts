import { SectionInteractionsComponent } from './sections/section-interactions.component';
import { SectionSourcesComponent } from './sections/section-sources.component';
import { SectionChainsComponent } from './sections/section-chains.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SectionHighlightsComponent } from './sections/section-highlights.component';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'page-structure-viewer',
  // Handle dependencies
  imports: [
    // NgxStructureViewerComponent,
    // HttpClientModule,
    SectionInteractionsComponent,
    SectionHighlightsComponent,
    SectionSourcesComponent,
    SectionChainsComponent,
    RouterModule,
    CommonModule,
  ],
  standalone: true,
  // Handle representation
  templateUrl: './page-structure-viewer.component.html',
  styleUrl: './page-structure-viewer.component.scss',
})
export class PageStructureViewerComponent {
}
