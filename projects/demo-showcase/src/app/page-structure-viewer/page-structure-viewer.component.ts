import { NgxStructureViewerComponent, Source, Loci } from '@ngx-structure-viewer';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-page-structure-viewer',
  standalone: true,
  imports: [CommonModule, NgxStructureViewerComponent],
  templateUrl: './page-structure-viewer.component.html',
  styleUrl: './page-structure-viewer.component.scss'
})
export class PageStructureViewerComponent {

  readonly source: Source;

  readonly loci: Loci;

  constructor() {
    // Define structure source
    this.source = {
      type: 'remote',
      binary: false,
      label: '1CU4',
      link: 'https://files.rcsb.org/view/1CU4.cif',
      format: 'mmcif',
    };
    // Define loci on structure
    this.loci = [
      { start: '1', end: '10', chain: 'L', color: '#ff0000' },
      { start: '11', end: '20', chain: 'L', color: '#00ff00' },
      { start: '21', end: '30', chain: 'L', color: '#0000ff' },
    ];
  }
}
