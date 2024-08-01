import { ThemeSelectorService } from '../theme-selector/theme-selector.service';
import { Locus, Settings, Source } from '@ngx-structure-viewer';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BehaviorSubject, map, Observable, shareReplay } from 'rxjs';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'page-structure-viewer',
  // Handle representation
  templateUrl: './page-structure-viewer.component.html',
  styleUrl: './page-structure-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageStructureViewerComponent {

  readonly LIGHT: Partial<Settings> = {
    'background-color': '#dee2e6',
    'backbone-color': '#1a1d2080',
  };

  readonly DARK: Partial<Settings> = {
    'background-color': '#1a1d20',
    'backbone-color': '#dee2e680',
  };

  // Define source
  source$ = new BehaviorSubject<Source>({
    link: 'https://files.rcsb.org/download/1UBQ.cif',
    format: 'mmcif',
    type: 'remote',
    label: '3HHR',
    binary: false
  });

  // NOTE Used the IBM colorblind palette
  loci: Locus[] = [
    // { chain: 'A',                           color: '#ff000080' },  // Color chain A (only chain available)
    { start: '43',   end: '43',   chain: 'A', color: '#648fff' },  // Color first beta strand
    { start: '43',   end: '43',   chain: 'B', color: '#ff048b' },  // Color first beta strand
    // { start: '32',  end: '35',  chain: 'A', color: '#785EF080' },  // Color second beta strand
    // { start: '23',  end: '30',  chain: 'A', color: '#DC267F80' },  // Color first alpha helix
    // { start: '7',   end: '19',  chain: 'A', color: '#FE610080' },  // Color second alpha helix
  ];

  public settings$: Observable<Partial<Settings>>;

  constructor(public themeSelectorService: ThemeSelectorService) {
    // Define settings observable
    this.settings$ = this.themeSelectorService.theme$.pipe(
      // Map theme to settings
      map((theme) => theme === 'light' ? this.LIGHT : this.DARK),
      // Cache results
      shareReplay(1),
    );
  }

  changeSource() {
    this.source$.next({
      link: 'https://files.rcsb.org/download/3HHR.cif',
      format: 'mmcif',
      type: 'remote',
      label: '3HHR',
      binary: false
    });  // Change source


    const locis = [
      { start: '1',   end: '10',   chain: 'A', color: '#2fe500' },  // Color first beta strand
      { start: '10',   end: '20',   chain: 'A', color: '#5e46c7' },  // Color first beta strand
      { start: '20',   end: '30',   chain: 'A', color: '#b71db0' },  // Color first beta strand
    ]

    const idx = Math.random() * locis.length | 0;

    this.loci = [locis[idx]];
    console.log("changing loci", this.loci)
  }
}
