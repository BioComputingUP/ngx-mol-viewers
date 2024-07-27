import { ThemeSelectorService } from '../theme-selector/theme-selector.service';
import { Settings } from '@ngx-structure-viewer';
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
    'backbone-color': '#ff0000',  // '#1a1d20',
  };

  readonly DARK: Partial<Settings> = {
    'background-color': '#1a1d20',
    'backbone-color': '#00ff00',  // '#dee2e6',
  };

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
