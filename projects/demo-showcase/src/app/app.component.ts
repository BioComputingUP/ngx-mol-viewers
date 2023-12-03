import { NgxStructureViewerComponent } from 'ngx-structure-viewer';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NgxStructureViewerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  // TODO Define demo title
  title = 'demo-showcase';
  
  // TODO Define source protein
  public readonly source = {
    // Define path to .cif file
    data: 'https://files.rcsb.org/view/1CU4.cif',
    // Define label
    label: '1CU4',
    // Data is not compressed
    compressed: false,
  }

  // Define loci
  public readonly loci = [
    { start: '1', end: '10', chain: 'A', color: '#ff0000' },
    { start: '11', end: '20', chain: 'A', color: '#00ff00' },
    { start: '21', end: '30', chain: 'A', color: '#0000ff' },
  ];

  // TODO Define contacts
  public readonly contacts = [];
}
