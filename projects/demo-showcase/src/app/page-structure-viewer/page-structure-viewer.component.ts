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

  // readonly settings: Settings;

  // readonly source$: Observable<{
  //   // Define local source (structure)
  //   local: Source,
  //   // Define remote source (structure)
  //   remote: Source
  // }>;

  // readonly loci: Loci;

  // public highlight: Locus | null = null;

  // public select: Locus | null = null;

  // constructor() {
  //   // Define settings
  //   this.settings = {
  //     background: '#2b3035ff',
  //     color: '#6ea8fecc',
  //   };

  //   // Define source retrieval pipeline
  //   this.source$ = this.http.get('assets/8vap.A.cif', { responseType: 'text' }).pipe(
  //     // Cast  data to blob
  //     map((data: string) => new Blob([data], { type: 'text/plain' })),
  //     // Provide local, remote source
  //     map((data: Blob) => ({
  //       // Define local source
  //       local: {
  //         type: 'local' as const,
  //         format: 'mmcif' as const,
  //         label: '8VAP',
  //         binary: false,
  //         data
  //       },
  //       remote: {
  //         type: 'remote' as const,
  //         format: 'mmcif' as const,
  //         label: '8VAP',
  //         binary: false,
  //         link: 'https://files.rcsb.org/view/8VAP.cif',
  //       },
  //     })),
  //     // Cache result
  //     shareReplay(1),
  //   );

  //   const chains = [
  //     { chain: 'A', color: '#6f42c1' },
  //     { chain: 'B', color: '#0d6efd' },
  //     { chain: 'C', color: '#dc3545' },
  //     { chain: 'D', color: '#ffc107' },
  //     { chain: 'E', color: '#28a745' },
  //     { chain: 'F', color: '#17a2b8' },
  //     { chain: 'G', color: '#fd7e14' },
  //   ];
  //   // Define chains observable
  //   this.chains$ = interval(10000).pipe(
  //     // Copy chains
  //     map(() => chains.slice()),
  //     // Shuffle chains list
  //     map((chains) => chains.sort(() => Math.random() - 0.5)),
  //     // Set initial value
  //     startWith(chains),
  //     // Cache result
  //     shareReplay(1),
  //   );

  //   // Define loci on structure
  //   this.loci = [
  //     { start: '1', end: '289', chain: 'A', color: '#6f42c1' },   // Region
  //     { start: '1', end: '40', chain: 'A', color: '#0d6efd' },   // Unit (even)
  //     { start: '41', end: '75', chain: 'A', color: '#dc3545' },   // Unit (odd)
  //     { start: '76', end: '138', chain: 'A', color: '#0d6efd' },
  //     { start: '84', end: '130', chain: 'A', color: '#ffc107' },   // Insertion
  //     { start: '139', end: '172', chain: 'A', color: '#dc3545' },
  //     { start: '173', end: '202', chain: 'A', color: '#0d6efd' },
  //     { start: '203', end: '232', chain: 'A', color: '#dc3545' },
  //     { start: '233', end: '263', chain: 'A', color: '#0d6efd' },
  //     { start: '264', end: '289', chain: 'A', color: '#dc3545' },
  //   ];
  // }
}
