import { NgxStructureViewerComponent, Source, Locus, Loci, Settings } from '@ngx-structure-viewer';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'page-structure-viewer',
  // Handle dependencies
  imports: [CommonModule, NgxStructureViewerComponent],
  standalone: true,
  // Handle representation
  templateUrl: './page-structure-viewer.component.html',
  styleUrl: './page-structure-viewer.component.scss',
})
export class PageStructureViewerComponent {

  readonly settings: Settings;

  readonly source: Source;

  readonly loci: Loci;

  public highlight: Locus | null = null;

  public select: Locus | null = null;

  constructor() {
    // Define settings
    this.settings = {
      background: '#ffffffff',
      color: '#ffffffcc',
    }
    // Define structure source
    this.source = {
      type: 'remote',
      binary: false,
      label: '7PRN',
      link: 'https://files.rcsb.org/view/7PRN.cif',
      format: 'mmcif',
    };
    // Define loci on structure
    this.loci = [
      { start: '1',   end: '289', chain: 'A', color: '#6f42c1' },   // Region
      { start: '1',   end: '40',  chain: 'A', color: '#0d6efd' },   // Unit (even)
      { start: '41',  end: '75',  chain: 'A', color: '#dc3545' },   // Unit (odd)
      { start: '76',  end: '138', chain: 'A', color: '#0d6efd' },
      { start: '84',  end: '130', chain: 'A', color: '#ffc107' },   // Insertion
      { start: '139', end: '172', chain: 'A', color: '#dc3545' },
      { start: '173', end: '202', chain: 'A', color: '#0d6efd' },
      { start: '203', end: '232', chain: 'A', color: '#dc3545' },
      { start: '233', end: '263', chain: 'A', color: '#0d6efd' },
      { start: '264', end: '289', chain: 'A', color: '#dc3545' },
    ];
  }
}
