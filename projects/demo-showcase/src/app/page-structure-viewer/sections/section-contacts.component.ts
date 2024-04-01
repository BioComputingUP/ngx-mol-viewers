import { NgxStructureViewerComponent, Source, Settings } from '@ngx-structure-viewer';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-section-contacts',
  standalone: true,
  imports: [
    NgxStructureViewerComponent,
    CommonModule,
  ],
  templateUrl: './section-contacts.component.html',
  styleUrl: './section-contacts.component.scss'
})
export class SectionContactsComponent {

  readonly settings: Settings = {
    'background-color': '#2b3035ff',
    'backbone-color': '#6ea8fecc',
  };

  readonly source: Source = {
    type: 'remote',
    format: 'mmcif',
    label: '8VAP.A',
    binary: false,
    link: '../assets/8vap.A.cif',
  };

  // NOTE An interactor can be defined by one of the following properties:
  // 1. identifier (e.g. 1)
  // 2. x, y, z coordinates (e.g. [1, 2, 3])
  // 3. chain, residue, atom id (e.g. ['A', 1, 'CA'])
  readonly contacts = [
    { 
      a: { x: 165.36768, y: 188.18981, z: 113.00826 }, 
      b: { x: 160.33379, y: 162.30181, z: 108.49545 },
    },
  ];

  constructor() {

  }

}
