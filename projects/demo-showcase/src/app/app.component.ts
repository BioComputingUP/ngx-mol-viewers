// import { NgxStructureViewerComponent } from 'ngx-structure-viewer';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Component } from '@angular/core';
import { NgxFeaturesViewerComponent } from '../../../ngx-features-viewer/src/public-api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NgxFeaturesViewerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  // TODO Define demo title
  title = 'demo-showcase';
  
  // // TODO Define source protein (structure viewer)
  // public readonly source = {
  //   // Define path to .cif file
  //   data: 'https://files.rcsb.org/view/1CU4.cif',
  //   // Define label
  //   label: '1CU4',
  //   // Data is not compressed
  //   compressed: false,
  // }

  // // Define loci (structure viewer)
  // public readonly loci = [
  //   { start: '1', end: '10', chain: 'A', color: '#ff0000' },
  //   { start: '11', end: '20', chain: 'A', color: '#00ff00' },
  //   { start: '21', end: '30', chain: 'A', color: '#0000ff' },
  // ];

  // // TODO Define contacts (structure viewer)
  // public readonly contacts = [];

  // Define sequence (features viewer)
  public readonly sequence = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  // Define features (features viewer)
  public readonly features = [
    { id: 0, type: 'continuous' as const, values: [ 0.4, 18, -4, 6, 3.2, 11, -20 ]},
    { id: 1, type: 'loci' as const, values: [{ start: 1, end: 3 }, { start: 5, end: 6 }] },
    { id: 2, type: 'pins' as const, values: [ true, true, false, true, false, false, true ], parent: 1 },
    // { type: 'dssp' as const, values: ['H', 'H', '-', 'E', 'E', 'E', '-'] as Array<'H' | 'E' | '-'>},
    { id: 3, type: 'loci' as const, values: [{ start: 1, end: 2 }, { start: 3, end: 3 }], parent: 1 },
  ];
}
