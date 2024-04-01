import { NgxStructureViewerComponent, Source, Settings, Interaction } from '@ngx-structure-viewer';
import { Observable, interval, map, shareReplay, startWith } from 'rxjs';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra';
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
    'backbone-color': '#6ea8fe40',
    'interaction-color': '#ff0000ff',
    'interaction-size': .25,
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
  protected interactions: Interaction[] = [
    { 
      from: { coordinates: Vec3.create(165.36768, 188.18981, 113.00826) }, 
      to: { coordinates: Vec3.create(160.33379, 162.30181, 108.49545 ) },
      color: '#ff4500',
    },
    { 
      from: { 'atom.id': 211 },
      to: { 'atom.id': 374 },
      color: '#adff2f'
    },
    {
      from: { 'chain.id': 'A', 'residue.id': '148', 'atom.name': 'CA' },
      to: { 'chain.id': 'A', 'residue.id': '89', 'atom.name': 'CD' },
      color: '#8a2be2'
    }
  ];

  readonly interactions$: Observable<Interaction[]>;

  constructor() {
    // Each 3 seconds, select just one interaction
    this.interactions$ = interval(3000).pipe(
      // Shuffle the interactions
      map(() => this.interactions.sort(() => Math.random() - 0.5)),
      // Select the first interaction
      map(interactions => [interactions[0]]),
      // Set the first interaction as the initial value
      startWith([this.interactions[0]]),
      // Cache result
      shareReplay(1),
    );
  }

}
