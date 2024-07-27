import { ThemeSelectorService } from '../theme-selector/theme-selector.service';
import { Locus, Settings } from '@ngx-structure-viewer';
import { Component } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'page-structure-viewer',
  // Handle representation
  templateUrl: './page-structure-viewer.component.html',
  styleUrl: './page-structure-viewer.component.scss',
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

  // NOTE Used the IBM colorblind palette
  readonly loci: Locus[] = [
    // { chain: 'A',                           color: '#ff000080' },  // Color chain A (only chain available)
    { start: '1',   end: '4',   chain: 'A', color: '#648FFF80' },  // Color first beta strand
    { start: '32',  end: '35',  chain: 'A', color: '#785EF080' },  // Color second beta strand
    { start: '23',  end: '30',  chain: 'A', color: '#DC267F80' },  // Color first alpha helix
    { start: '7',   end: '19',  chain: 'A', color: '#FE610080' },  // Color second alpha helix
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

}
