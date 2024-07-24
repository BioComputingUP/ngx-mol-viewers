import { ThemeSelectorService } from '../theme-selector/theme-selector.service';
import { map, Observable, shareReplay } from 'rxjs';
import { Settings } from '@ngx-sequence-viewer';
import { Component } from '@angular/core';

@Component({
  selector: 'app-single-sequence-viewer',
  templateUrl: './single-sequence-viewer.component.html',
  styleUrl: './single-sequence-viewer.component.scss'
})
export class SingleSequenceViewerComponent {

    // Define initial settings
    readonly settings: Partial<Settings> = {
      // Set background, text color
      'background-color': '#FFFFFF',
      'text-color': 'black',
      // Rotate index
      'rotate-index': true,
      // Disable splitting into chunks
      'chunk-size': -1,
    };

    // Define test sequence
    readonly sequence = 'MTEITAAMVKELRESTGAGMMDCKNALSETNGDFDKAVQLLREKGLGKAAKKADRLAAEG';

    // Define custom index
    readonly index = this.sequence.split('').map((v, i) => {
      // Initialize index to be returned
      let index = '' + i;
      // If value is a vowel, then add it to the index
      if (['A', 'E', 'I', 'O', 'U'].includes(v)) {
        index = index + v;
      }
      // If index is even, then return negative index
      if (i % 2 === 1) {
        index = '-' + index;
      }
      // Return changed index
      return index;
    });

    // Define the sequence viewer configuration
    public settings$: Observable<Partial<Settings>>;
  
    // Dependency injection
    constructor(public themeSelectorService: ThemeSelectorService) {
      // Define theme retrieval pipeline
      const theme$ = this.themeSelectorService.theme$;
      // Define the settings observable
      this.settings$ = theme$.pipe(
        // Get theme from document
        map(() => document.documentElement.getAttribute('data-bs-theme') as 'dark' | 'light'),
        // Map theme to settings
        map((theme) => {
          // Case theme is dark
          if (theme === 'dark') {
            // Then return dark parameters
            return { ...this.settings, 'background-color': '#212529', 'text-color': 'white' };
          }
          // Otherwise, return light parameters
          return this.settings;
        }),
        // Cache results
        shareReplay(1),
      );
    }

}
